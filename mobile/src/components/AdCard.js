import React, { useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { adAPI } from '../services/api';

const { width } = Dimensions.get('window');

export default function AdCard({ ad, onDismiss, onPress }) {
  useEffect(() => {
    adAPI.impression(ad.id).catch(() => {});
  }, [ad.id]);

  const coverUri = ad.image || ad.venue_cover;

  return (
    <View style={styles.card}>
      {/* Sponsored badge */}
      <View style={styles.badge}>
        <View style={styles.badgeDot} />
        <Text style={styles.badgeText}>Sponsored</Text>
      </View>

      {/* Dismiss button */}
      <TouchableOpacity style={styles.dismiss} onPress={onDismiss}>
        <Text style={styles.dismissText}>×</Text>
      </TouchableOpacity>

      {/* Cover image */}
      <View style={styles.cover}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.coverImg} resizeMode="cover" />
        ) : (
          <View style={styles.coverFallback}>
            <Text style={{ fontSize: 36 }}>🏢</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.meta} numberOfLines={1}>{ad.venue_name} · {ad.venue_city}</Text>
        <Text style={styles.headline} numberOfLines={2}>{ad.headline}</Text>
        {!!ad.body && <Text style={styles.body} numberOfLines={2}>{ad.body}</Text>}
        <TouchableOpacity style={styles.cta} onPress={onPress}>
          <Text style={styles.ctaText}>{ad.cta_text || 'Book Now'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0E0E28',
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1C1C42',
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7C3AED',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  dismiss: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  cover: {
    width: '100%',
    height: 140,
    backgroundColor: 'rgba(124,58,237,0.15)',
  },
  coverImg: {
    width: '100%',
    height: '100%',
  },
  coverFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,58,237,0.1)',
  },
  content: {
    padding: 14,
  },
  meta: {
    color: '#6B7280',
    fontSize: 11,
    marginBottom: 4,
  },
  headline: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  body: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  cta: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
