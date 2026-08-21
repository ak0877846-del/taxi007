import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { getTrip, cancelTrip } from '../api/client';
import { connectCustomerSocket, getSocket } from '../api/socket';
import { useAuth } from '../context/AuthContext';
import TripLifecycleRail from '../components/TripLifecycleRail';
import { colors } from '../theme';
import type { Trip, TripStatus } from '../../../shared/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TripTracking'>;

const CANCELLABLE: TripStatus[] = ['REQUESTED', 'MATCHING', 'ACCEPTED', 'DRIVER_EN_ROUTE'];

export default function TripTrackingScreen({ route, navigation }: Props) {
  const { tripId } = route.params;
  const { userId } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const t = await getTrip(tripId);
      setTrip(t as Trip);
    } catch {
      // transient — the socket listener below will usually beat this anyway
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    refresh();
    if (!userId) return;
    connectCustomerSocket(userId);
    const socket = getSocket();

    // Event name here is illustrative — DispatchGateway currently exposes
    // notifyCustomer(customerId, event, payload) server-side without a
    // fixed event name for trip updates. Agree a name (e.g.
    // 'trip_status_changed') with the backend and listen for it here
    // instead of polling.
    socket?.on('trip_status_changed', (payload: Trip) => {
      if (payload.id === tripId) setTrip(payload);
    });

    // Fallback polling every 4s keeps the screen correct even before that
    // event is wired up — safe to remove once the push event lands.
    const poll = setInterval(refresh, 4000);
    return () => {
      clearInterval(poll);
      socket?.off('trip_status_changed');
    };
  }, [tripId, userId, refresh]);

  useEffect(() => {
    if (trip?.status === 'COMPLETED') {
      navigation.replace('Rating', { tripId });
    }
  }, [trip?.status]);

  const onCancel = async () => {
    try {
      await cancelTrip(tripId);
      navigation.popToTop();
    } catch (err: any) {
      Alert.alert('Could not cancel', err.message ?? 'Try again.');
    }
  };

  if (loading || !trip) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.amber} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>TRIP {trip.id.slice(0, 8).toUpperCase()}</Text>
      <Text style={styles.route}>{trip.pickupAddress}</Text>
      <Text style={styles.routeArrow}>↓</Text>
      <Text style={styles.route}>{trip.dropoffAddress}</Text>

      <View style={styles.railCard}>
        <TripLifecycleRail status={trip.status} />
      </View>

      {trip.fareEstimate && (
        <Text style={styles.fare}>Estimated fare: £{trip.fareEstimate}</Text>
      )}

      {CANCELLABLE.includes(trip.status) && (
        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel trip</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: colors.textDim, fontFamily: 'monospace', fontSize: 11, marginBottom: 16 },
  route: { color: colors.text, fontSize: 17, fontWeight: '600' },
  routeArrow: { color: colors.textDim, marginVertical: 4 },
  railCard: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 12, padding: 18, marginTop: 24 },
  fare: { color: colors.textMuted, marginTop: 16, fontFamily: 'monospace', fontSize: 13 },
  cancelButton: { marginTop: 'auto', borderWidth: 1, borderColor: colors.alert, borderRadius: 10, padding: 14, alignItems: 'center' },
  cancelText: { color: colors.alert, fontWeight: '600' },
});
