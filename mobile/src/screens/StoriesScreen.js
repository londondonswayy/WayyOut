import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity, Dimensions,
  StyleSheet, StatusBar, Animated
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function StoriesScreen({ route, navigation }) {
  const { stories = [], initialIndex = 0 } = route.params || {};
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const progress = useRef(new Animated.Value(0)).current;
  const animRef = useRef(null);

  const current = stories[currentIndex];

  const startProgress = () => {
    progress.setValue(0);
    animRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    });
    animRef.current.start(({ finished }) => {
      if (finished) goNext();
    });
  };

  useEffect(() => {
    if (stories.length === 0) { navigation.goBack(); return; }
    startProgress();
    return () => animRef.current?.stop();
  }, [currentIndex]);

  const goNext = () => {
    if (currentIndex < stories.length - 1) setCurrentIndex(currentIndex + 1);
    else navigation.goBack();
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  if (!current) return null;

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Media */}
      <Image source={{ uri: current.media }} style={styles.media} resizeMode="cover" />
      <View style={styles.overlay} />

      {/* Progress bars */}
      <View style={styles.progressContainer}>
        {stories.map((_, i) => (
          <View key={i} style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: i < currentIndex ? '100%' : i === currentIndex ? progressWidth : '0%',
                },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <View style={styles.authorAvatar}>
            <Text style={{ fontSize: 16 }}>{current.source === 'venue' ? '🏢' : '👤'}</Text>
          </View>
          <View>
            <Text style={styles.authorName}>
              {current.venue?.name || current.author?.full_name}
            </Text>
            <Text style={styles.timeAgo}>
              {new Date(current.created_at).toLocaleTimeString()}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Caption */}
      {current.caption && (
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>{current.caption}</Text>
        </View>
      )}

      {/* Navigation touch areas */}
      <TouchableOpacity style={styles.leftArea} onPress={goPrev} />
      <TouchableOpacity style={styles.rightArea} onPress={goNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  media: { position: 'absolute', width, height },
  overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.2)' },
  progressContainer: { position: 'absolute', top: 48, left: 12, right: 12, flexDirection: 'row', gap: 4 },
  progressTrack: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff' },
  header: { position: 'absolute', top: 60, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  authorName: { color: '#fff', fontWeight: '600', fontSize: 14 },
  timeAgo: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  closeBtn: { padding: 8 },
  closeText: { color: '#fff', fontSize: 20 },
  captionContainer: { position: 'absolute', bottom: 60, left: 20, right: 20 },
  caption: { color: '#fff', fontSize: 16, fontWeight: '500' },
  leftArea: { position: 'absolute', left: 0, top: 0, bottom: 0, width: width * 0.35 },
  rightArea: { position: 'absolute', right: 0, top: 0, bottom: 0, width: width * 0.65 },
});
