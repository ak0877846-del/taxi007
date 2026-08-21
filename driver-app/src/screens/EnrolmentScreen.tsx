import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { startEnrolment } from '../api/client';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Enrolment'>;

export default function EnrolmentScreen({ navigation }: Props) {
  const [form, setForm] = useState({
    name: '', phone: '+44 7', phvLicenceNumber: '', licenceAuthority: '',
    licenceExpiry: '', dbsCheckExpiry: '', insuranceExpiry: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const submit = async () => {
    const required = Object.values(form).every((v) => v.trim().length > 0);
    if (!required) {
      Alert.alert('Missing details', 'Every field is needed to start enrolment.');
      return;
    }
    setLoading(true);
    try {
      await startEnrolment({
        ...form,
        phone: form.phone.replace(/\s/g, ''),
        licenceExpiry: new Date(form.licenceExpiry).toISOString(),
        dbsCheckExpiry: new Date(form.dbsCheckExpiry).toISOString(),
        insuranceExpiry: new Date(form.insuranceExpiry).toISOString(),
      });
      Alert.alert(
        'Enrolment started',
        'Upload your documents once approved and an operator admin will review them. You\u2019ll be able to sign in once your account is approved.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err: any) {
      Alert.alert('Could not submit', err.message ?? 'Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <Text style={styles.title}>Driver enrolment</Text>
      <Text style={styles.sub}>Documents (PHV licence, DBS, insurance, MOT) are uploaded after this step — see DriverDocument in the backend schema.</Text>

      <Field label="Full name" value={form.name} onChangeText={set('name')} />
      <Field label="Mobile number" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
      <Field label="PHV licence number" value={form.phvLicenceNumber} onChangeText={set('phvLicenceNumber')} />
      <Field label="Licensing authority" value={form.licenceAuthority} onChangeText={set('licenceAuthority')} placeholder="e.g. Transport for London" />
      <Field label="Licence expiry (YYYY-MM-DD)" value={form.licenceExpiry} onChangeText={set('licenceExpiry')} />
      <Field label="DBS check expiry (YYYY-MM-DD)" value={form.dbsCheckExpiry} onChangeText={set('dbsCheckExpiry')} />
      <Field label="Insurance expiry (YYYY-MM-DD)" value={form.insuranceExpiry} onChangeText={set('insuranceExpiry')} />

      <Pressable style={styles.button} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Submit enrolment</Text>}
      </Pressable>
    </ScrollView>
  );
}

function Field(props: { label: string; value: string; onChangeText: (t: string) => void; placeholder?: string; keyboardType?: any }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        style={styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.textDim}
        keyboardType={props.keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 26, fontWeight: '700', marginBottom: 8 },
  sub: { color: colors.textMuted, fontSize: 13.5, marginBottom: 24, lineHeight: 19 },
  label: { color: colors.textDim, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.panel, borderColor: colors.line, borderWidth: 1, borderRadius: 10,
    color: colors.text, padding: 13, fontSize: 14,
  },
  button: { backgroundColor: colors.amber, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 12, marginBottom: 40 },
  buttonText: { color: colors.bg, fontWeight: '700', fontSize: 15 },
});
