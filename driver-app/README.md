# UK Taxi App — Driver App

Expo (React Native + TypeScript) client for the `uk-taxi-app` backend.
Covers enrolment, phone OTP sign-in, going online/offline, receiving and
responding to trip offers, and working through the trip lifecycle to
completion.

## Screens

| Screen | Backend calls |
|---|---|
| `EnrolmentScreen` | `POST /drivers/enrol` |
| `LoginScreen` | `POST /auth/request-otp` |
| `OtpScreen` | `POST /auth/verify-otp` → stores JWT |
| `HomeScreen` | `POST /drivers/:id/online`, `POST /drivers/:id/offline`, socket `join` + `driver_location_update`, plus accept/decline on an incoming offer |
| `TripInProgressScreen` | `POST /trips/:id/accept`, `/en-route`, `/arrived`, `/start`, `/complete` |

## Getting started

```bash
npm install
cp .env.example .env       # set EXPO_PUBLIC_API_URL to your backend
npx expo start
```

Location permission is requested the first time the driver goes online —
`HomeScreen` then emits `driver_location_update` over the socket every 5
seconds, which is what the backend's Redis GEOADD/GEOSEARCH matching reads
from. Nothing gets offered a trip without this running.

## Known gaps, matching the backend's own "Outstanding items"

- **Document upload**: `EnrolmentScreen` submits the enrolment form only.
  There's no upload screen yet because the backend's `DriverDocument.fileUrl`
  assumes files are already in S3-compatible storage — this app needs a
  signed-upload-URL endpoint before a document picker screen makes sense.
- **Approval status polling**: after enrolling, this app doesn't check
  whether an admin has approved the account yet — trying to sign in before
  approval will just fail at `/auth/verify-otp` or downstream. A
  "pending review" screen that polls driver status would smooth this over.
- **Offer event name**: `HomeScreen` listens for a `trip_offer` socket
  event that isn't a fixed, documented event name in
  `DispatchGateway` — `DispatchService` calls `notifyDriver(...)` with
  whatever string the offer logic uses today. Confirm the real name before
  this goes further than a demo.
- **Background location**: location only streams while the app is in the
  foreground. A driver who backgrounds the app mid-shift will stop
  receiving offers — add `expo-location`'s background mode if that matters
  for your fleet.
- **Earnings / trip history**: no screens for either. Both need new,
  currently-nonexistent backend endpoints (trip history by driver, payout
  summaries) — see the backend's payments gap in its own README.
