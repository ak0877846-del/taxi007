/**
 * Shared types — mirror prisma/schema.prisma exactly. Keep this file in
 * sync with the backend schema; both apps import from here so a status
 * string typo fails at compile time instead of at runtime in production.
 */

export type Role = 'customer' | 'driver';

export type TripStatus =
  | 'REQUESTED'
  | 'MATCHING'
  | 'ACCEPTED'
  | 'DRIVER_EN_ROUTE'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED_BY_CUSTOMER'
  | 'CANCELLED_BY_DRIVER'
  | 'NO_DRIVERS_AVAILABLE';

export const TRIP_LIFECYCLE: TripStatus[] = [
  'REQUESTED',
  'MATCHING',
  'ACCEPTED',
  'DRIVER_EN_ROUTE',
  'ARRIVED',
  'IN_PROGRESS',
  'COMPLETED',
];

export type VehicleClass = 'STANDARD' | 'EXECUTIVE' | 'WHEELCHAIR_ACCESSIBLE' | 'MPV';

export type DriverStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';

export type DocumentType =
  | 'PHV_LICENCE'
  | 'INSURANCE'
  | 'MOT'
  | 'DBS_CHECK'
  | 'VEHICLE_REGISTRATION'
  | 'RIGHT_TO_WORK';

export interface Trip {
  id: string;
  customerId: string;
  driverId?: string | null;
  vehicleId?: string | null;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  vehicleClass: VehicleClass;
  status: TripStatus;
  requestedAt: string;
  acceptedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  fareEstimate?: string | null;
  fareFinal?: string | null;
  distanceKm?: string | null;
  durationMin?: number | null;
}

export interface AuthTokens {
  accessToken: string;
  role: Role;
  subjectId: string; // driverId or customerId (userId), from JWT `sub`
}

/** Socket.io event payloads — must match src/dispatch/dispatch.gateway.ts */
export interface JoinPayload {
  role: Role;
  id: string;
}

export interface DriverLocationUpdatePayload {
  driverId: string;
  lat: number;
  lng: number;
  operatorId?: string;
  vehicleClass: VehicleClass;
}
