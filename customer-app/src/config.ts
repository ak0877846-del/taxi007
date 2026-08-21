/**
 * Point these at a running instance of the backend from this repo
 * (uk-taxi-app). API_URL is the NestJS HTTP server; SOCKET_URL is the same
 * server — DispatchGateway shares the HTTP port by default.
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? API_URL;
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
