# Rate Limiting Setup

This application implements rate limiting to protect against brute force attacks, DDoS, and payment abuse.

## Configuration

### Production (Recommended)

For production deployments, you **must** configure Upstash Redis:

1. Create an Upstash Redis database at [https://upstash.com](https://upstash.com)
2. Get your Redis REST URL and token
3. Set the following environment variables:
   - `UPSTASH_REDIS_REST_URL` - Your Upstash Redis REST URL
   - `UPSTASH_REDIS_REST_TOKEN` - Your Upstash Redis REST token

### Development

For local development, rate limiting will fall back to in-memory storage. This is suitable for single-instance development but **not recommended for production**.

## Rate Limits

### Authentication Endpoints
- **Sign-up**: 5 attempts per 15 minutes per email/IP
- **Login**: 5 attempts per 15 minutes per email/IP
- **Auth Callback**: 10 attempts per hour per IP

### Payment Endpoints
- **Create Payment Session**: 10 attempts per minute per user
- **Mark Payment as Paid**: 10 attempts per minute per user

## Implementation Details

Rate limiting is implemented using `@upstash/ratelimit` with the following features:

- **Sliding Window Algorithm**: Provides smooth rate limiting
- **Identifier-based**: Uses email/user ID for authenticated requests, IP address for unauthenticated requests
- **Analytics**: Tracks rate limit usage for monitoring

## Error Handling

When rate limits are exceeded, the API returns:
- Error code: `VALIDATION_ERROR`
- Message: "Too many [operation] attempts. Please try again later."
- Details include: limit, remaining attempts, and reset time
