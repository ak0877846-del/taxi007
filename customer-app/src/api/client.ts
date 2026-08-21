import { API_URL } from '../config';
import { getToken } from './authStorage';

/**
 * Thin fetch wrapper. Every path here matches a real route in
 * src/{auth,trips}/*.controller.ts — no endpoint is invented.
 */
async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || res.statusText);
  }
  // Some endpoints (e.g. accept/decline) may return 201/200 with no body.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// ---- auth ----------------------------------------------------------------
export const requestOtp = (phone: string) =>
  request<{ ok: boolean }>('/auth/request-otp', {
    method: 'POST',
    body: { phone, role: 'customer' },
    auth: false,
  });

export const verifyOtp = (phone: string, code: string) =>
  request<{ accessToken: string; sub: string }>('/auth/verify-otp', {
    method: 'POST',
    body: { phone, code, role: 'customer' },
    auth: false,
  });

// ---- trips ------------------------------------------------------------
export interface RequestTripInput {
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  vehicleClass: 'STANDARD' | 'EXECUTIVE' | 'WHEELCHAIR_ACCESSIBLE' | 'MPV';
}

export const requestTrip = (input: RequestTripInput) =>
  request('/trips', { method: 'POST', body: input });

export const getTrip = (tripId: string) => request(`/trips/${tripId}`);

export const cancelTrip = (tripId: string) =>
  request(`/trips/${tripId}/cancel`, { method: 'POST' });

export const rateTrip = (tripId: string, rating: number, comment?: string) =>
  request(`/trips/${tripId}/rate`, { method: 'POST', body: { rating, comment } });
