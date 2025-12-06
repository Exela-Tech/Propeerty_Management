# Security Guidelines

## Database Query Security

### SQL Injection Prevention

**Rule #1: Always use Supabase's query builder methods**

Supabase's query builder provides built-in protection against SQL injection through parameterized queries. Never concatenate user input into queries.

#### ✅ Safe Patterns

```typescript
// Using .eq() for exact matches
const { data } = await supabase
  .from('properties')
  .select('*')
  .eq('id', userId)  // ✅ Safe: value is parameterized

// Using .ilike() for pattern matching
const { data } = await supabase
  .from('properties')
  .select('*')
  .ilike('city', `%${sanitizedCity}%`)  // ✅ Safe: Supabase escapes the value

// Using .gte() and .lt() for ranges
const { data } = await supabase
  .from('expenses')
  .select('*')
  .gte('expense_date', startDate)  // ✅ Safe: value is parameterized
  .lt('expense_date', endDate)

// Using .in() for multiple values
const { data } = await supabase
  .from('properties')
  .select('*')
  .in('status', ['approved', 'pending'])  // ✅ Safe: array is parameterized
```

#### ❌ Unsafe Patterns (Never Do This)

```typescript
// ❌ NEVER: Raw SQL with string concatenation
const { data } = await supabase
  .rpc('custom_query', { 
    sql: `SELECT * FROM properties WHERE city = '${userInput}'`  // ❌ VULNERABLE!
  })

// ❌ NEVER: Building query strings manually
const query = `SELECT * FROM users WHERE email = '${email}'`  // ❌ VULNERABLE!

// ❌ NEVER: Template literals in raw SQL
const { data } = await supabase
  .from('properties')
  .select(`*, ${userInput}`)  // ❌ VULNERABLE!
```

### Input Validation Best Practices

Even though Supabase provides protection, always validate and sanitize user input:

```typescript
// Sanitize string inputs
if (city) {
  const sanitizedCity = city.trim().slice(0, 100)  // Trim and limit length
  query = query.ilike('city', `%${sanitizedCity}%`)
}

// Validate numeric inputs
if (min_bedrooms) {
  const bedrooms = Number.parseInt(min_bedrooms, 10)
  if (!Number.isNaN(bedrooms) && bedrooms >= 0) {
    query = query.gte('bedrooms', bedrooms)
  }
}

// Validate enum values
const validStatuses = ['pending', 'approved', 'rejected']
if (status && validStatuses.includes(status)) {
  query = query.eq('status', status)
}
```

### Date Handling

Use Date objects instead of string interpolation:

```typescript
// ✅ Good: Use Date objects
const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
const endDate = new Date(year, month, 1).toISOString().split('T')[0]

query = query
  .gte('created_at', startDate)
  .lt('created_at', endDate)

// ❌ Avoid: String interpolation (even if values are controlled)
query = query
  .gte('created_at', `${year}-${month.toString().padStart(2, '0')}-01`)
```

## Row Level Security (RLS)

Supabase's RLS policies are defined in SQL but use PostgreSQL's built-in parameter handling, making them safe:

```sql
-- ✅ Safe: PostgreSQL handles auth.uid() securely
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- ✅ Safe: Subqueries use parameterized values
CREATE POLICY "Landlords can view their properties"
  ON public.properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'landlord'
    )
  );
```

## Additional Security Measures

### 1. Rate Limiting
Consider implementing rate limiting for search and filter endpoints to prevent abuse.

### 2. Input Length Limits
Always limit the length of user input to prevent DoS attacks:

```typescript
const MAX_SEARCH_LENGTH = 100
const sanitizedInput = userInput.trim().slice(0, MAX_SEARCH_LENGTH)
```

### 3. Logging Suspicious Patterns
Log queries with unusual patterns for monitoring:

```typescript
if (city.includes('%') || city.includes('_')) {
  console.warn('[Security] Suspicious city search pattern:', city)
}
```

### 4. Regular Security Audits
Periodically scan for potential vulnerabilities:

```bash
# Search for template literals in database queries
grep -r "\.from.*\${" app/ components/
grep -r "\.select.*\${" app/ components/
grep -r "\.rpc.*\${" app/ components/
```

## Testing for SQL Injection

Test your application with these inputs to verify protection:

```
'; DROP TABLE properties; --
' OR '1'='1
%'; DELETE FROM users WHERE '1'='1
admin'--
' UNION SELECT * FROM profiles--
```

All of these should be safely handled by Supabase's parameterized queries.

## Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html)
