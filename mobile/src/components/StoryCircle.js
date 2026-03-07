import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

export default function StoryCircle({ story, onPress }) {
  const label = story.source === 'venue' ? story.venue?.name : story.author?.full_name;
  const imageUri = story.venue?.cover_image || story.author?.avatar;

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.8}>
      <View style={styles.ring}>
        <View style={styles.inner}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <Text style={{ fontSize: 24 }}>{story.source === 'venue' ? '🏢' : '👤'}</Text>
          )}
        </View>
      </View>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginRight: 12, width: 72 },
  ring: {
    width: 68, height: 68, borderRadius: 34,
    padding: 2,
    background: 'linear-gradient(45deg, #FF3D57, #7B2FBE)',
    borderWidth: 2,
    borderColor: '#FF3D57',
  },
  inner: {
    width: '100%', height: '100%', borderRadius: 30,
    backgroundColor: '#12121A', overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#0A0A0F',
  },
  image: { width: '100%', height: '100%' },
  label: { color: '#9CA3AF', fontSize: 10, marginTop: 4, textAlign: 'center' },
});
