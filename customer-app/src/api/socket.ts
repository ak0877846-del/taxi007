import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config';

/**
 * Mirrors src/dispatch/dispatch.gateway.ts exactly:
 *  - emit 'join' once, right after connecting, so the gateway's
 *    notifyCustomer(customerId, event, payload) can reach this socket.
 *  - listen for whatever event names the trip-lifecycle push uses on the
 *    backend you're pointed at (e.g. 'trip_status_changed',
 *    'driver_offer_accepted') — the gateway class only exposes the two
 *    notify() helpers server-side, so confirm event names with whoever
 *    wires DispatchService → DispatchGateway before shipping.
 */
let socket: Socket | null = null;

export function connectCustomerSocket(customerId: string): Socket {
  if (socket?.connected) return socket;
  socket = io(SOCKET_URL, { transports: ['websocket'] });

  socket.on('connect', () => {
    socket?.emit('join', { role: 'customer', id: customerId });
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
