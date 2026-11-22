# DockKey API

Base URL: the deployed Vercel project URL.

## Health

`GET /api/v1/health`

## Send verification email

`POST /api/v1/generate`

```json
{ "email": "user@example.com" }
```

## Retrieve verification result

`POST /api/v1/verify`

```json
{ "email": "user@example.com" }
```

## Error format

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Terlalu banyak permintaan. Coba lagi sebentar."
  }
}
```

The API validates email input, enforces rate limits, normalizes provider errors, and does not return raw provider responses.

## Error codes

| HTTP | Code | Meaning |
| --- | --- | --- |
| 400 | `INVALID_EMAIL` | Body is not `{ "email": <valid email> }` |
| 405 | `METHOD_NOT_ALLOWED` | Wrong HTTP method |
| 429 | `RATE_LIMITED` | DockKey per-IP limit reached (see `Retry-After`) |
| 429 | `PROVIDER_QUOTA_OR_RATE_LIMIT` | GenCipta quota/limit reached |
| 400 | `PROVIDER_REQUEST_FAILED` | Provider rejected the request (sanitized message) |
| 502 | `PROVIDER_AUTH_FAILED` | Provider rejected the backend credentials (details hidden) |
| 502 | `PROVIDER_UNAVAILABLE` / `PROVIDER_REJECTED` | Provider error or unsuccessful result |
| 503 | `PROVIDER_NOT_CONFIGURED`, `PROVIDER_AUTH_NOT_CONFIGURED`, `PROVIDER_ENDPOINT_NOT_CONFIGURED`, `BACKEND_MISCONFIGURED` | Operator configuration missing/invalid |
| 503 | `RATE_LIMIT_NOT_CONFIGURED`, `RATE_LIMIT_UNAVAILABLE` | Upstash missing or failing; the API fails closed |
| 504 | `PROVIDER_TIMEOUT` | Provider did not answer within `GENCIPTA_TIMEOUT_MS` |

Emails are trimmed and lower-cased before being sent to the provider.
