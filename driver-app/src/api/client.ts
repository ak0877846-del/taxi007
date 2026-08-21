import { API_URL } from '../config';
import { getToken } from './authStorage';

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
    body: { phone, role: 'driver' },
    auth: false,
  });

export const verifyOtp = (phone: string, code: string) =>
  request<{ accessToken: string; sub: string }>('/auth/verify-otp', {
    method: 'POST',
    body: { phone, code, role: 'driver' },
    auth: false,
  });

// ---- enrolment -------------------------------------------------------
export interface StartEnrolmentInput {
  phone: string;
  name: string;
  phvLicenceNumber: string;
  licenceAuthority: string;
  licenceExpiry: string; // ISO date
  dbsCheckExpiry: string;
  insuranceExpiry: string;
}

export const startEnrolment = (input: StartEnrolmentInput) =>
  request('/drivers/enrol', { method: 'POST', body: input, auth: false });

export interface UploadDocumentInput {
  docType: 'PHV_LICENCE' | 'INSURANCE' | 'MOT' | 'DBS_CHECK' | 'VEHICLE_REGISTRATION' | 'RIGHT_TO_WORK';
  fileUrl: string; // uploaded to S3-compatible storage first — see README
  expiryDate?: string;
}

export const uploadDocument = (driverId: string, input: UploadDocumentInput) =>
  request(`/drivers/${driverId}/documents`, { method: 'POST', body: input });

// ---- availability -------------------------------------------------------
export const goOnline = (driverId: string) => request(`/drivers/${driverId}/online`, { method: 'POST' });
export const goOffline = (driverId: string) => request(`/drivers/${driverId}/offline`, { method: 'POST' });

// ---- trips ------------------------------------------------------------
export const getTrip = (tripId: string) => request(`/trips/${tripId}`);
export const acceptTrip = (tripId: string) => request(`/trips/${tripId}/accept`, { method: 'POST' });
export const declineTrip = (tripId: string) => request(`/trips/${tripId}/decline`, { method: 'POST' });
export const markEnRoute = (tripId: string) => request(`/trips/${tripId}/en-route`, { method: 'POST' });
export const markArrived = (tripId: string) => request(`/trips/${tripId}/arrived`, { method: 'POST' });
export const startTrip = (tripId: string) => request(`/trips/${tripId}/start`, { method: 'POST' });
export const completeTrip = (tripId: string, finalDistanceKm?: number, finalDurationMin?: number) =>
  request(`/trips/${tripId}/complete`, { method: 'POST', body: { finalDistanceKm, finalDurationMin } });
