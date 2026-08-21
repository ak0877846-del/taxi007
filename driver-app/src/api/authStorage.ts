import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'uk_taxi_driver_token';
const DRIVER_ID_KEY = 'uk_taxi_driver_id';

export async function saveSession(token: string, driverId: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(DRIVER_ID_KEY, driverId);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getDriverId(): Promise<string | null> {
  return SecureStore.getItemAsync(DRIVER_ID_KEY);
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(DRIVER_ID_KEY);
}
