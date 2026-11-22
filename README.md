# DockKey

DockKey is an Expo Android application for the AM API Service AM Generator workflow. The mobile client calls a Vercel Functions backend; the AM API Service API key is stored only in the backend environment and is never bundled into the APK.

## Product behavior

1. The user enters an email in DockKey.
2. DockKey calls `POST /api/v1/generate`.
3. The Vercel function calls AM API Service's send-verification endpoint.
4. The user checks the email and returns to DockKey.
5. The user copies the HTTPS magic link from the email and pastes it into DockKey.
6. DockKey calls `POST /api/v1/verify` with the email and magic link. The backend processes the link and returns only a safe status/message; provider session tokens are discarded.

DockKey has no user login, admin login, in-app payment, subscription, balance, or user-managed provider key.

## Distribution modes

- **Central APK:** the app points to the DockKey-managed Vercel deployment. Requests consume the AM API Service quota of the API key configured by the DockKey operator.
- **Public source / self-host:** developers deploy `apps/api` to their own Vercel project, configure their own AM API Service API key, and build the Expo app with their backend URL.

The same source tree supports both modes. `APP_MODE` is informational (`central` or `selfhost`); it does not change provider credentials by itself.

## Repository layout

```text
apps/mobile/       Expo Router application and EAS APK configuration
apps/api/api/      Vercel serverless API functions
packages/contracts Shared TypeScript API contracts
docs/              Architecture, setup, deployment, and security notes
```

## Quality checks

`npm run check` runs typecheck and unit tests (provider adapter, rate limiting, handler). The **CI** workflow (`npm ci`, secret scan, typecheck, tests, required `expo-doctor`, Android bundle export) blocks on any failure. If `package-lock.json` is missing, run **Bootstrap dependencies** once: it applies `expo install --fix`, regenerates the lockfile, and opens a PR.

### Verification statuses

`/generate` returns `status: accepted`. `/verify` returns `completed` when the provider verify endpoint returns a successful HTTP response. The provider response is allow-listed and session tokens are never forwarded to the mobile client.

## Requirements

- Node.js 20.19 or newer (use a version supported by the installed Expo SDK)
- npm with workspaces support
- Expo account and EAS CLI for cloud APK builds
- Vercel account for backend deployment
- AM API Service API key
- Upstash Redis REST database for production rate limiting

## Local development

Install dependencies from the repository root:

```bash
npm install
```

Run the backend locally:

```bash
cd apps/api
cp .env.example .env
# Fill in AM API Service values and Upstash values for production-like testing.
npx vercel dev
```

Run the mobile app in another terminal:

```bash
cd apps/mobile
cp .env.example .env
# Set EXPO_PUBLIC_API_BASE_URL to the local API URL reachable by your device.
npx expo start
```

For a physical Android device, do not use `localhost` as the API hostname. Use the computer's LAN IP for local testing, or deploy the backend and use its HTTPS URL.

## Deploy backend to Vercel

Create a Vercel project from this repository and set **Root Directory** to `apps/api`. Configure the environment variables listed in `apps/api/.env.example` in Vercel Project Settings. Add a production Upstash Redis database and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

Set `APP_MODE=central` for the official backend or `APP_MODE=selfhost` for a self-hosted backend. Add the AM API Service API key and the exact authentication header configuration confirmed by AM API Service. Deploy.

The API routes are:

- `GET /api/v1/health`
- `POST /api/v1/generate` with `{ "email": "user@example.com" }`
- `POST /api/v1/verify` with `{ "email": "user@example.com" }`

## Build Android APK

Create/link an EAS project from `apps/mobile`, then configure `EXPO_PUBLIC_API_BASE_URL` in the build environment. The production profile is explicitly configured to produce an APK:

```bash
cd apps/mobile
npx eas-cli init
npx eas-cli env:create --name EXPO_PUBLIC_API_BASE_URL --value https://YOUR-BACKEND.vercel.app --environment production --visibility plaintext
npx eas-cli env:create --name EXPO_PUBLIC_API_BASE_URL --value https://YOUR-BACKEND.vercel.app --environment preview --visibility plaintext
npx eas-cli build --platform android --profile production
```

Builds can also be started from GitHub: add the `EXPO_TOKEN` secret and the `API_BASE_URL` repository variable, then run **EAS Android build** (Actions tab). The workflow refuses to build unless the backend health check reports provider and rate limit configured, and it only reports success when EAS returns a FINISHED build with a reachable APK URL.

Do not put `AM_API_KEY` in Expo or `EXPO_PUBLIC_*` variables. Only the public DockKey backend URL belongs in the mobile build.

## Provider integration: AM API Service

DockKey integrates with `https://am-api-service.vercel.app` using the published client contract:

- `POST /api/alightmotion/send-link` with JSON `{ "email": "user@example.com", "apiKey": "..." }`.
- `POST /api/alightmotion/verify-link` with JSON `{ "email": "user@example.com", "magicLink": "https://...", "apiKey": "..." }`.

The API key is added by the DockKey backend and is never included in the APK. The user must copy the HTTPS magic link received by email and paste it into DockKey for the verify operation. The provider's verify response includes session tokens; DockKey intentionally discards provider response fields and returns only a safe status/message to the app.

Configure `AM_API_KEY` in Vercel. The default provider base URL is `https://am-api-service.vercel.app`; override it only if the provider publishes a different gateway. A real send + verify round trip is still required before production release.

## Security

- Provider credentials exist only in Vercel server-side environment variables.
- Do not commit `.env`, Vercel tokens, EAS tokens, or provider keys.
- Production rate limiting requires Upstash Redis; without it the API fails closed instead of silently using per-instance memory limits.
- Rate limiting is IP-based. Since the central API has no user login, a public APK cannot provide a strong identity boundary. Keep strict rate limits and monitor provider quota. Consider adding a bot challenge or attestation before distributing the central APK widely.
- The app stores history locally. The backend does not persist email addresses or request bodies.
- Magic links are sensitive activation material; do not share them or write them to logs.

## License and public repository

The repository can be public on GitHub, but public visibility alone does not grant reuse rights. No license is selected in this starter. Choose and add a license before describing the repository as open source. If the intended model is source-visible but commercial-use restricted, use a source-available/commercial license instead of calling it OSI-approved open source.
