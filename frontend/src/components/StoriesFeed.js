import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { storyAPI, adAPI } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';
import PostStoryModal from './PostStoryModal';

const REACTIONS = ['🔥', '❤️', '😮', '🙌', '😂'];
const AD_INJECT_AFTER = 3; // inject ad circle after every N real story circles

function StoryCircle({ story, onClick, seen }) {
  const isVenue = story.source === 'venue';
  return (
    <button
      onClick={() => onClick(story)}
      className="flex flex-col items-center space-y-1 flex-shrink-0 group"
    >
      <div className={`p-0.5 rounded-full transition-opacity ${seen ? 'opacity-50' : 'story-ring'}`}>
        <div className="w-16 h-16 rounded-full overflow-hidden bg-dark-card border-2 border-dark">
          {story.venue?.cover_image || story.author?.avatar ? (
            <img
              src={story.venue?.cover_image || story.author?.avatar}
              alt={story.venue?.name || story.author?.full_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent-purple/30 flex items-center justify-center text-xl">
              {isVenue ? '🏢' : '👤'}
            </div>
          )}
        </div>
      </div>
      <span className="text-xs text-gray-400 max-w-[72px] truncate text-center">
        {isVenue ? story.venue?.name : story.author?.full_name}
      </span>
    </button>
  );
}

function AdStoryCircle({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center space-y-1 flex-shrink-0 group"
    >
      <div className="p-0.5 rounded-full" style={{ background: 'linear-gradient(135deg, #7C3AED, #a855f7, #7C3AED)' }}>
        <div className="w-16 h-16 rounded-full overflow-hidden bg-dark-card border-2 border-dark flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent-purple/30">
          <span className="text-2xl">✨</span>
        </div>
      </div>
      <span className="text-xs text-primary max-w-[72px] truncate text-center font-medium">Sponsored</span>
    </button>
  );
}

function AdStoryView({ ad, onClose, onNext }) {
  useEffect(() => {
    adAPI.impression(ad.id).catch(() => {});
  }, [ad.id]);

  return (
    <div className="w-full h-full relative">
      {/* Background */}
      {ad.venue_cover || ad.image ? (
        <img src={ad.image || ad.venue_cover} alt={ad.headline} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent-purple/30 flex items-center justify-center">
          <span className="text-7xl">🏢</span>
        </div>
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

      {/* Sponsored badge */}
      <div className="absolute top-16 left-3 z-10 bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-primary rounded-full" />
        Sponsored
      </div>

      {/* Content */}
      <div className="absolute bottom-12 left-4 right-4 z-10 space-y-3">
        <p className="text-white/60 text-xs">{ad.venue_name} · {ad.venue_city}</p>
        <h3 className="font-bold text-white text-xl leading-tight">{ad.headline}</h3>
        {ad.body && <p className="text-white/80 text-sm leading-relaxed">{ad.body}</p>}
        <Link
          to={`/venues/${ad.venue_slug}`}
          onClick={onClose}
          className="btn-primary text-sm py-3 px-6 inline-block w-full text-center mt-2"
        >
          {ad.cta_text || 'Book Now'}
        </Link>
      </div>

      {/* Skip button */}
      <button
        onClick={onNext}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 text-white/50 text-xs hover:text-white transition-colors"
      >
        Skip ad →
      </button>
    </div>
  );
}

function StoryViewer({ stories, activeIndex, setActiveIndex, onClose, t }) {
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reply, setReply] = useState('');
  const [replySent, setReplySent] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const timerRef = useRef(null);
  const story = stories[activeIndex];

  const goNext = useCallback(() => {
    if (activeIndex < stories.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      onClose();
    }
  }, [activeIndex, stories.length, setActiveIndex, onClose]);

  const goPrev = useCallback(() => {
    if (activeIndex > 0) setActiveIndex(activeIndex - 1);
  }, [activeIndex, setActiveIndex]);

  useEffect(() => {
    setProgress(0);
  }, [activeIndex]);

  useEffect(() => {
    if (paused) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timerRef.current);
          goNext();
          return 100;
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [paused, activeIndex, goNext]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, onClose]);

  const sendReaction = (emoji) => {
    const id = Date.now();
    const x = 15 + Math.random() * 70;
    setFloatingEmojis((prev) => [...prev, { emoji, id, x }]);
    setTimeout(() => setFloatingEmojis((prev) => prev.filter((e) => e.id !== id)), 1400);
  };

  const sendReply = () => {
    if (!reply.trim()) return;
    setReply('');
    setReplySent(true);
    setTimeout(() => setReplySent(false), 2000);
  };

  if (!story) return null;

  const isAd = story.type === 'ad';
  const viewCount = story.view_count || Math.floor((activeIndex + 1) * 13 + 7);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={onClose}>
      <div
        className="relative w-full max-w-sm bg-dark-card overflow-hidden rounded-2xl shadow-2xl"
        style={{ height: 'min(100vh, 780px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 z-10 flex gap-1">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/25 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{
                  width: i < activeIndex ? '100%' : i === activeIndex ? `${progress}%` : '0%',
                  transition: i < activeIndex ? 'none' : undefined,
                }}
              />
            </div>
          ))}
        </div>

        {/* Header (hidden for ad stories — shown inline in AdStoryView) */}
        {!isAd && (
          <div className="absolute top-7 left-3 right-3 z-10 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-full bg-dark-border overflow-hidden ring-2 ring-primary/60">
                {story.venue?.cover_image || story.author?.avatar ? (
                  <img src={story.venue?.cover_image || story.author?.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/30 flex items-center justify-center text-white text-sm font-bold">
                    {(story.venue?.name || story.author?.full_name || '?')[0]}
                  </div>
                )}
              </div>
              <div>
                <p className="text-white text-xs font-semibold leading-tight">
                  {story.venue?.name || story.author?.full_name}
                </p>
                <p className="text-white/50 text-[10px]">
                  {new Date(story.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/50 text-xs">👁 {viewCount}</span>
              <span className="text-white/40 text-xs">{activeIndex + 1}/{stories.length}</span>
              <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none w-7 h-7 flex items-center justify-center">
                ×
              </button>
            </div>
          </div>
        )}

        {/* Close button for ad stories */}
        {isAd && (
          <button
            onClick={onClose}
            className="absolute top-7 right-3 z-20 text-white/80 hover:text-white text-2xl leading-none w-7 h-7 flex items-center justify-center"
          >
            ×
          </button>
        )}

        {/* Media / Ad content */}
        {isAd ? (
          <AdStoryView ad={story.ad_data} onClose={onClose} onNext={goNext} />
        ) : (
          <div
            className="w-full h-full select-none"
            onMouseDown={() => setPaused(true)}
            onMouseUp={() => setPaused(false)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
          >
            {story.media_type === 'video' ? (
              <video src={story.media} className="w-full h-full object-cover" autoPlay muted loop />
            ) : story.media ? (
              <img src={story.media} alt={story.caption || ''} className="w-full h-full object-cover" draggable={false} />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent-purple/30 flex flex-col items-center justify-center gap-4">
                <span className="text-7xl">🏢</span>
                <p className="text-white/60 text-sm px-8 text-center">{story.caption || 'Live from the venue'}</p>
              </div>
            )}
          </div>
        )}

        {/* Paused indicator (regular stories only) */}
        {!isAd && paused && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center">
              <div className="flex gap-1">
                <div className="w-1.5 h-6 bg-white rounded-full" />
                <div className="w-1.5 h-6 bg-white rounded-full" />
              </div>
            </div>
          </div>
        )}

        {/* Caption (regular stories only) */}
        {!isAd && story.caption && (
          <div className="absolute left-3 right-3 z-10" style={{ bottom: '110px' }}>
            <div className="bg-black/50 backdrop-blur-sm rounded-xl p-3">
              <p className="text-white text-sm leading-relaxed">{story.caption}</p>
              {story.vibe_tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {story.vibe_tags.map((tag) => (
                    <span key={tag} className="text-xs text-primary/80">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom: reactions + reply (regular stories only) */}
        {!isAd && (
          <div className="absolute bottom-0 left-0 right-0 p-3 pt-4 z-10 bg-gradient-to-t from-black/80 to-transparent space-y-2">
            <div className="flex justify-around">
              {REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="text-2xl hover:scale-125 active:scale-90 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {replySent ? (
                <div className="flex-1 bg-green-500/20 border border-green-500/40 rounded-full px-4 py-2 text-green-400 text-sm text-center">
                  {t('stories.sent')}
                </div>
              ) : (
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                  placeholder={`${t('stories.replyTo')} ${story.venue?.name || story.author?.full_name || ''}...`}
                  className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white text-sm placeholder-white/40 outline-none focus:border-primary"
                />
              )}
              <button
                onClick={sendReply}
                className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0 hover:bg-primary-dark transition-colors"
              >
                ↑
              </button>
            </div>
          </div>
        )}

        {/* Tap nav areas */}
        <button onClick={goPrev} className="absolute left-0 top-12 z-20" style={{ bottom: '120px', width: '33%' }} />
        <button onClick={goNext} className="absolute right-0 top-12 z-20" style={{ bottom: '120px', width: '33%' }} />

        {/* Floating emoji reactions */}
        {floatingEmojis.map(({ emoji, id, x }) => (
          <div
            key={id}
            className="absolute pointer-events-none text-3xl z-30 animate-float-up"
            style={{ left: `${x}%`, bottom: '110px' }}
          >
            {emoji}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StoriesFeed({ city }) {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [stories, setStories] = useState([]);
  const [displayItems, setDisplayItems] = useState([]); // stories + injected ad slots
  const [activeIndex, setActiveIndex] = useState(null);
  const [seenIds, setSeenIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [feedAd, setFeedAd] = useState(null);
  const [postModalOpen, setPostModalOpen] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const params = city ? { city } : {};
        const [storyRes, adRes] = await Promise.all([
          storyAPI.feed(params),
          adAPI.feed().catch(() => null),
        ]);
        const fetched = storyRes.data.results || storyRes.data;
        setStories(fetched);

        const ad = adRes?.status === 200 ? adRes.data : null;
        setFeedAd(ad);

        // Build display list: inject ad synthetic story after every AD_INJECT_AFTER real stories
        if (ad) {
          const adStory = {
            id: `ad_${ad.id}`,
            type: 'ad',
            ad_data: ad,
            venue: { name: ad.venue_name },
            created_at: new Date().toISOString(),
          };
          const items = [];
          fetched.forEach((s, i) => {
            items.push(s);
            if ((i + 1) % AD_INJECT_AFTER === 0) {
              items.push({ ...adStory, _adSlot: i }); // unique slot key
            }
          });
          setDisplayItems(items);
        } else {
          setDisplayItems(fetched);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [city]);

  const handleStoryClick = (item) => {
    const index = displayItems.findIndex((s) => s.id === item.id);
    setActiveIndex(index);
    if (item.type !== 'ad') {
      setSeenIds((prev) => new Set([...prev, item.id]));
      storyAPI.view(item.id).catch(() => {});
    }
  };

  const handleSetActiveIndex = (index) => {
    if (index >= 0 && index < displayItems.length) {
      const item = displayItems[index];
      if (item.type !== 'ad') {
        setSeenIds((prev) => new Set([...prev, item.id]));
        storyAPI.view(item.id).catch(() => {});
      }
    }
    setActiveIndex(index);
  };

  if (loading) {
    return (
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col items-center space-y-1 flex-shrink-0 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-dark-border" />
            <div className="w-12 h-2 bg-dark-border rounded" />
          </div>
        ))}
      </div>
    );
  }

  const handlePosted = (newStory) => {
    setStories((prev) => [newStory, ...prev]);
    setDisplayItems((prev) => [newStory, ...prev]);
  };

  if (!stories.length && !isAuthenticated) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        {t('stories.empty')}
      </div>
    );
  }

  return (
    <>
      <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
        {/* Your Story circle — authenticated users only */}
        {isAuthenticated && (
          <button
            onClick={() => setPostModalOpen(true)}
            className="flex flex-col items-center space-y-1 flex-shrink-0 group"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-dark-card border-2 border-dashed border-primary/50 flex items-center justify-center group-hover:border-primary transition-colors">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover opacity-60" />
                ) : (
                  <span className="text-xl text-primary/60 group-hover:text-primary transition-colors">+</span>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-dark">
                +
              </div>
            </div>
            <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors max-w-[72px] truncate text-center">
              {t('stories.yourStory')}
            </span>
          </button>
        )}

        {displayItems.map((item) =>
          item.type === 'ad' ? (
            <AdStoryCircle
              key={`adcircle_${item._adSlot ?? item.id}`}
              onClick={() => handleStoryClick(item)}
            />
          ) : (
            <StoryCircle
              key={item.id}
              story={item}
              onClick={handleStoryClick}
              seen={seenIds.has(item.id)}
            />
          )
        )}
      </div>

      {activeIndex !== null && (
        <StoryViewer
          stories={displayItems}
          activeIndex={activeIndex}
          setActiveIndex={handleSetActiveIndex}
          onClose={() => setActiveIndex(null)}
          t={t}
        />
      )}

      {postModalOpen && (
        <PostStoryModal
          onClose={() => setPostModalOpen(false)}
          onPosted={handlePosted}
        />
      )}
    </>
  );
}
