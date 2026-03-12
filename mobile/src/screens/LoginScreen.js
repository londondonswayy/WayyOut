import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import { useTranslation } from '../i18n/LanguageContext';

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: '', password: '' });

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      Alert.alert('Error', t('login.missingFields'));
      return;
    }
    const result = await dispatch(loginUser(form));
    if (loginUser.rejected.match(result)) {
      Alert.alert(t('login.error'), t('login.errorMsg'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logo}>
          <Text style={styles.logoW}>W</Text>
        </View>
        <Text style={styles.title}>WayyOut</Text>
        <Text style={styles.subtitle}>{t('login.subtitle')}</Text>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>{t('login.email')}</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#6B7280"
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>{t('login.password')}</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#6B7280"
            value={form.password}
            onChangeText={(v) => setForm({ ...form, password: v })}
            secureTextEntry
          />

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('login.submit')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>{t('login.noAccount')} <Text style={styles.link}>{t('login.signUp')}</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07071A' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  logo: {
    width: 56, height: 56, backgroundColor: '#7C3AED', borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  logoW: { color: '#fff', fontSize: 24, fontWeight: '800' },
  title: { fontSize: 28, fontWeight: '800', color: '#fff' },
  subtitle: { color: '#6B7280', fontSize: 14, marginTop: 4, marginBottom: 32 },
  form: { width: '100%' },
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
