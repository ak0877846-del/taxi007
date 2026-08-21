import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { requestTrip, RequestTripInput } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import type { VehicleClass } from '../../../shared/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const VEHICLE_CLASSES: { value: VehicleClass; label: string }[] = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'EXECUTIVE', label: 'Executive' },
  { value: 'WHEELCHAIR_ACCESSIBLE', label: 'Accessible' },
  { value: 'MPV', label: 'MPV / 6-seat' },
];

export default function HomeScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>('STANDARD');
  const [loading, setLoading] = useState(false);

  // Geocoding a typed address to lat/lng is out of scope for this scaffold —
  // wire a places-autocomplete field here and populate these from its result.
  const submit = async () => {
    if (!pickup.trim() || !dropoff.trim()) {
      Alert.alert('Add both stops', 'Enter a pickup and a drop-off to continue.');
      return;
    }
    setLoading(true);
    try {
      const input: RequestTripInput = {
        pickupAddress: pickup,
        dropoffAddress: dropoff,
        pickupLat: 51.5308, pickupLng: -0.1238, // placeholder — replace with geocoded coords
        dropoffLat: 51.5045, dropoffLng: -0.0197,
        vehicleClass,
      };
      const trip: any = await requestTrip(input);
      navigation.navigate('TripTracking', { tripId: trip.id });
    } catch (err: any) {
      Alert.alert('Could not request trip', err.message ?? 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Where to?</Text>
        <Pressable onPress={logout}><Text style={styles.logout}>Sign out</Text></Pressable>
      </View>

      <Text style={styles.label}>Pickup</Text>
      <TextInput style={styles.input} value={pickup} onChangeText={setPickup} placeholder="King's Cross Station" placeholderTextColor={colors.textDim} />

      <Text style={styles.label}>Drop-off</Text>
      <TextInput style={styles.input} value={dropoff} onChangeText={setDropoff} placeholder="Canary Wharf, E14" placeholderTextColor={colors.textDim} />

      <Text style={styles.label}>Vehicle</Text>
      <View style={styles.chipRow}>
        {VEHICLE_CLASSES.map((v) => (
          <Pressable
            key={v.value}
            onPress={() => setVehicleClass(v.value)}
            style={[styles.chip, vehicleClass === v.value && styles.chipActive]}
          >
            <Text style={[styles.chipText, vehicleClass === v.value && styles.chipTextActive]}>{v.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.button} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Request trip</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { color: colors.text, fontSize: 28, fontWeight: '700' },
  logout: { color: colors.textDim, fontSize: 13, fontFamily: 'monospace' },
  label: { color: colors.textDim, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 1 },
  input: {
    backgroundColor: colors.panel, borderColor: colors.line, borderWidth: 1, borderRadius: 10,
    color: colors.text, padding: 14, fontSize: 15, marginBottom: 18,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  chipActive: { borderColor: colors.amber, backgroundColor: 'rgba(245,166,35,0.1)' },
  chipText: { color: colors.textMuted, fontSize: 13, fontFamily: 'monospace' },
  chipTextActive: { color: colors.amber },
  button: { backgroundColor: colors.amber, borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonText: { color: colors.bg, fontWeight: '700', fontSize: 15 },
});
