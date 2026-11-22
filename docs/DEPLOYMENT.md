# Deployment guide

## Vercel backend

1. Push the repository to GitHub.
2. Import it into Vercel.
3. Set the Vercel project's Root Directory to `apps/api`.
4. Use Node.js runtime supported by Vercel and the package dependencies.
5. Add `AM_API_KEY`, `AM_API_BASE_URL`, `AM_API_TIMEOUT_MS`, and the Upstash/rate-limit variables from `apps/api/.env.example` to the relevant Vercel environments.
6. Create an Upstash Redis database and configure its REST URL/token.
7. Configure `AM_API_KEY` from the AM API Service dashboard. The provider client documentation specifies JSON POST bodies containing `apiKey`; no custom API-key header or prefix is used by this adapter.
8. Deploy and check `/api/v1/health`.

Central deployment: `APP_MODE=central`.
Self-host deployment: `APP_MODE=selfhost`.

Do not set provider keys in `apps/mobile` or EAS build variables.

## Expo APK

1. Open `apps/mobile` and install dependencies through the monorepo root.
2. Create or link the EAS project (`npx eas-cli init`; commits `extra.eas.projectId` into `app.json`).
3. Set `EXPO_PUBLIC_API_BASE_URL` as an EAS environment variable (`eas env:create`, environments `preview` and `production`, plaintext) to the HTTPS URL of the Vercel backend. The `preview`/`production` profiles in `eas.json` read those environments.
4. Build preview APK: `npx eas-cli build --platform android --profile preview`.
5. Test the full send and verify flow on a physical Android device.
6. Build release APK: `npx eas-cli build --platform android --profile production`.

Both preview and production profiles are configured with `android.buildType=apk`.

## Local development

Run `npx vercel dev` from `apps/api`. Run `npx expo start` from `apps/mobile`. For physical-device testing, use a reachable LAN IP or deployed HTTPS backend rather than `localhost`.

## Release verification order

1. Vercel: deploy, set env vars (including Upstash), then `GET /api/v1/health` must show `configured.provider: true` and `configured.rateLimit: true`.
2. `POST /api/v1/generate` with a real address you own; confirm the email arrives.
3. `POST /api/v1/verify` with both `email` and the copied HTTPS `magicLink`; confirm the provider accepts the link. DockKey deliberately does not forward provider session tokens to the APK.
4. Send more than `RATE_LIMIT_REQUESTS` requests inside the window; expect `429 RATE_LIMITED` with `Retry-After`.
5. Build the `preview` APK, test on a device, then the `production` APK.
6. Confirm no `AM_API_KEY` value appears in EAS environment variables, the repository, or the APK.
