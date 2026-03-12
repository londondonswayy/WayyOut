import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../store/slices/authSlice';
import { useTranslation } from '../i18n/LanguageContext';

export default function RegisterScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '',
    role: 'customer', password: '', password_confirm: ''
  });

  const handleRegister = async () => {
    if (!form.full_name || !form.email || !form.password) {
      Alert.alert('Error', t('register.missingFields'));
      return;
    }
    if (form.password !== form.password_confirm) {
      Alert.alert('Error', t('register.pwMismatch'));
      return;
    }
    const result = await dispatch(registerUser(form));
    if (registerUser.rejected.match(result)) {
      Alert.alert(t('register.error'), t('register.errorMsg'));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.subtitle}>{t('register.chooseRole')}</Text>
      <View style={styles.roleRow}>
        {[
          { value: 'customer', label: t('register.explorer') },
          { value: 'venue_owner', label: t('register.venue') },
        ].map((r) => (
          <TouchableOpacity
            key={r.value}
            style={[styles.roleChip, form.role === r.value && styles.roleChipActive]}
            onPress={() => setForm({ ...form, role: r.value })}
          >
            <Text style={[styles.roleText, form.role === r.value && styles.roleTextActive]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {[
        { key: 'full_name', label: t('register.fullName'), placeholder: 'Jane Doe' },
        { key: 'email', label: t('register.email'), placeholder: 'you@example.com', keyboard: 'email-address' },
        { key: 'phone', label: t('register.phone'), placeholder: '+1 234 567 8900', keyboard: 'phone-pad' },
        { key: 'password', label: t('register.password'), placeholder: '••••••••', secure: true },
        { key: 'password_confirm', label: t('register.confirm'), placeholder: '••••••••', secure: true },
      ].map((field) => (
        <View key={field.key}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={styles.input}
            placeholder={field.placeholder}
            placeholderTextColor="#6B7280"
            value={form[field.key]}
            onChangeText={(t) => setForm({ ...form, [field.key]: t })}
            keyboardType={field.keyboard || 'default'}
            secureTextEntry={field.secure}
            autoCapitalize={field.key === 'email' ? 'none' : 'words'}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('register.submit')}</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>{t('register.haveAccount')} <Text style={styles.link}>{t('register.signIn')}</Text></Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07071A' },
  content: { paddingHorizontal: 24, paddingTop: 16 },
  subtitle: { color: '#9CA3AF', fontSize: 14, marginBottom: 12 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  roleChip: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#0E0E28', borderWidth: 1, borderColor: '#1C1C42', alignItems: 'center',
  },
  roleChipActive: { borderColor: '#7C3AED', backgroundColor: 'rgba(255,61,87,0.1)' },
  roleText: { color: '#9CA3AF', fontWeight: '500', fontSize: 14 },
  roleTextActive: { color: '#7C3AED' },
  label: { color: '#9CA3AF', fontSize: 12, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#0E0E28', borderWidth: 1, borderColor: '#1C1C42',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
    color: '#fff', fontSize: 14,
  },
  btn: {
    backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 24, marginBottom: 16,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkText: { color: '#6B7280', fontSize: 13, textAlign: 'center' },
  link: { color: '#7C3AED', fontWeight: '600' },
});
