# UK Taxi App — Mobile Apps + Ops Dashboard

Everything the backend scaffold's README pointed at but didn't include:

```
mobile-apps/
├── customer-app/     Expo React Native — rider app
├── driver-app/       Expo React Native — driver app
├── shared/           TypeScript types shared by both, mirroring prisma/schema.prisma
└── ops-dashboard.html   Standalone web monitoring console (see below)
```

Both apps are real Expo/TypeScript projects — `npm install && npx expo
start` in either directory gets you a Metro bundler you can open in Expo Go
or a simulator, provided the backend from the original scaffold is running
somewhere reachable (set `EXPO_PUBLIC_API_URL` in `.env`).

## Why two separate apps, not one

The backend's own README calls out "customer and driver apps" as plural —
they have almost nothing in common at the screen level (a rider requests
and tracks; a driver enrols, goes online, and works a queue of trip
actions), and shipping them as separate App Store / Play Store listings is
the standard shape for this kind of product. They share only `shared/types.ts`.

## What each app actually does

**Customer app** — phone OTP → request a trip → track it through the exact
`TripStatus` enum from the backend, live via socket with a polling fallback
→ rate the driver.

**Driver app** — enrol → phone OTP → toggle online (streams location over
the socket every 5s, which is what the backend's Redis GEOSEARCH matching
depends on) → accept/decline incoming offers → work through
en-route → arrived → start → complete.

Each app's own README lists exactly which backend endpoint powers which
screen, and flags the gaps that come directly from the backend's own
"Outstanding items" list (no document upload flow because there's no
signed-upload-URL endpoint yet, no payment screen because Stripe isn't
wired to trip completion, etc.) — nothing here pretends those are solved.

## Ops monitoring dashboard (`ops-dashboard.html`)

A single-file web app for an operator/dispatcher to watch the fleet — not
something either mobile app does. Open it directly in a browser, no build
step. It ships in **demo mode** by default (simulated drivers and trips, so
you can see it work without a backend running) and has a "Connect backend"
button to point it at a live Socket.io URL and admin JWT.

Two things worth knowing before pointing it at a real backend:

1. `DispatchGateway` in the current scaffold has no admin-facing broadcast
   room — it only pushes to `driver:{id}` and `customer:{id}` rooms. For
   this dashboard to show real positions and trip changes, add an `admin`
   room (or similar) server-side that both are also broadcast into.
2. Admin-only actions the dashboard suggests (force a driver offline,
   cancel a trip) hit the same endpoints already flagged in the backend's
   own roadmap as needing an `AdminGuard` — this dashboard doesn't add
   authorization the backend doesn't already have.

## Not production-ready

Same caveat as the backend itself: admin routes, SMS delivery, payment
capture, and zone pricing are stubbed by design. These apps and the
dashboard consume the backend as documented, but they don't work around
anything the backend hasn't built yet — see the backend's own "Outstanding
items" before any of this sits in front of real drivers or riders.

## Supabase + Netlify deployment

The initial Supabase database design is in [`supabase_schema.sql`](supabase_schema.sql). Run it in the Supabase SQL Editor before connecting the apps. It creates profiles, driver enrolment and documents, vehicles, trips, trip events, ratings, live driver locations, Row Level Security policies, and Realtime publication entries.

Enable phone authentication in Supabase Auth and configure an SMS provider before production use. Create a private Storage bucket named `driver-documents`; document uploads should use a trusted Edge Function or server-side flow that checks the driver's identity.

Trip matching, accepting a trip, fare calculation, and status transitions should run through Supabase Edge Functions or protected database functions. Do not put the Supabase service-role key in Netlify or Expo client code.

For Expo web builds hosted on Netlify, set these environment variables per site:

```text
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

The existing REST and Socket.IO clients still target the original NestJS backend. This schema is the foundation for migrating those clients to Supabase; it does not silently replace the API layer.
