import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../store/slices/authSlice';

export default function RegisterScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '',
    role: 'customer', password: '', password_confirm: ''
  });

  const handleRegister = async () => {
    if (!form.full_name || !form.email || !form.password) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (form.password !== form.password_confirm) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    const result = await dispatch(registerUser(form));
    if (registerUser.rejected.match(result)) {
      Alert.alert('Registration Failed', 'Please check your details and try again.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.subtitle}>Choose your role:</Text>
      <View style={styles.roleRow}>
        {[
          { value: 'customer', label: '🌃 Explorer' },
          { value: 'venue_owner', label: '🏢 Venue' },
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
        { key: 'full_name', label: 'Full Name', placeholder: 'Jane Doe' },
        { key: 'email', label: 'Email', placeholder: 'you@example.com', keyboard: 'email-address' },
        { key: 'phone', label: 'Phone (optional)', placeholder: '+1 234 567 8900', keyboard: 'phone-pad' },
        { key: 'password', label: 'Password', placeholder: '••••••••', secure: true },
        { key: 'password_confirm', label: 'Confirm Password', placeholder: '••••••••', secure: true },
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
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>Already have an account? <Text style={styles.link}>Sign in</Text></Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  content: { paddingHorizontal: 24, paddingTop: 16 },
  subtitle: { color: '#9CA3AF', fontSize: 14, marginBottom: 12 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  roleChip: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#12121A', borderWidth: 1, borderColor: '#1E1E2E', alignItems: 'center',
  },
  roleChipActive: { borderColor: '#FF3D57', backgroundColor: 'rgba(255,61,87,0.1)' },
  roleText: { color: '#9CA3AF', fontWeight: '500', fontSize: 14 },
  roleTextActive: { color: '#FF3D57' },
  label: { color: '#9CA3AF', fontSize: 12, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#12121A', borderWidth: 1, borderColor: '#1E1E2E',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
    color: '#fff', fontSize: 14,
  },
  btn: {
    backgroundColor: '#FF3D57', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 24, marginBottom: 16,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkText: { color: '#6B7280', fontSize: 13, textAlign: 'center' },
  link: { color: '#FF3D57', fontWeight: '600' },
});
