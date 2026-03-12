import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSelector } from 'react-redux';
import { storyAPI, venueAPI } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';

const VIBES = ['casual', 'lively', 'romantic', 'upscale', 'party'];

export default function PostStoryScreen({ navigation }) {
  const { user } = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const isOwner = user?.role === 'venue_owner';

  const [media, setMedia] = useState(null); // { uri, type: 'image'|'video' }
  const [caption, setCaption] = useState('');
  const [vibeTags, setVibeTags] = useState([]);
  const [venueId, setVenueId] = useState(null);
  const [myVenues, setMyVenues] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOwner) {
      venueAPI.myVenues().then((r) => setMyVenues(r.data.results || r.data)).catch(() => {});
    }
  }, [isOwner]);

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('stories.permissionTitle'), t('stories.permissionGallery'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.85,
      allowsEditing: true,
      aspect: [9, 16],
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setMedia({ uri: asset.uri, type: asset.type || 'image', mimeType: asset.mimeType });
    }
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('stories.permissionTitle'), t('stories.permissionCamera'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.85,
      allowsEditing: true,
      aspect: [9, 16],
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setMedia({ uri: asset.uri, type: asset.type || 'image', mimeType: asset.mimeType });
    }
  };

  const toggleVibe = (v) =>
    setVibeTags((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const handlePost = async () => {
    if (!media) return;
    setLoading(true);
    try {
      const form = new FormData();
      const filename = media.uri.split('/').pop();
      const mimeType = media.mimeType || (media.type === 'video' ? 'video/mp4' : 'image/jpeg');
      form.append('media', { uri: media.uri, name: filename, type: mimeType });
      form.append('media_type', media.type === 'video' ? 'video' : 'photo');
      form.append('caption', caption);
      form.append('vibe_tags', JSON.stringify(vibeTags));
      form.append('source', isOwner ? 'venue' : 'user');
      if (isOwner && venueId) form.append('venue_id', String(venueId));

      await storyAPI.create(form);
      Alert.alert('', t('stories.posted'), [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert(t('stories.postFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Media preview / picker */}
      {media ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: media.uri }} style={styles.preview} resizeMode="cover" />
          <TouchableOpacity style={styles.removeMedia} onPress={() => setMedia(null)}>
            <Text style={styles.removeMediaText}>×</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.pickRow}>
          <TouchableOpacity style={[styles.pickBtn, styles.pickBtnPrimary]} onPress={pickFromCamera} activeOpacity={0.8}>
            <Text style={styles.pickIcon}>📷</Text>
            <Text style={styles.pickLabel}>{t('stories.camera')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickBtn} onPress={pickFromGallery} activeOpacity={0.8}>
            <Text style={styles.pickIcon}>🖼️</Text>
            <Text style={styles.pickLabel}>{t('stories.gallery')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Caption */}
      <TextInput
        style={styles.captionInput}
        placeholder={t('stories.captionPlaceholder')}
        placeholderTextColor="#6B7280"
        value={caption}
        onChangeText={setCaption}
        maxLength={500}
        multiline
        numberOfLines={3}
      />

      {/* Vibe tags */}
      <Text style={styles.sectionLabel}>{t('stories.vibeTags')}</Text>
      <View style={styles.vibeRow}>
        {VIBES.map((v) => (
          <TouchableOpacity
            key={v}
            onPress={() => toggleVibe(v)}
            style={[styles.vibeTag, vibeTags.includes(v) && styles.vibeTagActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.vibeTagText, vibeTags.includes(v) && styles.vibeTagTextActive]}>
              {v}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Venue selector — owners only */}
      {isOwner && myVenues.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>{t('stories.tagVenue')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.venueRow}>
            <TouchableOpacity
              onPress={() => setVenueId(null)}
              style={[styles.venueChip, !venueId && styles.venueChipActive]}
            >
              <Text style={[styles.venueChipText, !venueId && styles.venueChipTextActive]}>
                {t('stories.noVenue')}
              </Text>
            </TouchableOpacity>
            {myVenues.map((v) => (
              <TouchableOpacity
                key={v.id}
                onPress={() => setVenueId(v.id)}
                style={[styles.venueChip, venueId === v.id && styles.venueChipActive]}
              >
                <Text style={[styles.venueChipText, venueId === v.id && styles.venueChipTextActive]}>
                  {v.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      <Text style={styles.expiryNote}>⏱ {t('stories.expires24h')}</Text>

      {/* Share button */}
      <TouchableOpacity
        style={[styles.shareBtn, (!media || loading) && styles.shareBtnDisabled]}
        onPress={handlePost}
        disabled={!media || loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.shareBtnText}>{t('stories.share')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07071A' },
  content: { padding: 20, paddingBottom: 40 },
  previewContainer: { width: '100%', height: 320, borderRadius: 16, overflow: 'hidden', marginBottom: 16, position: 'relative' },
  preview: { width: '100%', height: '100%' },
  removeMedia: {
    position: 'absolute', top: 10, right: 10,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  removeMediaText: { color: '#fff', fontSize: 18, lineHeight: 22 },
  pickRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  pickBtn: {
    flex: 1, height: 120, borderRadius: 16,
    backgroundColor: '#0E0E28', borderWidth: 1.5,
    borderColor: '#1C1C42', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  pickBtnPrimary: { borderColor: 'rgba(124,58,237,0.4)', backgroundColor: 'rgba(124,58,237,0.06)' },
  pickIcon: { fontSize: 28 },
  pickLabel: { color: '#9CA3AF', fontSize: 13, fontFamily: 'Inter-Medium' },
  captionInput: {
    backgroundColor: '#0E0E28', borderWidth: 1, borderColor: '#1C1C42',
    borderRadius: 12, padding: 14, color: '#fff', fontSize: 14,
    fontFamily: 'Inter-Regular', marginBottom: 20, minHeight: 80,
    textAlignVertical: 'top',
  },
  sectionLabel: { color: '#6B7280', fontSize: 12, fontFamily: 'Inter-Medium', marginBottom: 10 },
  vibeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  vibeTag: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#1C1C42', borderWidth: 1, borderColor: '#2D2D5E',
  },
  vibeTagActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  vibeTagText: { color: '#9CA3AF', fontSize: 12, fontFamily: 'Inter-Medium', textTransform: 'capitalize' },
  vibeTagTextActive: { color: '#fff' },
  venueRow: { marginBottom: 20 },
  venueChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#1C1C42', borderWidth: 1, borderColor: '#2D2D5E', marginRight: 8,
  },
  venueChipActive: { backgroundColor: 'rgba(124,58,237,0.2)', borderColor: '#7C3AED' },
  venueChipText: { color: '#9CA3AF', fontSize: 13, fontFamily: 'Inter-Medium' },
  venueChipTextActive: { color: '#7C3AED' },
  expiryNote: { color: '#4B5563', fontSize: 12, marginBottom: 20, textAlign: 'center' },
  shareBtn: {
    backgroundColor: '#7C3AED', borderRadius: 14, height: 52,
    alignItems: 'center', justifyContent: 'center',
  },
  shareBtnDisabled: { opacity: 0.4 },
  shareBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter-SemiBold' },
});
