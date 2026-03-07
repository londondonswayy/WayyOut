import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, Modal, TextInput, Alert, Platform
} from 'react-native';
import { venueAPI, reservationAPI } from '../services/api';

export default function VenueDetailScreen({ route }) {
  const { slug } = route.params;
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reserveModal, setReserveModal] = useState(false);
  const [reserveForm, setReserveForm] = useState({
    reservation_type: 'table',
    date: new Date().toISOString().split('T')[0],
    time: '20:00',
    party_size: 2,
    special_requests: '',
  });

  useEffect(() => {
    venueAPI.detail(slug).then((res) => {
      setVenue(res.data);
      setLoading(false);
    });
  }, [slug]);

  const handleReserve = async () => {
    try {
      await reservationAPI.create({ venue: venue.id, ...reserveForm });
      setReserveModal(false);
      Alert.alert('Request Sent!', `Your reservation request has been sent to ${venue.name}. You'll be notified when they respond.`);
    } catch {
      Alert.alert('Error', 'Failed to send reservation. Please try again.');
    }
  };

  if (loading || !venue) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#FF3D57', fontSize: 32 }}>W</Text>
      </View>
    );
  }

  const busyColor = venue.busy_level > 70 ? '#EF4444' : venue.busy_level > 40 ? '#F59E0B' : '#10B981';

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Cover image */}
        <View style={styles.coverContainer}>
          {venue.cover_image ? (
            <Image source={{ uri: venue.cover_image }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Text style={{ fontSize: 64 }}>🏢</Text>
            </View>
          )}
          <View style={styles.coverOverlay} />
        </View>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.name}>{venue.name}</Text>
            <View style={[styles.statusBadge, venue.is_open ? styles.openBadge : styles.closedBadge]}>
              <Text style={[styles.statusText, { color: venue.is_open ? '#10B981' : '#EF4444' }]}>
                {venue.is_open ? '● Open Now' : '● Closed'}
              </Text>
            </View>
          </View>
          <Text style={styles.address}>📍 {venue.address}, {venue.city}</Text>

          {/* Rating & vibe */}
          <View style={styles.metaRow}>
            <Text style={styles.rating}>★ {Number(venue.rating).toFixed(1)} ({venue.review_count})</Text>
            {venue.vibe && (
              <View style={styles.vibeBadge}>
                <Text style={styles.vibeText}>{venue.vibe}</Text>
              </View>
            )}
            {venue.category && (
              <View style={styles.catBadge}>
                <Text style={styles.catText}>{venue.category.name}</Text>
              </View>
            )}
          </View>

          {/* Busy level */}
          {venue.is_open && (
            <View style={styles.busyContainer}>
              <View style={styles.busyHeader}>
                <Text style={styles.busyLabel}>Busy Level</Text>
                <Text style={[styles.busyValue, { color: busyColor }]}>
                  {venue.busy_level > 70 ? 'Very Busy' : venue.busy_level > 40 ? 'Moderate' : 'Quiet'}
                </Text>
              </View>
              <View style={styles.busyBar}>
                <View style={[styles.busyFill, { width: `${venue.busy_level}%`, backgroundColor: busyColor }]} />
              </View>
            </View>
          )}

          {/* Description */}
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{venue.description}</Text>

          {/* Contact */}
          {(venue.phone || venue.email) && (
            <>
              <Text style={styles.sectionTitle}>Contact</Text>
              {venue.phone && <Text style={styles.contact}>📞 {venue.phone}</Text>}
              {venue.email && <Text style={styles.contact}>✉️ {venue.email}</Text>}
            </>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Reserve button */}
      {venue.is_open && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.reserveBtn} onPress={() => setReserveModal(true)}>
            <Text style={styles.reserveBtnText}>Reserve Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Reservation Modal */}
      <Modal visible={reserveModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reserve a Spot</Text>
            <TouchableOpacity onPress={() => setReserveModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            {/* Type */}
            <Text style={styles.fieldLabel}>Reservation Type</Text>
            <View style={styles.typeRow}>
              {['table', 'guest_list'].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setReserveForm({ ...reserveForm, reservation_type: t })}
                  style={[styles.typeBtn, reserveForm.reservation_type === t && styles.typeBtnActive]}
                >
                  <Text style={[styles.typeBtnText, reserveForm.reservation_type === t && styles.typeBtnTextActive]}>
                    {t === 'table' ? '🪑 Table' : '📋 Guest List'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Date</Text>
            <TextInput
              style={styles.modalInput}
              value={reserveForm.date}
              onChangeText={(t) => setReserveForm({ ...reserveForm, date: t })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#6B7280"
            />

            <Text style={styles.fieldLabel}>Time</Text>
            <TextInput
              style={styles.modalInput}
              value={reserveForm.time}
              onChangeText={(t) => setReserveForm({ ...reserveForm, time: t })}
              placeholder="HH:MM"
              placeholderTextColor="#6B7280"
            />

            <Text style={styles.fieldLabel}>Party Size</Text>
            <TextInput
              style={styles.modalInput}
              value={String(reserveForm.party_size)}
              onChangeText={(t) => setReserveForm({ ...reserveForm, party_size: parseInt(t) || 1 })}
              keyboardType="number-pad"
            />

            <Text style={styles.fieldLabel}>Special Requests (optional)</Text>
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              value={reserveForm.special_requests}
              onChangeText={(t) => setReserveForm({ ...reserveForm, special_requests: t })}
              placeholder="Dietary needs, celebrations..."
              placeholderTextColor="#6B7280"
              multiline
            />

            <TouchableOpacity style={styles.reserveBtn} onPress={handleReserve}>
              <Text style={styles.reserveBtnText}>Send Request</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  coverContainer: { height: 240, position: 'relative' },
  cover: { width: '100%', height: '100%' },
  coverPlaceholder: { backgroundColor: '#1A1A2E', justifyContent: 'center', alignItems: 'center' },
  coverOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'transparent' },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontSize: 24, fontWeight: '800', color: '#fff', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  openBadge: { backgroundColor: 'rgba(16,185,129,0.15)' },
  closedBadge: { backgroundColor: 'rgba(239,68,68,0.15)' },
  statusText: { fontSize: 11, fontWeight: '600' },
  address: { color: '#6B7280', fontSize: 13, marginTop: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  rating: { color: '#F59E0B', fontWeight: '600', fontSize: 13 },
  vibeBadge: { backgroundColor: 'rgba(255,61,87,0.1)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  vibeText: { color: '#FF7087', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  catBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  catText: { color: '#9CA3AF', fontSize: 11 },
  busyContainer: { marginTop: 16, backgroundColor: '#12121A', borderRadius: 12, padding: 14 },
  busyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  busyLabel: { color: '#9CA3AF', fontSize: 12 },
  busyValue: { fontSize: 12, fontWeight: '600' },
  busyBar: { height: 6, backgroundColor: '#1E1E2E', borderRadius: 3, overflow: 'hidden' },
  busyFill: { height: '100%', borderRadius: 3 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 20, marginBottom: 8 },
  description: { color: '#9CA3AF', fontSize: 14, lineHeight: 22 },
  contact: { color: '#9CA3AF', fontSize: 14, marginBottom: 4 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#0A0A0F', borderTopWidth: 1, borderTopColor: '#1E1E2E' },
  reserveBtn: { backgroundColor: '#FF3D57', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  reserveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalContainer: { flex: 1, backgroundColor: '#0A0A0F' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1E1E2E' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  modalClose: { color: '#6B7280', fontSize: 20 },
  modalBody: { padding: 20 },
  fieldLabel: { color: '#9CA3AF', fontSize: 12, marginBottom: 6, marginTop: 16 },
  modalInput: { backgroundColor: '#12121A', borderWidth: 1, borderColor: '#1E1E2E', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 14 },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#12121A', borderWidth: 1, borderColor: '#1E1E2E', alignItems: 'center' },
  typeBtnActive: { borderColor: '#FF3D57', backgroundColor: 'rgba(255,61,87,0.1)' },
  typeBtnText: { color: '#9CA3AF', fontWeight: '500' },
  typeBtnTextActive: { color: '#FF3D57' },
});
