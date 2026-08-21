import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import type { VehicleClass } from '../../../shared/types';

/**
 * Mirrors src/dispatch/dispatch.gateway.ts:
 *  - 'join' puts this socket in room `driver:{id}`, matching
 *    notifyDriver(driverId, event, payload) server-side.
 *  - 'driver_location_update' is the one outbound event the gateway
 *    actually defines — it writes straight into Redis via GEOADD, which is
 *    what DispatchService's nearest-driver search reads from. Nothing
 *    works without this being emitted regularly while online.
 *
 * The event name the gateway pushes trip offers under isn't fixed in the
 * scaffold (DispatchService calls notifyDriver with whatever event string
 * the offer logic chooses) — confirm the name with the backend and update
 * the listener below before shipping.
 */
let socket: Socket | null = null;
let locationInterval: ReturnType<typeof setInterval> | null = null;

export function connectDriverSocket(driverId: string): Socket {
  if (socket?.connected) return socket;
  socket = io(SOCKET_URL, { transports: ['websocket'] });

  socket.on('connect', () => {
    socket?.emit('join', { role: 'driver', id: driverId });
  });

  return socket;
}

export function startLocationStream(
  driverId: string,
  vehicleClass: VehicleClass,
  getPosition: () => Promise<{ lat: number; lng: number } | null>,
  intervalMs = 5000,
) {
  stopLocationStream();
  locationInterval = setInterval(async () => {
    const pos = await getPosition();
    if (!pos || !socket?.connected) return;
    socket.emit('driver_location_update', {
      driverId,
      lat: pos.lat,
      lng: pos.lng,
      vehicleClass,
    });
  }, intervalMs);
}

export function stopLocationStream() {
  if (locationInterval) clearInterval(locationInterval);
  locationInterval = null;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  stopLocationStream();
  socket?.disconnect();
  socket = null;
}
