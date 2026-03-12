import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert
} from 'react-native';
import { reservationAPI } from '../services/api';
import { format } from 'date-fns';

const STATUS_COLOR = {
  pending: '#F59E0B',
  accepted: '#10B981',
  rejected: '#EF4444',
  cancelled: '#6B7280',
  completed: '#3B82F6',
};

function ReservationItem({ item, onCancel }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.venueName}>{item.venue?.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLOR[item.status]}20` }]}>
          <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.ref}>Ref: {item.reference}</Text>
      <View style={styles.detailsRow}>
        <Text style={styles.detail}>📅 {item.date}</Text>
        <Text style={styles.detail}>🕐 {item.time}</Text>
        <Text style={styles.detail}>👥 {item.party_size}</Text>
      </View>
      {['pending', 'accepted'].includes(item.status) && (
        <TouchableOpacity onPress={() => onCancel(item.id)} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ReservationsScreen() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await reservationAPI.myReservations(filter ? { status: filter } : {});
      setReservations(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchReservations(); }, [filter]);

  const handleCancel = (id) => {
    Alert.alert('Cancel Reservation', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          await reservationAPI.cancel(id);
          fetchReservations();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Filter chips */}
      <View style={styles.filterRow}>
        {['', 'pending', 'accepted', 'completed'].map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setFilter(s)}
            style={[styles.filterChip, filter === s && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filter === s && styles.filterTextActive]}>
              {s || 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={reservations}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ReservationItem item={item} onCancel={handleCancel} />}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>📋</Text>
              <Text style={styles.emptyText}>No reservations yet</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07071A' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#0E0E28', borderWidth: 1, borderColor: '#1C1C42' },
  filterChipActive: { borderColor: '#7C3AED', backgroundColor: 'rgba(255,61,87,0.1)' },
  filterText: { color: '#9CA3AF', fontSize: 12, fontWeight: '500', textTransform: 'capitalize' },
  filterTextActive: { color: '#7C3AED' },
  card: { backgroundColor: '#0E0E28', borderWidth: 1, borderColor: '#1C1C42', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  venueName: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  ref: { color: '#6B7280', fontSize: 11, marginBottom: 10 },
  detailsRow: { flexDirection: 'row', gap: 16 },
  detail: { color: '#9CA3AF', fontSize: 12 },
  cancelBtn: { marginTop: 12 },
  cancelText: { color: '#EF4444', fontSize: 13, fontWeight: '500' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#9CA3AF', fontSize: 16, marginTop: 12 },
});
