import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { verifyOtp } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;

export default function OtpScreen({ route }: Props) {
  const { phone } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const submit = async () => {
    if (code.length !== 6) {
      Alert.alert('Enter the full code', 'It\u2019s 6 digits.');
      return;
    }
    setLoading(true);
    try {
      const { accessToken, sub } = await verifyOtp(phone, code);
      await login(accessToken, sub);
      // RootNavigator swaps to the Home stack automatically once isLoggedIn flips.
    } catch (err: any) {
      Alert.alert('Wrong code', err.message ?? 'Check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>CODE SENT TO {phone}</Text>
      <Text style={styles.title}>Enter the code</Text>

      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="000000"
        placeholderTextColor={colors.textDim}
        autoFocus
      />

      <Pressable style={styles.button} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Verify</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: 'center' },
  eyebrow: { color: colors.textDim, fontFamily: 'monospace', fontSize: 11, marginBottom: 8 },
  title: { color: colors.text, fontSize: 26, fontWeight: '700', marginBottom: 24 },
  input: {
    backgroundColor: colors.panel, borderColor: colors.line, borderWidth: 1, borderRadius: 10,
    color: colors.text, padding: 16, fontSize: 22, letterSpacing: 8, textAlign: 'center',
    marginBottom: 16, fontFamily: 'monospace',
  },
  button: { backgroundColor: colors.amber, borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonText: { color: colors.bg, fontWeight: '700', fontSize: 15 },
});
