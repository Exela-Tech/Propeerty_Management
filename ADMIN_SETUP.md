# Admin System Setup Guide

This property management software is an **internal admin/staff system only**. It is designed for property management companies to manage landlords, owners, properties, units, tenants, maintenance, and payments.

## Important: System Access

- **Landlords are DATA RECORDS** - They are tracked in the system but do NOT have login access
- **Only admin staff** can access this system
- All users who can log in are either admins or staff members

This property management software includes a comprehensive role-based access control system with support for multiple user roles including Super Admin, Admin, Landlord, Tenant, and Maintenance Staff.

## User Roles

### Super Admin
- Full system access
- Can manage all users and promote/demote other admins
- Access to admin panel for user management
- Can create other super admins

### Admin
- Full system access to all features
- Can manage landlords, owners, properties, units, tenants
- Access to maintenance and payment tracking
- Can manage other staff users

### Landlord (Default)
- Can manage their own properties
- Track tenants, maintenance requests, and payments
- Standard dashboard access

### Tenant
- View their own lease information
- Submit maintenance requests
- View payment history

### Maintenance Staff
- View assigned maintenance requests
- Update request status
- Access to maintenance dashboard

### Staff (if needed in future)
- Limited access based on assigned responsibilities
- Can view and update records as permitted

## Creating the First Super Admin

There are **three ways** to create the first super admin:

### Method 1: Using Admin Signup Page (Recommended for Production)

1. Set an admin secret key in your environment variables:
   ```
   ADMIN_SECRET_KEY=your_secure_secret_key_here
   ```
   
   **Important**: Use `ADMIN_SECRET_KEY` (server-side only), NOT `NEXT_PUBLIC_ADMIN_SECRET_KEY`

2. Navigate to `/auth/admin-signup`

3. Fill in the registration form with:
   - Full Name
   - Email
   - Password
   - Admin Secret Key (the one you set in step 1)

4. Click "Create Super Admin Account"

5. Verify your email address

6. Login at `/auth/login`

### Method 2: Using SQL Script (Recommended for First Setup)

1. Create a regular user account at `/auth/sign-up`

2. Verify your email and note your email address

3. In your Supabase dashboard, go to SQL Editor

4. Run the provided SQL script from `scripts/001_create_super_admin.sql`:
   ```sql
   SELECT promote_to_super_admin('your-email@example.com');
   ```

5. The user will now have super admin privileges

### Method 3: Manual Database Update

1. Create a regular user account at `/auth/sign-up`

2. In Supabase dashboard, go to Table Editor → `profiles`

3. Find the user record by email

4. Update the following fields:
   - `role` = `super_admin`
   - `is_admin` = `true`

5. Save the changes

## Managing System Access

Once you have admin access:

1. Login to your account

2. Navigate to the **User Management** link in the Administration section (shield icon)

3. You'll see the User Management page at `/admin/users`

4. From here you can:
   - View all staff users in the system
   - See current roles and permissions
   - Add new staff members
   - Change user roles as needed

## Key Features

### Landlords Section
- Create and manage landlord records for tracking purposes
- View statistics per landlord (properties, units, tenants, revenue)
- Landlords do not have system access - they are just data records

### Owners Section
- Manage property owners separately from landlords
- Track owner contact information
- Link owners to properties

### Properties Section
- Create and manage property records
- Link properties to landlords and owners
- Track property details and location

### Units Section
- Manage individual units within properties
- Track unit availability and rental status
- Set rent amounts per unit

### Tenants Section
- Manage tenant records
- Track lease agreements and payment status
- Link tenants to specific units

## Role Permissions

| Feature | Super Admin | Admin | Staff* |
|---------|-------------|-------|--------|
| Manage all users | ✅ | ✅ | ❌ |
| Create admins | ✅ | ❌ | ❌ |
| Manage landlords | ✅ | ✅ | ✅ |
| Manage owners | ✅ | ✅ | ✅ |
| Manage properties | ✅ | ✅ | ✅ |
| Manage units | ✅ | ✅ | ✅ |
| Manage tenants | ✅ | ✅ | ✅ |
| View maintenance | ✅ | ✅ | ✅ |
| Manage payments | ✅ | ✅ | ✅ |

\* Staff role permissions can be customized based on your needs

\* Admins cannot manage super admins

## Security Features

### Row Level Security (RLS)
All database tables are protected with RLS policies that ensure:
- Landlords can only see their own properties and tenants
- Tenants can only see their own lease and payment information
- Admins have elevated access for management purposes

### Authentication
- Email verification required for all new accounts
- Secure password storage with Supabase Auth
- Protected routes with middleware
- Session management with HTTP-only cookies

### Role-Based Access Control
- Server-side role checking on all protected pages
- Client-side role guards for UI components
- Automatic redirects for unauthorized access

## Environment Variables

Required environment variables (automatically set by Supabase integration):
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Optional for admin signup:
```
ADMIN_SECRET_KEY=your-secret-key
```

## Best Practices

1. **First Super Admin**: Create the first super admin using Method 2 (SQL script) or Method 3 (manual) for better security

2. **Admin Secret Key**: If using the admin signup page in production, use a strong, randomly generated secret key and share it only with trusted administrators

3. **Regular Audits**: Regularly review user roles in the admin panel to ensure proper access levels

4. **Role Assignment**: Start users with the least privileged role (Landlord or Tenant) and promote as needed

5. **Super Admin Limit**: Keep the number of super admins to a minimum (1-3 people)

## Troubleshooting

### Cannot access admin panel
- Verify your account has `is_admin = true` in the profiles table
- Check that your role is either `super_admin` or `admin`
- Clear browser cache and sign out/in again

### Admin signup not working
- Verify `ADMIN_SECRET_KEY` environment variable is set
- Ensure the secret key matches exactly (case-sensitive)
- Check browser console for error messages

### Users not showing in admin panel
- Confirm Supabase connection is active
- Verify RLS policies allow admin access
- Check that profiles are created for all users

## Support

For additional help or issues with the admin system, refer to the Supabase documentation or contact your system administrator.
