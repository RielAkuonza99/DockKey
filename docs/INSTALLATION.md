# Installation and self-hosting

## Prerequisites

- Node.js 20.19+
- npm
- Vercel account
- Upstash Redis REST database
- GenCipta API key
- Expo/EAS account for APK builds

## Backend

Deploy `apps/api` as the Vercel project root. Copy `apps/api/.env.example` into the Vercel environment settings and configure the GenCipta auth header/request format using the provider's current documentation or support response. Production requests require Upstash Redis configuration.

## Mobile

Set `EXPO_PUBLIC_API_BASE_URL` to the Vercel backend URL before building. Run the EAS production profile to generate an APK.

## Important

The public source repository does not include a GenCipta API key. Every self-host deployment must provide its own provider key and quota. Do not add secrets to GitHub or Expo public environment variables.
