import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Switch, Alert, Modal } from 'react-native';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { goOnline, goOffline, acceptTrip, declineTrip } from '../api/client';
import { connectDriverSocket, startLocationStream, stopLocationStream, getSocket } from '../api/socket';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import type { VehicleClass } from '../../../shared/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

interface TripOffer {
  tripId: string;
  pickupAddress: string;
  dropoffAddress: string;
  fareEstimate?: string;
  expiresInSeconds: number;
}

// Every driver profile has one vehicle in this scaffold — swap for a
// vehicle picker once a driver can operate more than one car.
const VEHICLE_CLASS: VehicleClass = 'STANDARD';

export default function HomeScreen({ navigation }: Props) {
  const { driverId, logout } = useAuth();
  const [online, setOnline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [offer, setOffer] = useState<TripOffer | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!driverId) return;
    connectDriverSocket(driverId);
    const socket = getSocket();

    // As with the customer app, the exact event name DispatchService uses
    // when it pushes an offer via notifyDriver(...) isn't fixed in the
    // scaffold — 'trip_offer' is illustrative. Confirm against
    // src/dispatch and rename here.
    socket?.on('trip_offer', (payload: TripOffer) => {
      setOffer(payload);
      setCountdown(payload.expiresInSeconds ?? 15);
    });

    return () => {
      socket?.off('trip_offer');
    };
  }, [driverId]);

  useEffect(() => {
    if (!offer) return;
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(countdownRef.current!);
          setOffer(null); // offer expired — DispatchService falls back to the next driver
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [offer?.tripId]);

  const toggleOnline = async (next: boolean) => {
    if (!driverId) return;
    setBusy(true);
    try {
      if (next) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Location needed', 'Turn on location access to receive trip offers.');
          setBusy(false);
          return;
        }
        await goOnline(driverId);
        startLocationStream(driverId, VEHICLE_CLASS, async () => {
          const pos = await Location.getCurrentPositionAsync({});
          return { lat: pos.coords.latitude, lng: pos.coords.longitude };
        });
      } else {
        await goOffline(driverId);
        stopLocationStream();
      }
      setOnline(next);
    } catch (err: any) {
      Alert.alert('Could not update status', err.message ?? 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  const respondToOffer = async (accept: boolean) => {
    if (!offer) return;
    const tripId = offer.tripId;
    setOffer(null);
    try {
      if (accept) {
        await acceptTrip(tripId);
        navigation.navigate('TripInProgress', { tripId });
      } else {
        await declineTrip(tripId);
      }
    } catch (err: any) {
      Alert.alert('Could not respond', err.message ?? 'The offer may have already expired.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{online ? 'You\u2019re online' : 'You\u2019re offline'}</Text>
        <Pressable onPress={logout}><Text style={styles.logout}>Sign out</Text></Pressable>
      </View>

      <View style={styles.toggleCard}>
        <View>
          <Text style={styles.toggleLabel}>Receive trip offers</Text>
          <Text style={styles.toggleSub}>{online ? 'Streaming location every 5s' : 'Location paused'}</Text>
        </View>
        <Switch
          value={online}
          onValueChange={toggleOnline}
          disabled={busy}
          trackColor={{ false: colors.line, true: colors.amberDim }}
          thumbColor={online ? colors.amber : colors.textDim}
        />
      </View>

      {online && (
        <View style={styles.waitingCard}>
          <Text style={styles.waitingText}>Waiting for a trip request…</Text>
        </View>
      )}

      <Modal visible={!!offer} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.offerCard}>
            <Text style={styles.offerEyebrow}>NEW TRIP · {countdown}s</Text>
            <Text style={styles.offerRoute}>{offer?.pickupAddress}</Text>
            <Text style={styles.offerArrow}>↓</Text>
            <Text style={styles.offerRoute}>{offer?.dropoffAddress}</Text>
            {offer?.fareEstimate && <Text style={styles.offerFare}>Est. £{offer.fareEstimate}</Text>}
            <View style={styles.offerActions}>
              <Pressable style={styles.declineButton} onPress={() => respondToOffer(false)}>
                <Text style={styles.declineText}>Decline</Text>
              </Pressable>
              <Pressable style={styles.acceptButton} onPress={() => respondToOffer(true)}>
                <Text style={styles.acceptText}>Accept</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { color: colors.text, fontSize: 24, fontWeight: '700' },
  logout: { color: colors.textDim, fontSize: 13, fontFamily: 'monospace' },
  toggleCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.lineSoft, borderRadius: 12, padding: 18,
  },
  toggleLabel: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 2 },
  toggleSub: { color: colors.textDim, fontSize: 12, fontFamily: 'monospace' },
  waitingCard: { marginTop: 20, alignItems: 'center', padding: 24 },
  waitingText: { color: colors.textDim, fontFamily: 'monospace', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5,8,15,0.75)', justifyContent: 'flex-end' },
  offerCard: { backgroundColor: colors.panel, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 28, borderTopWidth: 1, borderColor: colors.line },
  offerEyebrow: { color: colors.amber, fontFamily: 'monospace', fontSize: 12, marginBottom: 12, letterSpacing: 1 },
  offerRoute: { color: colors.text, fontSize: 18, fontWeight: '600' },
  offerArrow: { color: colors.textDim, marginVertical: 4 },
  offerFare: { color: colors.textMuted, fontFamily: 'monospace', marginTop: 12, fontSize: 13 },
  offerActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  declineButton: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 16, alignItems: 'center' },
  declineText: { color: colors.textMuted, fontWeight: '600' },
  acceptButton: { flex: 1, backgroundColor: colors.amber, borderRadius: 10, padding: 16, alignItems: 'center' },
  acceptText: { color: colors.bg, fontWeight: '700' },
});
