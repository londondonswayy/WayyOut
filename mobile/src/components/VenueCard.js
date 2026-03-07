import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

export default function VenueCard({ venue, onPress }) {
  const busyColor = venue.busy_level > 70 ? '#EF4444' : venue.busy_level > 40 ? '#F59E0B' : '#10B981';

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
        <View style={styles.imageOverlay}>
          <View style={[styles.badge, venue.is_open ? styles.openBadge : styles.closedBadge]}>
            <Text style={[styles.badgeText, { color: venue.is_open ? '#10B981' : '#EF4444' }]}>
              {venue.is_open ? '● Open' : '● Closed'}
            </Text>
          </View>
        </View>
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
            <Text style={styles.busyLabel}>Busy</Text>
            <View style={styles.busyBar}>
              <View style={[styles.busyFill, { width: `${venue.busy_level}%`, backgroundColor: busyColor }]} />
            </View>
            <Text style={[styles.busyPct, { color: busyColor }]}>{venue.busy_level}%</Text>
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
    backgroundColor: '#12121A', borderWidth: 1, borderColor: '#1E1E2E',
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
  content: { padding: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1 },
  rating: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { color: '#F59E0B', fontSize: 13, fontWeight: '600' },
  address: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  busyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  busyLabel: { color: '#6B7280', fontSize: 11, width: 30 },
  busyBar: { flex: 1, height: 4, backgroundColor: '#1E1E2E', borderRadius: 2, overflow: 'hidden' },
  busyFill: { height: '100%', borderRadius: 2 },
  busyPct: { fontSize: 11, fontWeight: '600', width: 30, textAlign: 'right' },
  vibeBadge: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: 'rgba(255,61,87,0.1)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  vibeText: { color: '#FF7087', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
});
