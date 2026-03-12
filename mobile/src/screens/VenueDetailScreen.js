import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, FlatList, Image, TouchableOpacity,
  StyleSheet, Modal, TextInput, Alert, Platform
} from 'react-native';
import { venueAPI, reservationAPI } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';

// Next 14 days as selectable chips
function buildDateChips() {
  const chips = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    chips.push({
      value,
      top: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      bottom: `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getDate()}`,
    });
  }
  return chips;
}
const DATE_CHIPS = buildDateChips();

// Half-hour slots 11:00 → 02:00
const TIME_SLOTS = [];
for (let h = 11; h < 27; h++) {
  const hour = String(h % 24).padStart(2, '0');
  TIME_SLOTS.push(`${hour}:00`);
  TIME_SLOTS.push(`${hour}:30`);
}

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20];

export default function VenueDetailScreen({ route }) {
  const { slug } = route.params;
  const { t } = useTranslation();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reserveModal, setReserveModal] = useState(false);
  const [reserveForm, setReserveForm] = useState({
    reservation_type: 'table',
    date: DATE_CHIPS[0].value,
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
      Alert.alert(t('res.sent'), t('res.sentDesc'));
    } catch {
      Alert.alert('Error', t('res.error'));
    }
  };

  if (loading || !venue) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#7C3AED', fontSize: 32 }}>W</Text>
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
                {venue.is_open ? t('detail.openNow') : t('detail.closed')}
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
                <Text style={styles.busyLabel}>{t('detail.busyLevel')}</Text>
                <Text style={[styles.busyValue, { color: busyColor }]}>
                  {venue.busy_level > 70 ? t('detail.veryBusy') : venue.busy_level > 40 ? t('detail.moderate') : t('detail.quiet')}
                </Text>
              </View>
              <View style={styles.busyBar}>
                <View style={[styles.busyFill, { width: `${venue.busy_level}%`, backgroundColor: busyColor }]} />
              </View>
            </View>
          )}

          {/* Description */}
          <Text style={styles.sectionTitle}>{t('detail.about')}</Text>
          <Text style={styles.description}>{venue.description}</Text>

          {/* Contact */}
          {(venue.phone || venue.email) && (
            <>
              <Text style={styles.sectionTitle}>{t('detail.contact')}</Text>
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
            <Text style={styles.reserveBtnText}>{t('detail.reserveNow')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Reservation Modal */}
      <Modal visible={reserveModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('res.title')}</Text>
            <TouchableOpacity onPress={() => setReserveModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            {/* Type */}
            <Text style={styles.fieldLabel}>{t('res.type')}</Text>
            <View style={styles.typeRow}>
              {['table', 'guest_list'].map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setReserveForm({ ...reserveForm, reservation_type: type })}
                  style={[styles.typeBtn, reserveForm.reservation_type === type && styles.typeBtnActive]}
                >
                  <Text style={[styles.typeBtnText, reserveForm.reservation_type === type && styles.typeBtnTextActive]}>
                    {type === 'table' ? t('res.table') : t('res.guestList')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date chips */}
            <Text style={styles.fieldLabel}>{t('res.date')}</Text>
            <FlatList
              horizontal
              data={DATE_CHIPS}
              keyExtractor={(item) => item.value}
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 4 }}
              renderItem={({ item }) => {
                const active = reserveForm.date === item.value;
                return (
                  <TouchableOpacity
                    onPress={() => setReserveForm({ ...reserveForm, date: item.value })}
                    style={[pickerStyles.chip, active && pickerStyles.chipActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[pickerStyles.chipTop, active && pickerStyles.chipTextActive]}>{item.top}</Text>
                    <Text style={[pickerStyles.chipBottom, active && pickerStyles.chipTextActive]}>{item.bottom}</Text>
                  </TouchableOpacity>
                );
              }}
            />

            {/* Time slots */}
            <Text style={styles.fieldLabel}>{t('res.time')}</Text>
            <FlatList
              horizontal
              data={TIME_SLOTS}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 4 }}
              renderItem={({ item }) => {
                const active = reserveForm.time === item;
                return (
                  <TouchableOpacity
                    onPress={() => setReserveForm({ ...reserveForm, time: item })}
                    style={[pickerStyles.timeChip, active && pickerStyles.chipActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[pickerStyles.timeChipText, active && pickerStyles.chipTextActive]}>{item}</Text>
                  </TouchableOpacity>
                );
              }}
            />

            {/* Party size stepper */}
            <Text style={styles.fieldLabel}>{t('res.partySize')}</Text>
            <View style={pickerStyles.stepper}>
              <TouchableOpacity
                onPress={() => setReserveForm({ ...reserveForm, party_size: Math.max(1, reserveForm.party_size - 1) })}
                style={pickerStyles.stepBtn}
              >
                <Text style={pickerStyles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={pickerStyles.stepValue}>{reserveForm.party_size}</Text>
              <TouchableOpacity
                onPress={() => setReserveForm({ ...reserveForm, party_size: Math.min(20, reserveForm.party_size + 1) })}
                style={pickerStyles.stepBtn}
              >
                <Text style={pickerStyles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>{t('res.special')}</Text>
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              value={reserveForm.special_requests}
              onChangeText={(v) => setReserveForm({ ...reserveForm, special_requests: v })}
              placeholder={t('res.specialPlaceholder')}
              placeholderTextColor="#6B7280"
              multiline
            />

            <TouchableOpacity style={styles.reserveBtn} onPress={handleReserve}>
              <Text style={styles.reserveBtnText}>{t('res.send')}</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  chip: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, backgroundColor: '#0E0E28',
    borderWidth: 1, borderColor: '#1C1C42',
    marginRight: 8, minWidth: 56,
  },
  chipActive: { backgroundColor: 'rgba(124,58,237,0.15)', borderColor: '#7C3AED' },
  chipTop: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  chipBottom: { color: '#6B7280', fontSize: 10, textAlign: 'center', marginTop: 2 },
  chipTextActive: { color: '#A78BFA' },
  timeChip: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, backgroundColor: '#0E0E28',
    borderWidth: 1, borderColor: '#1C1C42',
    marginRight: 8,
  },
  timeChipText: { color: '#9CA3AF', fontSize: 13, fontWeight: '500' },
  stepper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0E0E28', borderWidth: 1, borderColor: '#1C1C42',
    borderRadius: 12, overflow: 'hidden', alignSelf: 'flex-start',
  },
  stepBtn: { paddingHorizontal: 20, paddingVertical: 12 },
  stepBtnText: { color: '#A78BFA', fontSize: 22, fontWeight: '300', lineHeight: 26 },
  stepValue: { color: '#fff', fontSize: 16, fontWeight: '600', minWidth: 40, textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07071A' },
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
  busyContainer: { marginTop: 16, backgroundColor: '#0E0E28', borderRadius: 12, padding: 14 },
  busyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  busyLabel: { color: '#9CA3AF', fontSize: 12 },
  busyValue: { fontSize: 12, fontWeight: '600' },
  busyBar: { height: 6, backgroundColor: '#1C1C42', borderRadius: 3, overflow: 'hidden' },
  busyFill: { height: '100%', borderRadius: 3 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 20, marginBottom: 8 },
  description: { color: '#9CA3AF', fontSize: 14, lineHeight: 22 },
  contact: { color: '#9CA3AF', fontSize: 14, marginBottom: 4 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#07071A', borderTopWidth: 1, borderTopColor: '#1C1C42' },
  reserveBtn: { backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  reserveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalContainer: { flex: 1, backgroundColor: '#07071A' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1C1C42' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  modalClose: { color: '#6B7280', fontSize: 20 },
  modalBody: { padding: 20 },
  fieldLabel: { color: '#9CA3AF', fontSize: 12, marginBottom: 6, marginTop: 16 },
  modalInput: { backgroundColor: '#0E0E28', borderWidth: 1, borderColor: '#1C1C42', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 14 },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#0E0E28', borderWidth: 1, borderColor: '#1C1C42', alignItems: 'center' },
  typeBtnActive: { borderColor: '#7C3AED', backgroundColor: 'rgba(255,61,87,0.1)' },
  typeBtnText: { color: '#9CA3AF', fontWeight: '500' },
  typeBtnTextActive: { color: '#7C3AED' },
});
