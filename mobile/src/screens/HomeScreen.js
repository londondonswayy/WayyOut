import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, FlatList,
  RefreshControl, TextInput, StyleSheet, Dimensions, Animated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTrending } from '../store/slices/venueSlice';
import { venueAPI, storyAPI, adAPI } from '../services/api';
import VenueCard from '../components/VenueCard';
import AdCard from '../components/AdCard';
import StoryCircle from '../components/StoryCircle';
import { useTranslation } from '../i18n/LanguageContext';

const { width } = Dimensions.get('window');

const TICKER_COUNT = 8;

function LiveTicker() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const cycle = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      setIndex((i) => (i + 1) % TICKER_COUNT);
    }, 3500);
    return () => clearInterval(cycle);
  }, []);

  return (
    <View style={tickerStyles.container}>
      <View style={tickerStyles.dot} />
      <Animated.Text style={[tickerStyles.text, { opacity: fadeAnim }]} numberOfLines={1}>
        {t(`ticker.${index}`)}
      </Animated.Text>
    </View>
  );
}

const tickerStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#0E0E28', borderBottomWidth: 1, borderBottomColor: '#1C1C42' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  text: { flex: 1, color: '#9CA3AF', fontSize: 12 },
});

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { trending } = useSelector((state) => state.venues);
  const [categories, setCategories] = useState([]);
  const [stories, setStories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [feedAd, setFeedAd] = useState(null);
  const [dismissedAd, setDismissedAd] = useState(false);

  const loadData = useCallback(async () => {
    try {
      dispatch(fetchTrending());
      const [catRes, storyRes, adRes] = await Promise.all([
        venueAPI.categories(),
        storyAPI.feed({ page_size: 10 }),
        adAPI.feed().catch(() => null),
      ]);
      setCategories(catRes.data);
      setStories(storyRes.data.results || storyRes.data);
      if (adRes?.status === 200) {
        setFeedAd(adRes.data);
        setDismissedAd(false);
      }
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
    >
      <LiveTicker />

      {/* Hero / AI search */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{t('home.heroTitle')}</Text>
        <Text style={styles.heroHighlight}>{t('home.heroHighlight')}</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('home.searchPlaceholder')}
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
        <Text style={styles.sectionTitle}>{t('home.stories')}</Text>
        <FlatList
          horizontal
          data={stories}
          keyExtractor={(s) => String(s.id)}
          ListHeaderComponent={
            <TouchableOpacity
              onPress={() => navigation.navigate('PostStory')}
              style={storyAddStyles.container}
              activeOpacity={0.8}
            >
              <View style={storyAddStyles.ring}>
                <View style={storyAddStyles.inner}>
                  <Text style={storyAddStyles.plus}>+</Text>
                </View>
              </View>
              <Text style={storyAddStyles.label}>{t('stories.yourStory')}</Text>
            </TouchableOpacity>
          }
          renderItem={({ item }) => (
            <StoryCircle story={item} onPress={() => navigation.navigate('Stories', { stories, initialIndex: stories.indexOf(item) })} />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.browse')}</Text>
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
          <Text style={styles.sectionTitle}>{t('home.trending')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Discover')}>
            <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
          </TouchableOpacity>
        </View>
        {trending.map((venue, idx) => (
          <React.Fragment key={venue.id}>
            <VenueCard
              venue={venue}
              onPress={() => navigation.navigate('VenueDetail', { slug: venue.slug })}
            />
            {idx === 3 && feedAd && !dismissedAd && (
              <AdCard
                ad={feedAd}
                onDismiss={() => setDismissedAd(true)}
                onPress={() => navigation.navigate('VenueDetail', { slug: feedAd.venue_slug })}
              />
            )}
          </React.Fragment>
        ))}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const storyAddStyles = StyleSheet.create({
  container: { alignItems: 'center', marginRight: 12, width: 72 },
  ring: {
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 2, borderColor: '#7C3AED', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  inner: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(124,58,237,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  plus: { color: '#7C3AED', fontSize: 26, fontWeight: '300', lineHeight: 30 },
  label: { color: '#6B7280', fontSize: 10, marginTop: 4, textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07071A' },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    backgroundColor: '#0D0D1A',
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C42',
  },
  heroTitle: { fontSize: 28, fontWeight: '700', color: '#fff' },
  heroHighlight: { fontSize: 28, fontWeight: '700', color: '#7C3AED', marginBottom: 16 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1, backgroundColor: '#0E0E28', borderWidth: 1, borderColor: '#1C1C42',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: '#fff', fontSize: 14,
  },
  searchBtn: { backgroundColor: '#7C3AED', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  section: { paddingTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', paddingHorizontal: 16, marginBottom: 12 },
  seeAll: { color: '#7C3AED', fontSize: 13 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0E0E28', borderWidth: 1, borderColor: '#1C1C42',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8,
  },
  catLabel: { color: '#fff', fontSize: 13, fontWeight: '500' },
});
