import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { requestOtp } from '../api/client';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('+44 7');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const normalised = phone.replace(/\s/g, '');
    if (!/^\+44\d{10}$/.test(normalised)) {
      Alert.alert('Check your number', 'Enter a full UK mobile number, e.g. +447700900123.');
      return;
    }
    setLoading(true);
    try {
      await requestOtp(normalised);
      navigation.navigate('Otp', { phone: normalised });
    } catch (err: any) {
      Alert.alert('Could not send code', err.message ?? 'Try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>UK TAXI · CUSTOMER</Text>
      <Text style={styles.title}>Your number, please</Text>
      <Text style={styles.sub}>We'll text a 6-digit code to confirm it's you.</Text>

      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="+447700900123"
        placeholderTextColor={colors.textDim}
        autoFocus
      />

      <Pressable style={styles.button} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Send code</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: 'center' },
  eyebrow: { color: colors.amber, fontFamily: 'monospace', fontSize: 12, letterSpacing: 1, marginBottom: 8 },
  title: { color: colors.text, fontSize: 28, fontWeight: '700', marginBottom: 8 },
  sub: { color: colors.textMuted, fontSize: 15, marginBottom: 28, lineHeight: 20 },
  input: {
    backgroundColor: colors.panel, borderColor: colors.line, borderWidth: 1, borderRadius: 10,
    color: colors.text, padding: 16, fontSize: 16, marginBottom: 16, fontFamily: 'monospace',
  },
  button: { backgroundColor: colors.amber, borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonText: { color: colors.bg, fontWeight: '700', fontSize: 15 },
});
