import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { rateTrip } from '../api/client';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Rating'>;

export default function RatingScreen({ route, navigation }: Props) {
  const { tripId } = route.params;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const submit = async () => {
    try {
      await rateTrip(tripId, rating, comment || undefined);
    } catch (err: any) {
      Alert.alert('Could not send rating', err.message ?? 'Skipping is fine.');
    } finally {
      navigation.popToTop();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip complete</Text>
      <Text style={styles.sub}>How was it?</Text>

      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)}>
            <Text style={[styles.star, n <= rating && styles.starActive]}>★</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={styles.input}
        value={comment}
        onChangeText={setComment}
        placeholder="Anything worth mentioning? (optional)"
        placeholderTextColor={colors.textDim}
        multiline
      />

      <Pressable style={styles.button} onPress={submit}>
        <Text style={styles.buttonText}>Submit rating</Text>
      </Pressable>
      <Pressable onPress={() => navigation.popToTop()}>
        <Text style={styles.skip}>Skip</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: 'center' },
  title: { color: colors.text, fontSize: 26, fontWeight: '700', marginBottom: 4 },
  sub: { color: colors.textMuted, fontSize: 15, marginBottom: 24 },
  stars: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  star: { fontSize: 34, color: colors.line },
  starActive: { color: colors.amber },
  input: {
    backgroundColor: colors.panel, borderColor: colors.line, borderWidth: 1, borderRadius: 10,
    color: colors.text, padding: 14, fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: 20,
  },
  button: { backgroundColor: colors.amber, borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: colors.bg, fontWeight: '700', fontSize: 15 },
  skip: { color: colors.textDim, textAlign: 'center', fontFamily: 'monospace', fontSize: 12 },
});
