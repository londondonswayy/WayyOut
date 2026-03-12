import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adAPI } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { t, lang, switchLang } = useTranslation();
  const [adSub, setAdSub] = useState(null);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    adAPI.subscription().then(res => setAdSub(res.data)).catch(() => {});
  }, []);

  const handleSubscribe = async (plan) => {
    setSubLoading(true);
    try {
      const res = await adAPI.subscribe(plan);
      setAdSub(res.data);
      Alert.alert('', t('adFree.subscribed'));
    } catch {
      Alert.alert('Error', t('profile.cancel'));
    } finally {
      setSubLoading(false);
    }
  };

  const handleCancelSub = () => {
    Alert.alert(t('adFree.cancel'), t('profile.logoutConfirm'), [
      { text: t('profile.cancel'), style: 'cancel' },
      {
        text: t('adFree.cancel'),
        style: 'destructive',
        onPress: async () => {
          setSubLoading(true);
          try {
            await adAPI.cancelSubscription();
            setAdSub({ is_active: false });
            Alert.alert('', t('adFree.cancelled'));
          } catch { /* ignore */ }
          finally { setSubLoading(false); }
        },
      },
    ]);
  };

  const handleLogout = async () => {
    Alert.alert(t('profile.logoutTitle'), t('profile.logoutConfirm'), [
      { text: t('profile.cancel'), style: 'cancel' },
      {
        text: t('profile.logoutTitle'),
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
          dispatch(logout());
        },
      },
    ]);
  };

  const menuItems = [
    { icon: '✏️', label: t('profile.editProfile') },
    { icon: '📋', label: t('profile.myReservations'), onPress: () => navigation.navigate('Reservations') },
    { icon: '🔔', label: t('profile.notifications') },
    { icon: '🔒', label: t('profile.changePassword') },
    ...(user?.role === 'venue_owner' ? [{ icon: '🏢', label: t('profile.myVenues') }] : []),
    { icon: '💬', label: t('profile.support') },
    { icon: '📋', label: t('profile.terms') },
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
          { label: t('profile.reservations'), value: '12' },
          { label: t('profile.reviews'), value: '8' },
          { label: t('profile.visited'), value: '23' },
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

      {/* Ad Experience */}
      <View style={adStyles.card}>
        <View style={adStyles.cardHeader}>
          <Text style={adStyles.cardTitle}>{t('adFree.title')}</Text>
          {adSub?.is_active && (
            <View style={adStyles.activeBadge}>
              <Text style={adStyles.activeBadgeText}>{t('adFree.active')}</Text>
            </View>
          )}
        </View>
        <Text style={adStyles.desc}>{t('adFree.desc')}</Text>

        {adSub?.is_active ? (
          <View style={adStyles.activeBox}>
            <Text style={adStyles.activeTitle}>{t('adFree.active')}</Text>
            <Text style={adStyles.activeSub}>
              {t('adFree.expires')}: {new Date(adSub.expires_at).toLocaleDateString()}
            </Text>
            <TouchableOpacity
              style={adStyles.cancelBtn}
              onPress={handleCancelSub}
              disabled={subLoading}
            >
              <Text style={adStyles.cancelBtnText}>{subLoading ? '...' : t('adFree.cancel')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={adStyles.planRow}>
            {/* Monthly */}
            <View style={adStyles.planCard}>
              <Text style={adStyles.planName}>{t('adFree.monthly')}</Text>
              <Text style={adStyles.planPrice}>{t('adFree.monthlyPrice')}</Text>
              <TouchableOpacity
                style={adStyles.subBtn}
                onPress={() => handleSubscribe('monthly')}
                disabled={subLoading}
              >
                <Text style={adStyles.subBtnText}>{subLoading ? '...' : t('adFree.subscribe')}</Text>
              </TouchableOpacity>
            </View>
            {/* Yearly */}
            <View style={[adStyles.planCard, adStyles.planCardFeatured]}>
              <View style={adStyles.saveBadge}>
                <Text style={adStyles.saveBadgeText}>{t('adFree.save')}</Text>
              </View>
              <Text style={adStyles.planName}>{t('adFree.yearly')}</Text>
              <Text style={adStyles.planPrice}>{t('adFree.yearlyPrice')}</Text>
              <TouchableOpacity
                style={adStyles.subBtn}
                onPress={() => handleSubscribe('yearly')}
                disabled={subLoading}
              >
                <Text style={adStyles.subBtnText}>{subLoading ? '...' : t('adFree.subscribe')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Language toggle */}
      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: 'rgba(124,58,237,0.3)', backgroundColor: 'rgba(124,58,237,0.1)', marginBottom: 0 }]}
        onPress={() => switchLang(lang === 'en' ? 'fr' : 'en')}
      >
        <Text style={{ color: '#A78BFA', fontWeight: '600', fontSize: 15 }}>
          {lang === 'en' ? '🇫🇷 Français' : '🇬🇧 English'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>{t('profile.logout')}</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const adStyles = StyleSheet.create({
  card: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: '#0E0E28',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1C1C42',
    padding: 16,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  activeBadge: { backgroundColor: 'rgba(16,185,129,0.2)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  activeBadgeText: { color: '#10B981', fontSize: 11, fontWeight: '600' },
  desc: { color: '#6B7280', fontSize: 13, marginBottom: 14 },
  activeBox: { backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  activeTitle: { color: '#10B981', fontWeight: '600', fontSize: 14 },
  activeSub: { color: '#9CA3AF', fontSize: 12, marginTop: 2, marginBottom: 10 },
  cancelBtn: { borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  cancelBtnText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
  planRow: { flexDirection: 'row', gap: 10 },
  planCard: { flex: 1, backgroundColor: '#07071A', borderRadius: 12, borderWidth: 1, borderColor: '#1C1C42', padding: 12 },
  planCardFeatured: { borderColor: 'rgba(124,58,237,0.4)', backgroundColor: 'rgba(124,58,237,0.05)' },
  saveBadge: { position: 'absolute', top: -10, right: 8, backgroundColor: '#7C3AED', borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2 },
  saveBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  planName: { color: '#fff', fontSize: 13, fontWeight: '600', marginBottom: 2 },
  planPrice: { color: '#7C3AED', fontSize: 16, fontWeight: '700', marginBottom: 10 },
  subBtn: { backgroundColor: '#7C3AED', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  subBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07071A' },
  header: { alignItems: 'center', paddingVertical: 32, borderBottomWidth: 1, borderBottomColor: '#1C1C42' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,61,87,0.2)', borderWidth: 2, borderColor: '#7C3AED', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#7C3AED' },
  name: { fontSize: 22, fontWeight: '700', color: '#fff' },
  email: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  roleBadge: { marginTop: 8, backgroundColor: 'rgba(255,61,87,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  roleText: { color: '#FF7087', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  statsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1C1C42' },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 20, borderRightWidth: 1, borderRightColor: '#1C1C42' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#fff' },
  statLabel: { color: '#6B7280', fontSize: 11, marginTop: 2 },
  menu: { paddingHorizontal: 16, paddingTop: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1C1C42' },
  menuIcon: { fontSize: 20, marginRight: 14 },
  menuLabel: { flex: 1, color: '#fff', fontSize: 15 },
  menuChevron: { color: '#4B5563', fontSize: 20 },
  logoutBtn: { margin: 16, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  logoutText: { color: '#EF4444', fontWeight: '600', fontSize: 15 },
});
