# DockKey project handoff

## Product definition
DockKey is an Android Expo application for the AM API Service email-verification workflow. The user enters an email, requests a verification email, then asks the provider to retrieve the verification result using the same email.

## Locked decisions
- Mobile: Expo + React Native + TypeScript + Expo Router + NativeWind.
- Android distribution: EAS Build, APK output.
- Backend: Vercel Functions in `apps/api`.
- Provider: AM API Service.
- Provider API key: backend environment only; never bundled in the app.
- Distribution: official central APK plus public source code supporting self-hosting.
- Central mode uses the operator's AM API Service key and quota.
- Self-host mode uses the deployer's AM API Service key and quota.
- No user login, admin login, subscriptions, payments, balance, or user-managed API keys.
- Production rate limiting uses Upstash Redis.
- Local history is stored on-device; the backend does not persist request emails.

## Repository layout
- `apps/mobile`: Expo application.
- `apps/api/api`: Vercel serverless routes.
- `packages/contracts`: shared API types.
- `docs`: deployment, installation, API, architecture, and contributing documentation.

## Provider integration boundary
The published client repository documents `POST /api/alightmotion/send-link` with `{ email, apiKey }` and `POST /api/alightmotion/verify-link` with `{ email, magicLink, apiKey }`. The API key is sent in a JSON body by the backend only. Verify requires the HTTPS magic link copied from the email. The provider verify response includes session tokens; DockKey discards them and returns only a normalized status/message.

## Security rules
- Do not put AM API Service credentials in Expo variables, app config, mobile source, GitHub, or logs.
- Public mobile clients are untrusted. Rate limiting is not authentication.
- Production Vercel deployments must have Upstash Redis configured; the API fails closed if distributed rate limiting is unavailable.
- Do not persist raw email requests or verification links on the backend.
- Do not commit `.env`, tokens, keystores, or signing credentials.

## Current implementation
Backend (Vercel Functions) and mobile are implemented. Release-hardening pass done: lazy config with fail-closed behaviour, provider-specific send/verify endpoints and request bodies, sanitized provider errors, pure provider logic with unit tests (`apps/api/tests`), CI and EAS GitHub workflows, EAS environments, app icons.

Still requires external access (not available in the authoring sandbox): npm install and the first CI run, GitHub push, Vercel project + Upstash, real AM API Service key, EAS login (`eas init`, `EXPO_TOKEN`), and the cloud APK build. See `docs/DEPLOYMENT.md`.
