import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    const result = await dispatch(loginUser(form));
    if (loginUser.rejected.match(result)) {
      Alert.alert('Login Failed', 'Invalid email or password.');
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
        <Text style={styles.title}>Way Out</Text>
        <Text style={styles.subtitle}>Sign in to discover your night</Text>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#6B7280"
            value={form.email}
            onChangeText={(t) => setForm({ ...form, email: t })}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#6B7280"
            value={form.password}
            onChangeText={(t) => setForm({ ...form, password: t })}
            secureTextEntry
          />

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>Don't have an account? <Text style={styles.link}>Sign up</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  logo: {
    width: 56, height: 56, backgroundColor: '#FF3D57', borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  logoW: { color: '#fff', fontSize: 24, fontWeight: '800' },
  title: { fontSize: 28, fontWeight: '800', color: '#fff' },
  subtitle: { color: '#6B7280', fontSize: 14, marginTop: 4, marginBottom: 32 },
  form: { width: '100%' },
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
