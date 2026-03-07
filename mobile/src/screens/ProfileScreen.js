import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
          dispatch(logout());
        },
      },
    ]);
  };

  const menuItems = [
    { icon: '✏️', label: 'Edit Profile' },
    { icon: '📋', label: 'My Reservations', onPress: () => navigation.navigate('Reservations') },
    { icon: '🔔', label: 'Notifications' },
    { icon: '🔒', label: 'Change Password' },
    ...(user?.role === 'venue_owner' ? [{ icon: '🏢', label: 'My Venues' }] : []),
    { icon: '💬', label: 'Support' },
    { icon: '📋', label: 'Terms & Privacy' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Profile header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.full_name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.full_name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role?.replace('_', ' ')}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Reservations', value: '12' },
          { label: 'Reviews', value: '8' },
          { label: 'Venues Visited', value: '23' },
        ].map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: { alignItems: 'center', paddingVertical: 32, borderBottomWidth: 1, borderBottomColor: '#1E1E2E' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,61,87,0.2)', borderWidth: 2, borderColor: '#FF3D57', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#FF3D57' },
  name: { fontSize: 22, fontWeight: '700', color: '#fff' },
  email: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  roleBadge: { marginTop: 8, backgroundColor: 'rgba(255,61,87,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  roleText: { color: '#FF7087', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  statsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1E1E2E' },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 20, borderRightWidth: 1, borderRightColor: '#1E1E2E' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#fff' },
  statLabel: { color: '#6B7280', fontSize: 11, marginTop: 2 },
  menu: { paddingHorizontal: 16, paddingTop: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1E1E2E' },
  menuIcon: { fontSize: 20, marginRight: 14 },
  menuLabel: { flex: 1, color: '#fff', fontSize: 15 },
  menuChevron: { color: '#4B5563', fontSize: 20 },
  logoutBtn: { margin: 16, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  logoutText: { color: '#EF4444', fontWeight: '600', fontSize: 15 },
});
