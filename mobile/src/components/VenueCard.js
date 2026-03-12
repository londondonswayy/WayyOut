import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '../i18n/LanguageContext';

export default function VenueCard({ venue, onPress }) {
  const { t } = useTranslation();
  const busyColor = venue.busy_level > 70 ? '#EF4444' : venue.busy_level > 40 ? '#F59E0B' : '#10B981';
  const [saved, setSaved] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;
  const [viewerCount] = useState(() =>
    Math.max(3, Math.floor((venue.busy_level || 0) / 8 + Math.random() * 8 + 2))
  );

  React.useEffect(() => {
    AsyncStorage.getItem('saved_venues').then((raw) => {
      try {
        const ids = JSON.parse(raw || '[]');
        setSaved(ids.includes(venue.id));
      } catch {}
    });
  }, [venue.id]);

  const toggleSave = async (e) => {
    const next = !saved;
    setSaved(next);
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.5, duration: 150, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    try {
      const raw = await AsyncStorage.getItem('saved_venues');
      const ids = JSON.parse(raw || '[]');
      const updated = next ? [...ids, venue.id] : ids.filter((id) => id !== venue.id);
      await AsyncStorage.setItem('saved_venues', JSON.stringify(updated));
    } catch {}
  };

  const busyLabel = venue.busy_level > 70 ? t('venue.packed') : venue.busy_level > 40 ? t('venue.moderate') : t('venue.quiet');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Image */}
      <View style={styles.imageContainer}>
        {venue.cover_image ? (
          <Image source={{ uri: venue.cover_image }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={{ fontSize: 40 }}>🏢</Text>
          </View>
        )}

        {/* Top-left badge */}
        <View style={styles.imageOverlay}>
          <View style={[styles.badge, venue.is_open ? styles.openBadge : styles.closedBadge]}>
            <Text style={[styles.badgeText, { color: venue.is_open ? '#10B981' : '#EF4444' }]}>
              {venue.is_open ? t('venue.open') : t('venue.closed')}
            </Text>
          </View>
        </View>

        {/* Heart save button */}
        <TouchableOpacity onPress={toggleSave} style={styles.heartBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Animated.Text style={[styles.heartEmoji, { transform: [{ scale: heartScale }] }]}>
            {saved ? '❤️' : '🤍'}
          </Animated.Text>
        </TouchableOpacity>

        {/* Live viewer count */}
        {venue.is_open && (
          <View style={styles.viewerBadge}>
            <View style={styles.viewerDot} />
            <Text style={styles.viewerText}>{viewerCount} {t('venue.viewing')}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{venue.name}</Text>
          <View style={styles.rating}>
            <Text style={styles.ratingText}>★ {Number(venue.rating).toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.address} numberOfLines={1}>{venue.city} · {venue.address}</Text>

        {venue.is_open && (
          <View style={styles.busyRow}>
            <View style={styles.busyDotWrapper}>
              <View style={[styles.busyDotPing, { backgroundColor: busyColor, opacity: 0.4 }]} />
              <View style={[styles.busyDot, { backgroundColor: busyColor }]} />
            </View>
            <View style={styles.busyBar}>
              <View style={[styles.busyFill, { width: `${venue.busy_level}%`, backgroundColor: busyColor }]} />
            </View>
            <Text style={[styles.busyLabel, { color: busyColor }]}>{busyLabel}</Text>
          </View>
        )}

        {venue.vibe && (
          <View style={styles.vibeBadge}>
            <Text style={styles.vibeText}>{venue.vibe}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0E0E28', borderWidth: 1, borderColor: '#1C1C42',
    borderRadius: 16, marginHorizontal: 16, marginBottom: 12, overflow: 'hidden',
  },
  imageContainer: { position: 'relative', height: 160 },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center' },
  imageOverlay: { position: 'absolute', top: 10, left: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  openBadge: { backgroundColor: 'rgba(16,185,129,0.15)' },
  closedBadge: { backgroundColor: 'rgba(239,68,68,0.15)' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  heartBtn: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  heartEmoji: { fontSize: 16 },
  viewerBadge: { position: 'absolute', bottom: 8, left: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  viewerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  viewerText: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  content: { padding: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1 },
  rating: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { color: '#F59E0B', fontSize: 13, fontWeight: '600' },
  address: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  busyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  busyDotWrapper: { position: 'relative', width: 10, height: 10, alignItems: 'center', justifyContent: 'center' },
  busyDotPing: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
  busyDot: { width: 6, height: 6, borderRadius: 3 },
  busyBar: { flex: 1, height: 4, backgroundColor: '#1C1C42', borderRadius: 2, overflow: 'hidden' },
  busyFill: { height: '100%', borderRadius: 2 },
  busyLabel: { fontSize: 11, fontWeight: '600', width: 60, textAlign: 'right' },
  vibeBadge: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: 'rgba(124,58,237,0.15)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  vibeText: { color: '#A78BFA', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
});
