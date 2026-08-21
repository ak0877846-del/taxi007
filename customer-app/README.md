# UK Taxi App — Customer App

Expo (React Native + TypeScript) client for the `uk-taxi-app` backend.
Covers the customer half of the flow: phone OTP sign-in, requesting a trip,
live-tracking its status, and rating the driver afterwards.

## Screens

| Screen | Backend calls |
|---|---|
| `LoginScreen` | `POST /auth/request-otp` |
| `OtpScreen` | `POST /auth/verify-otp` → stores JWT in `expo-secure-store` |
| `HomeScreen` | `POST /trips` |
| `TripTrackingScreen` | `GET /trips/:id`, `POST /trips/:id/cancel`, socket `join` | 
| `RatingScreen` | `POST /trips/:id/rate` |

## Getting started

```bash
npm install
cp .env.example .env       # set EXPO_PUBLIC_API_URL to your backend
npx expo start
```

Needs a running instance of the backend in this repo — see its own README
for `npm run start:dev`.

## Known gaps, matching the backend's own "Outstanding items"

- **Geocoding**: `HomeScreen` sends placeholder lat/lng alongside the typed
  address. Wire a places-autocomplete field and populate real coordinates
  before this goes further than a demo.
- **Live push vs polling**: `TripTrackingScreen` listens for a
  `trip_status_changed` socket event that isn't emitted by
  `DispatchGateway` yet (it currently only exposes `notifyCustomer(...)` as
  a helper method with no fixed event name). A 4-second poll of `GET
  /trips/:id` covers the gap in the meantime — remove it once that event
  name is agreed with the backend.
- **Payments**: no payment-method screen. The backend's `Payment` model and
  Stripe wiring aren't connected to trip completion yet either — see the
  backend README.
- **Push notifications**: none. A trip accepted/arrived alert while the app
  is backgrounded needs `expo-notifications` and a device token registered
  server-side, which doesn't exist yet.
