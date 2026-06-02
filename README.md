# EBENESAID Mobile App

EBENESAID is a multi-role relocation platform for international students, residents, housing agents, food suppliers, employers, transport operators, universities, investors, staff, and admins. This repository contains only the Expo React Native mobile frontend. The backend is the separate Next.js app at `https://ebenesaid.com`.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment example:

   ```bash
   cp .env.example .env.local
   ```

3. Start Expo:

   ```bash
   npx expo start
   ```

## API URL

The app reads `EXPO_PUBLIC_API_URL` from `.env.local`. The default value is:

```bash
EXPO_PUBLIC_API_URL=https://ebenesaid.com
```

Cookie-based sessions use the `eb_session` cookie. Session tokens are never stored in MMKV or AsyncStorage.

## Running Locally

Run on iOS simulator:

```bash
npm run ios
```

Run on Android emulator:

```bash
npm run android
```

## Folder Structure

- `app/` contains Expo Router route groups for auth, bootstrap, and each portal.
- `src/constants/` contains the design system colors, typography, and spacing.
- `src/types/` contains shared API and user types.
- `src/lib/` contains API, query cache, session, and storage helpers.
- `src/stores/` contains Zustand auth and profile stores.
- `src/hooks/` contains auth, offline status, and biometrics hooks.
- `src/components/ui/` contains reusable UI primitives.
- `src/components/layout/` contains screen and portal layout helpers.

