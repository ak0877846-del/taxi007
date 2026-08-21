import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { TRIP_LIFECYCLE, TripStatus } from '../../../shared/types';

const LABELS: Record<TripStatus, string> = {
  REQUESTED: 'Requested',
  MATCHING: 'Finding a driver',
  ACCEPTED: 'Driver assigned',
  DRIVER_EN_ROUTE: 'Driver on the way',
  ARRIVED: 'Driver has arrived',
  IN_PROGRESS: 'On your way',
  COMPLETED: 'Trip complete',
  CANCELLED_BY_CUSTOMER: 'Cancelled',
  CANCELLED_BY_DRIVER: 'Cancelled by driver',
  NO_DRIVERS_AVAILABLE: 'No drivers available',
};

export default function TripLifecycleRail({ status }: { status: TripStatus }) {
  if (status.startsWith('CANCELLED') || status === 'NO_DRIVERS_AVAILABLE') {
    return (
      <View style={styles.terminalBox}>
        <Text style={styles.terminalText}>{LABELS[status]}</Text>
      </View>
    );
  }

  const idx = TRIP_LIFECYCLE.indexOf(status);

  return (
    <View style={styles.rail}>
      {TRIP_LIFECYCLE.map((step, i) => {
        const done = i < idx;
        const current = i === idx;
        return (
          <View key={step} style={styles.stop}>
            <View style={[styles.node, done && styles.nodeDone, current && styles.nodeCurrent]} />
            <Text style={[styles.label, (done || current) && styles.labelActive]}>{LABELS[step]}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { paddingVertical: 8 },
  stop: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  node: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.bg },
  nodeDone: { borderColor: colors.amberDim, backgroundColor: colors.amberDim },
  nodeCurrent: { borderColor: colors.amber, backgroundColor: colors.amber },
  label: { color: colors.textDim, fontSize: 14, fontFamily: 'monospace' },
  labelActive: { color: colors.text, fontWeight: '600' },
  terminalBox: { padding: 16, borderRadius: 10, backgroundColor: 'rgba(255,107,87,0.08)', borderWidth: 1, borderColor: 'rgba(255,107,87,0.3)' },
  terminalText: { color: colors.alert, fontFamily: 'monospace', fontSize: 14 },
});
