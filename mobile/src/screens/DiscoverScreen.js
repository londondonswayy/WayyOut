import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, ScrollView, StyleSheet
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVenues } from '../store/slices/venueSlice';
import VenueCard from '../components/VenueCard';
import { useTranslation } from '../i18n/LanguageContext';

const VIBES = ['casual', 'lively', 'romantic', 'upscale', 'party'];
// To expand to more cities later, just add to this array
const CITIES = ['Montreal', 'Toronto'];

export default function DiscoverScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((state) => state.venues);
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    is_open: false,
    vibe: '',
    city: route.params?.city || '',
    category: route.params?.category || '',
  });

  useEffect(() => {
    const params = { ...filters };
    if (search) params.search = search;
    if (params.is_open) params.is_open = 'true';
    else delete params.is_open;
    if (!params.city) delete params.city;
    dispatch(fetchVenues(params));
  }, [filters, search]);

  const toggleFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? '' : value,
    }));
  };

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('discover.placeholder')}
          placeholderTextColor="#6B7280"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {CITIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.filterChip, filters.city === c && styles.filterChipActive]}
            onPress={() => toggleFilter('city', c)}
          >
            <Text style={[styles.filterText, filters.city === c && styles.filterTextActive]}>📍 {c}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.filterChip, filters.is_open && styles.filterChipActive]}
          onPress={() => setFilters((prev) => ({ ...prev, is_open: !prev.is_open }))}
        >
          <Text style={[styles.filterText, filters.is_open && styles.filterTextActive]}>{t('discover.openNow')}</Text>
        </TouchableOpacity>
        {VIBES.map((vibe) => (
          <TouchableOpacity
            key={vibe}
            style={[styles.filterChip, filters.vibe === vibe && styles.filterChipActive]}
            onPress={() => toggleFilter('vibe', vibe)}
          >
            <Text style={[styles.filterText, filters.vibe === vibe && styles.filterTextActive, { textTransform: 'capitalize' }]}>
              {vibe}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <FlatList
        data={list}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <VenueCard venue={item} onPress={() => navigation.navigate('VenueDetail', { slug: item.slug })} />
        )}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>🔍</Text>
              <Text style={styles.emptyText}>{t('discover.empty')}</Text>
              <Text style={styles.emptySubtext}>{t('discover.emptyDesc')}</Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingVertical: 8 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07071A' },
  searchContainer: { padding: 16 },
  searchInput: {
    backgroundColor: '#0E0E28', borderWidth: 1, borderColor: '#1C1C42',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 14,
  },
  filterScroll: { maxHeight: 48 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#0E0E28', borderWidth: 1, borderColor: '#1C1C42', marginRight: 8,
  },
  filterChipActive: { backgroundColor: 'rgba(255,61,87,0.15)', borderColor: '#7C3AED' },
  filterText: { color: '#9CA3AF', fontSize: 12, fontWeight: '500' },
  filterTextActive: { color: '#7C3AED' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptySubtext: { color: '#6B7280', marginTop: 4 },
});
