import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity, Dimensions,
  StyleSheet, StatusBar, Animated, TextInput, Keyboard,
  PanResponder,
} from 'react-native';
import { useTranslation } from '../i18n/LanguageContext';

const { width, height } = Dimensions.get('window');
const REACTIONS = ['🔥', '❤️', '😮', '🙌', '😂'];

function FloatingEmoji({ emoji, x }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -100] });
  const opacity = anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.8, 0] });
  const scale = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 1.5, 0.8] });
  return (
    <Animated.Text style={[styles.floatEmoji, { left: x, transform: [{ translateY }, { scale }], opacity }]}>
      {emoji}
    </Animated.Text>
  );
}

export default function StoriesScreen({ route, navigation }) {
  const { stories = [], initialIndex = 0 } = route.params || {};
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);
  const [reply, setReply] = useState('');
  const [replySent, setReplySent] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const progress = useRef(new Animated.Value(0)).current;
  const animRef = useRef(null);
  const pausedRef = useRef(false);

  const current = stories[currentIndex];

  const goNext = () => {
    if (currentIndex < stories.length - 1) setCurrentIndex((i) => i + 1);
    else navigation.goBack();
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const startProgress = () => {
    progress.setValue(0);
    animRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    });
    animRef.current.start(({ finished }) => {
      if (finished && !pausedRef.current) goNext();
    });
  };

  useEffect(() => {
    if (stories.length === 0) { navigation.goBack(); return; }
    startProgress();
    return () => animRef.current?.stop();
  }, [currentIndex]);

  useEffect(() => {
    if (paused) {
      animRef.current?.stop();
    } else {
      // Resume from current value
      const listener = progress.addListener(({ value }) => {
        progress.removeAllListeners();
        animRef.current = Animated.timing(progress, {
          toValue: 1,
          duration: (1 - value) * 5000,
          useNativeDriver: false,
        });
        animRef.current.start(({ finished }) => {
          if (finished) goNext();
        });
      });
      progress.__getValue && startProgress();
      return () => progress.removeListener(listener);
    }
  }, [paused]);

  const sendReaction = (emoji) => {
    const id = Date.now();
    const x = 20 + Math.random() * (width - 80);
    setFloatingEmojis((prev) => [...prev, { emoji, id, x }]);
    setTimeout(() => setFloatingEmojis((prev) => prev.filter((e) => e.id !== id)), 1300);
  };

  const sendReply = () => {
    if (!reply.trim()) return;
    setReply('');
    Keyboard.dismiss();
    setReplySent(true);
    setTimeout(() => setReplySent(false), 2000);
  };

  if (!current) return null;

  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const viewCount = current.view_count || (currentIndex + 1) * 13 + 7;

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Media */}
      {current.media ? (
        <Image source={{ uri: current.media }} style={styles.media} resizeMode="cover" />
      ) : (
        <View style={[styles.media, styles.mediaPlaceholder]}>
          <Text style={{ fontSize: 64 }}>🏢</Text>
          <Text style={styles.placeholderText}>{current.caption || 'Live from the venue'}</Text>
        </View>
      )}
      <View style={styles.overlay} />

      {/* Progress bars */}
      <View style={styles.progressContainer}>
        {stories.map((_, i) => (
          <View key={i} style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: i < currentIndex ? '100%' : i === currentIndex ? progressWidth : '0%' },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <View style={styles.authorAvatar}>
            {current.venue?.cover_image ? (
              <Image source={{ uri: current.venue.cover_image }} style={styles.authorImg} />
            ) : (
              <Text style={{ fontSize: 16 }}>{current.source === 'venue' ? '🏢' : '👤'}</Text>
            )}
          </View>
          <View>
            <Text style={styles.authorName}>{current.venue?.name || current.author?.full_name}</Text>
            <Text style={styles.timeAgo}>
              {new Date(current.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.viewCount}>👁 {viewCount}</Text>
          <Text style={styles.indexCount}>{currentIndex + 1}/{stories.length}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Caption */}
      {current.caption && (
        <View style={styles.captionContainer}>
          <View style={styles.captionBubble}>
            <Text style={styles.caption}>{current.caption}</Text>
          </View>
        </View>
      )}

      {/* Bottom: reactions + reply */}
      <View style={styles.bottomBar}>
        <View style={styles.reactionsRow}>
          {REACTIONS.map((emoji) => (
            <TouchableOpacity key={emoji} onPress={() => sendReaction(emoji)} style={styles.reactionBtn}>
              <Text style={styles.reactionEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.replyRow}>
          {replySent ? (
            <View style={styles.replySentBox}>
              <Text style={styles.replySentText}>{t('stories.sent')}</Text>
            </View>
          ) : (
            <TextInput
              style={styles.replyInput}
              placeholder={`${t('stories.replyPlaceholder')} ${current.venue?.name || current.author?.full_name || ''}...`}
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={reply}
              onChangeText={setReply}
              onSubmitEditing={sendReply}
              onFocus={() => { pausedRef.current = true; setPaused(true); }}
              onBlur={() => { pausedRef.current = false; setPaused(false); }}
              returnKeyType="send"
            />
          )}
          <TouchableOpacity onPress={sendReply} style={styles.sendBtn}>
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation touch areas */}
      <TouchableOpacity
        style={styles.leftArea}
        onPress={goPrev}
        onLongPress={() => { pausedRef.current = true; setPaused(true); }}
        onPressOut={() => { pausedRef.current = false; setPaused(false); }}
      />
      <TouchableOpacity
        style={styles.rightArea}
        onPress={goNext}
        onLongPress={() => { pausedRef.current = true; setPaused(true); }}
        onPressOut={() => { pausedRef.current = false; setPaused(false); }}
      />

      {/* Floating emojis */}
      {floatingEmojis.map(({ emoji, id, x }) => (
        <FloatingEmoji key={id} emoji={emoji} x={x} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  media: { position: 'absolute', width, height },
  mediaPlaceholder: {
    backgroundColor: '#12103A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, paddingHorizontal: 32, textAlign: 'center' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)' },
  progressContainer: { position: 'absolute', top: 52, left: 12, right: 12, flexDirection: 'row', gap: 4, zIndex: 10 },
  progressTrack: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff' },
  header: { position: 'absolute', top: 64, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(124,58,237,0.4)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#7C3AED' },
  authorImg: { width: 36, height: 36 },
  authorName: { color: '#fff', fontWeight: '600', fontSize: 14 },
  timeAgo: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  viewCount: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  indexCount: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  closeBtn: { padding: 6 },
  closeText: { color: '#fff', fontSize: 20 },
  captionContainer: { position: 'absolute', left: 16, right: 16, bottom: 140 },
  captionBubble: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 12 },
  caption: { color: '#fff', fontSize: 14, lineHeight: 20 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: 28, paddingTop: 12, paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    gap: 10,
  },
  reactionsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  reactionBtn: { padding: 6 },
  reactionEmoji: { fontSize: 28 },
  replyRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  replyInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 14,
  },
  replySentBox: { flex: 1, backgroundColor: 'rgba(20,184,166,0.2)', borderWidth: 1, borderColor: 'rgba(20,184,166,0.4)', borderRadius: 24, paddingVertical: 10, alignItems: 'center' },
  replySentText: { color: '#14B8A6', fontSize: 14 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  leftArea: { position: 'absolute', left: 0, top: 0, bottom: 120, width: width * 0.35, zIndex: 5 },
  rightArea: { position: 'absolute', right: 0, top: 0, bottom: 120, width: width * 0.35, zIndex: 5 },
  floatEmoji: { position: 'absolute', bottom: 130, fontSize: 30, zIndex: 20 },
});
