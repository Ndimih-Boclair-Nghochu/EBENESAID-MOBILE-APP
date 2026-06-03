# EBENESAID Mobile App

EBENESAID is a multi-role relocation platform for students, residents, housing agents, food suppliers, job partners, transport operators, universities, investors, staff, and admins. This repository contains only the Expo React Native mobile frontend. The backend is the separate Next.js app at `https://ebenesaid.com`.

## Setup

```bash
npm install
cp .env.example .env.local
npx expo start
```

Run on simulators:

```bash
npm run ios
npm run android
```

## Environment Variables

`.env.local`:

```bash
EXPO_PUBLIC_API_URL=https://ebenesaid.com
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
```

The app uses cookie-based sessions with the `eb_session` cookie. Session tokens are never stored in MMKV or AsyncStorage.
For Firebase Storage uploads, copy the backend Hostinger `NEXT_PUBLIC_FIREBASE_*` values and add them to the mobile `.env.local` file with the `EXPO_PUBLIC_` prefix.

## Build

Install EAS CLI, then build:

```bash
npx eas build --platform ios
npx eas build --platform android
npx eas build --platform all
```

## Phase Summary

- Phase 1: Expo SDK 51 foundation, design system, auth flow, cookie session API client, role routing, and portal shells.
- Phase 2: Student and resident portal screens for dashboard, housing, food, jobs, documents, arrival, programs, profile, password, and support.
- Phase 3: Messaging and community screens, including conversations, chat UI, circles, events, buddies, and circle chat.
- Phase 4: Partner portals for agents, suppliers, job partners, transport, universities, investors, and staff.
- Phase 5: Admin portal, push notifications, offline queue, biometric login polish, app store config, assets, and final documentation.

## Role Testing Guide

- `student`: Home, Housing, Jobs, Messages, Profile, Documents, Arrival, Programs, Support.
- `resident`: Student/resident service hub with student-only screens gated where appropriate.
- `agent`: Listings, bookings, verification, profile.
- `supplier`: Menu, orders, payouts, profile.
- `job_partner`: Jobs, applicants, profile.
- `transport`: Fleet, pickups, services, revenue, profile.
- `university`: Programs, applications, AI chat, profile.
- `investor`: Read-only investor dashboard and profile.
- `staff`: Dashboard, users, support, reports, profile.
- `admin`: Dashboard, users, operations, content, settings, and all admin queues.

## Folder Structure

- `app/`: Expo Router route groups for auth and every role portal.
- `src/components/ui/`: Base design system primitives.
- `src/components/partner/`: Shared partner/admin portal UI.
- `src/features/student/`: Student portal helpers and Phase 3 message/community types.
- `src/features/partner/`: Reusable partner/admin screen builders.
- `src/lib/`: API client, storage, query cache, notifications, offline queue, config.
- `src/stores/`: Zustand auth and user profile stores.

## Known Limitations and TODOs

- Replace placeholder app icons and splash assets before app store submission.
- Document and profile uploads use Firebase Storage when the `EXPO_PUBLIC_FIREBASE_*` values are configured, with an inline data URL fallback for local review builds.
- Calendar integration in Community Events is stubbed.
- Admin finance combines multiple endpoint payloads defensively because backend response shapes may vary.
- Push token registration currently PATCHes the student profile endpoint and stores the token locally if a role endpoint does not accept it.

