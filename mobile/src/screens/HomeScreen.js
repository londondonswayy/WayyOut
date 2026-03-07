import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, FlatList,
  RefreshControl, TextInput, StyleSheet, Dimensions
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTrending } from '../store/slices/venueSlice';
import { venueAPI, storyAPI } from '../services/api';
import VenueCard from '../components/VenueCard';
import StoryCircle from '../components/StoryCircle';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { trending } = useSelector((state) => state.venues);
  const [categories, setCategories] = useState([]);
  const [stories, setStories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [aiQuery, setAiQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      dispatch(fetchTrending());
      const [catRes, storyRes] = await Promise.all([
        venueAPI.categories(),
        storyAPI.feed({ page_size: 10 }),
      ]);
      setCategories(catRes.data);
      setStories(storyRes.data.results || storyRes.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF3D57" />}
    >
      {/* Hero / AI search */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Decide where to go.</Text>
        <Text style={styles.heroHighlight}>Right now.</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Ask AI: 'rooftop bar with a chill vibe...'"
            placeholderTextColor="#6B7280"
            value={aiQuery}
            onChangeText={setAiQuery}
          />
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => navigation.navigate('Discover', { aiQuery })}
          >
            <Text style={styles.searchBtnText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Stories</Text>
        <FlatList
          horizontal
          data={stories}
          keyExtractor={(s) => String(s.id)}
          renderItem={({ item }) => (
            <StoryCircle story={item} onPress={() => navigation.navigate('Stories', { stories, initialIndex: stories.indexOf(item) })} />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.catChip}
              onPress={() => navigation.navigate('Discover', { category: cat.slug })}
            >
              <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
              <Text style={styles.catLabel}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Trending */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔥 Trending Tonight</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Discover')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {trending.map((venue) => (
          <VenueCard
            key={venue.id}
            venue={venue}
            onPress={() => navigation.navigate('VenueDetail', { slug: venue.slug })}
          />
        ))}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    backgroundColor: '#0D0D1A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E2E',
  },
  heroTitle: { fontSize: 28, fontWeight: '700', color: '#fff' },
  heroHighlight: { fontSize: 28, fontWeight: '700', color: '#FF3D57', marginBottom: 16 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1, backgroundColor: '#12121A', borderWidth: 1, borderColor: '#1E1E2E',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: '#fff', fontSize: 14,
  },
  searchBtn: { backgroundColor: '#FF3D57', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  section: { paddingTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', paddingHorizontal: 16, marginBottom: 12 },
  seeAll: { color: '#FF3D57', fontSize: 13 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#12121A', borderWidth: 1, borderColor: '#1E1E2E',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8,
  },
  catLabel: { color: '#fff', fontSize: 13, fontWeight: '500' },
});
