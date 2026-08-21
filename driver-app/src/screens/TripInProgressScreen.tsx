import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { getTrip, markEnRoute, markArrived, startTrip, completeTrip } from '../api/client';
import { colors } from '../theme';
import type { Trip, TripStatus } from '../../../shared/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TripInProgress'>;

const NEXT_ACTION: Partial<Record<TripStatus, { label: string; call: (tripId: string) => Promise<unknown> }>> = {
  ACCEPTED: { label: 'I\u2019m on my way', call: markEnRoute },
  DRIVER_EN_ROUTE: { label: 'I\u2019ve arrived', call: markArrived },
  ARRIVED: { label: 'Start trip', call: startTrip },
  IN_PROGRESS: { label: 'Complete trip', call: (id) => completeTrip(id) },
};

export default function TripInProgressScreen({ route, navigation }: Props) {
  const { tripId } = route.params;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const refresh = async () => {
    try {
      const t = await getTrip(tripId);
      setTrip(t as Trip);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const poll = setInterval(refresh, 4000);
    return () => clearInterval(poll);
  }, [tripId]);

  useEffect(() => {
    if (trip?.status === 'COMPLETED') {
      Alert.alert('Trip complete', 'Fare has been finalised.', [
        { text: 'Back online', onPress: () => navigation.popToTop() },
      ]);
    }
  }, [trip?.status]);

  const onAction = async () => {
    if (!trip) return;
    const action = NEXT_ACTION[trip.status];
    if (!action) return;
    setActing(true);
    try {
      await action.call(trip.id);
      await refresh();
    } catch (err: any) {
      Alert.alert('Could not update trip', err.message ?? 'Try again.');
    } finally {
      setActing(false);
    }
  };

  if (loading || !trip) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.amber} />
      </View>
    );
  }

  const action = NEXT_ACTION[trip.status];

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>TRIP {trip.id.slice(0, 8).toUpperCase()} · {trip.status.replace(/_/g, ' ')}</Text>
      <Text style={styles.route}>{trip.pickupAddress}</Text>
      <Text style={styles.routeArrow}>↓</Text>
      <Text style={styles.route}>{trip.dropoffAddress}</Text>

      {trip.fareEstimate && <Text style={styles.fare}>Est. fare: £{trip.fareEstimate}</Text>}

      {action && (
        <Pressable style={styles.actionButton} onPress={onAction} disabled={acting}>
          {acting ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.actionText}>{action.label}</Text>}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: colors.amber, fontFamily: 'monospace', fontSize: 11.5, marginBottom: 20 },
  route: { color: colors.text, fontSize: 18, fontWeight: '600' },
  routeArrow: { color: colors.textDim, marginVertical: 4 },
  fare: { color: colors.textMuted, fontFamily: 'monospace', fontSize: 13, marginTop: 16 },
  actionButton: { backgroundColor: colors.amber, borderRadius: 10, padding: 18, alignItems: 'center', marginTop: 'auto' },
  actionText: { color: colors.bg, fontWeight: '700', fontSize: 16 },
});
