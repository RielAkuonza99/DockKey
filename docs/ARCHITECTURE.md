# DockKey architecture

## Runtime topology

```text
Expo Android APK
    |
    | HTTPS /api/v1
    v
Vercel Functions (apps/api)
    |-- request validation (Zod)
    |-- IP rate limit (Upstash Redis)
    |-- provider adapter
    |-- server-side environment secrets
    |
    v
GenCipta Gateway
    |-- send verification email
    |-- retrieve verification link / oobCode
```

## Central mode

The official APK points to the DockKey operator's Vercel URL. The operator configures one GenCipta API key in Vercel. All APK requests consume that provider key's quota. Users do not configure provider credentials and do not create accounts.

## Self-host mode

A developer forks or downloads the public source, deploys `apps/api` to their own Vercel project, configures their own GenCipta API key and provider auth settings, then builds the Expo app with their own backend URL. The same codebase is used; no separate product fork is required.

## Trust boundaries

- The mobile app is an untrusted public client. Never embed provider secrets, private API tokens, or deployment credentials in it.
- Vercel environment variables hold provider secrets.
- Upstash Redis is required for distributed production rate limiting because Vercel Functions are stateless and may execute on multiple instances.
- The API does not use user/admin authentication. IP rate limiting is abuse mitigation, not user authentication.
- Email addresses are sent to GenCipta only for the requested operation. DockKey does not persist them on the backend.
- Local history is stored on the device and can be cleared by the user.

## API contract

### `GET /api/v1/health`

Returns service status, version, and deployment mode. It does not reveal secret configuration.

### `POST /api/v1/generate`

Request: `{ "email": "user@example.com" }`

Calls the GenCipta send-verification endpoint.

### `POST /api/v1/verify`

Request: `{ "email": "user@example.com" }`

Calls the GenCipta verify-link endpoint. If the provider returns a verification URL or `oobCode`, the backend forwards only those recognized fields to the same requesting client. It does not forward arbitrary provider payloads.

## Provider configuration

See `apps/api/.env.example`. The public documentation currently confirms the send path but does not fully expose the API-key header or verify endpoint details in its rendered example. These settings remain configurable and must be verified before production deployment.
