import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { storyAPI } from '../services/api';
import StoriesFeed from '../components/StoriesFeed';
import PostStoryModal from '../components/PostStoryModal';
import { toast } from 'react-toastify';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const AVATAR_PALETTE = ['#7C3AED', '#14B8A6', '#F59E0B', '#EC4899', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6'];
function avatarColor(name = '') {
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
}

function Avatar({ name = '?', size = 40 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38, backgroundColor: avatarColor(name) }}
    >
      {name[0]?.toUpperCase()}
    </div>
  );
}

function PriceDisplay({ level }) {
  if (!level) return null;
  return (
    <span className="text-xs font-medium">
      <span className="text-green-400">{'$'.repeat(level)}</span>
      <span className="text-gray-700">{'$'.repeat(4 - level)}</span>
    </span>
  );
}

// ─── Feed post cards ───────────────────────────────────────────────────────────

function StoryPost({ item, onLike }) {
  const [liked, setLiked] = useState(item.liked);
  const [likeCount, setLikeCount] = useState(item.like_count);
  const [heartAnim, setHeartAnim] = useState(false);
  const [shared, setShared] = useState(false);

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikeCount(c => next ? c + 1 : c - 1);
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 400);
    try {
      await storyAPI.like(item.story_id);
    } catch {
      setLiked(!next);
      setLikeCount(c => next ? c - 1 : c + 1);
    }
  };

  const handleShare = () => {
    const url = item.venue ? `${window.location.origin}/venue/${item.venue.slug}` : window.location.href;
    navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleDoubleTap = () => {
    if (!liked) handleLike();
  };

  return (
    <article className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar name={item.author.full_name} size={38} />
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-tight">{item.author.full_name}</p>
          {item.venue ? (
            <Link to={`/venue/${item.venue.slug}`} className="text-xs text-primary hover:underline">
              📍 {item.venue.name} · {item.venue.city}
            </Link>
          ) : (
            <p className="text-xs text-gray-500">{item.author.city || 'WayyOut'}</p>
          )}
        </div>
        <span className="text-xs text-gray-600 flex-shrink-0">{timeAgo(item.created_at)}</span>
      </div>

      {/* Media */}
      {item.media && (
        <div
          className="relative bg-dark-border cursor-pointer select-none"
          style={{ aspectRatio: '4/5', maxHeight: 500 }}
          onDoubleClick={handleDoubleTap}
        >
          {item.media_type === 'video' ? (
            <video
              src={item.media}
              className="w-full h-full object-cover"
              controls
              muted
              playsInline
              loop
            />
          ) : (
            <img
              src={item.media}
              alt={item.caption || ''}
              className="w-full h-full object-cover"
              draggable={false}
            />
          )}
          {/* Vibe tags */}
          {item.vibe_tags?.length > 0 && (
            <div className="absolute bottom-3 left-3 flex gap-1 flex-wrap">
              {item.vibe_tags.map(tag => (
                <span key={tag} className="text-xs bg-black/60 backdrop-blur-sm text-primary px-2 py-0.5 rounded-full">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Caption */}
      {item.caption && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-gray-200 text-sm leading-relaxed">
            <span className="font-semibold text-white mr-1">{item.author.full_name.split(' ')[0]}</span>
            {item.caption}
          </p>
        </div>
      )}

      {/* Action bar */}
      <div className="px-4 py-3 flex items-center gap-4">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm font-medium transition-all ${liked ? 'text-red-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <span
            className={`text-xl transition-transform ${heartAnim ? 'scale-150' : 'scale-100'}`}
            style={{ transition: 'transform 0.3s cubic-bezier(0.36,0.07,0.19,0.97)' }}
          >
            {liked ? '❤️' : '🤍'}
          </span>
          <span>{likeCount > 0 ? likeCount : ''}</span>
        </button>

        <span className="text-gray-600 text-xs">👁 {item.view_count || 0}</span>

        <div className="flex-1" />

        <button
          onClick={handleShare}
          className="text-gray-500 hover:text-gray-300 text-sm transition-colors flex items-center gap-1"
        >
          {shared ? <span className="text-green-400 text-xs">Copied!</span> : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          )}
        </button>
      </div>
    </article>
  );
}

function GoingPost({ item }) {
  return (
    <article className="bg-dark-card border border-dark-border rounded-2xl px-4 py-4 flex gap-3 items-start">
      <Avatar name={item.author.full_name} size={42} />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm">
          <span className="font-semibold">{item.author.full_name}</span>
          {' '}is going out tonight 🎉
        </p>
        {item.venue && (
          <Link
            to={`/venue/${item.venue.slug}`}
            className="flex items-center gap-2 mt-2 p-3 bg-dark border border-dark-border rounded-xl hover:border-primary/40 transition-colors"
          >
            {item.venue.cover_image ? (
              <img src={item.venue.cover_image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">🏢</div>
            )}
            <div className="min-w-0">
              <p className="text-white font-medium text-sm truncate">{item.venue.name}</p>
              <p className="text-gray-500 text-xs">{item.venue.city} · <PriceDisplay level={item.venue.price_level} /></p>
            </div>
            <span className="ml-auto text-primary text-xs flex-shrink-0">View →</span>
          </Link>
        )}
        <p className="text-gray-600 text-xs mt-2">{timeAgo(item.created_at)}</p>
      </div>
    </article>
  );
}

function ReviewPost({ item }) {
  const stars = item.rating || 0;
  return (
    <article className="bg-dark-card border border-dark-border rounded-2xl px-4 py-4">
      <div className="flex gap-3 items-start mb-3">
        <Avatar name={item.author.full_name} size={38} />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm">
            <span className="font-semibold">{item.author.full_name}</span>
            {' '}reviewed{' '}
            <Link to={item.venue ? `/venue/${item.venue.slug}` : '#'} className="text-primary hover:underline">
              {item.venue?.name || 'a venue'}
            </Link>
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            {[1,2,3,4,5].map(i => (
              <span key={i} className={`text-sm ${i <= stars ? 'text-yellow-400' : 'text-gray-700'}`}>★</span>
            ))}
            <span className="text-gray-600 text-xs ml-1">{timeAgo(item.created_at)}</span>
          </div>
        </div>
      </div>
      {item.text && (
        <p className="text-gray-300 text-sm leading-relaxed bg-dark rounded-xl px-4 py-3 border border-dark-border">
          "{item.text}"
        </p>
      )}
    </article>
  );
}

function VenueUpdatePost({ item }) {
  const busyColor = item.busy_level > 70 ? 'text-red-400' : item.busy_level > 40 ? 'text-yellow-400' : 'text-green-400';
  const busyBg = item.busy_level > 70 ? 'bg-red-500' : item.busy_level > 40 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <article className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
      {item.venue?.cover_image && (
        <div className="relative h-40 overflow-hidden">
          <img src={item.venue.cover_image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-dark-card/40 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="badge-open text-xs">● Open Now</span>
          </div>
        </div>
      )}
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <Link to={`/venue/${item.venue?.slug}`} className="font-display font-bold text-white hover:text-primary transition-colors">
              {item.venue?.name}
            </Link>
            <p className="text-gray-500 text-xs mt-0.5">
              📍 {item.venue?.city}
              {item.venue?.price_level && (
                <span className="ml-2"><PriceDisplay level={item.venue.price_level} /></span>
              )}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-sm font-semibold ${busyColor}`}>{item.busy_level}%</p>
            <p className="text-gray-600 text-xs">busy</p>
          </div>
        </div>

        <p className="text-gray-300 text-sm mb-3">{item.subtext}</p>

        {/* Busy bar */}
        <div className="h-1.5 bg-dark-border rounded-full overflow-hidden mb-3">
          <div className={`h-full ${busyBg} rounded-full transition-all`} style={{ width: `${item.busy_level}%` }} />
        </div>

        <Link
          to={`/venue/${item.venue?.slug}`}
          className="btn-primary text-sm py-2.5 block text-center"
        >
          View Venue →
        </Link>
      </div>
    </article>
  );
}

function SkeletonPost() {
  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden animate-pulse">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-full bg-dark-border" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-dark-border rounded w-1/3" />
          <div className="h-2.5 bg-dark-border rounded w-1/2" />
        </div>
      </div>
      <div className="h-64 bg-dark-border" />
      <div className="px-4 py-3 space-y-2">
        <div className="h-3 bg-dark-border rounded w-3/4" />
        <div className="h-3 bg-dark-border rounded w-1/2" />
      </div>
    </div>
  );
}

// ─── Main Feed page ────────────────────────────────────────────────────────────

export default function Feed() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const loaderRef = useRef(null);

  const loadPage = useCallback(async (p, append = false) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const res = await storyAPI.socialFeed({ page: p });
      const { results, has_next } = res.data;
      setPosts(prev => append ? [...prev, ...results] : results);
      setHasNext(has_next);
    } catch {
      toast.error('Could not load feed.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { loadPage(1); }, [loadPage]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNext && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadPage(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasNext, loadingMore, page, loadPage]);

  const handlePosted = (story) => {
    const newPost = {
      id: `story_${story.id}`,
      type: 'story',
      created_at: story.created_at,
      author: story.author,
      venue: story.venue,
      media: story.media,
      media_type: story.media_type,
      caption: story.caption,
      vibe_tags: story.vibe_tags,
      view_count: 0,
      like_count: 0,
      liked: false,
      story_id: story.id,
    };
    setPosts(prev => [newPost, ...prev]);
  };

  return (
    <div className="pt-16 min-h-screen" style={{ background: 'linear-gradient(180deg, #0D0D1F 0%, #0a0a18 100%)' }}>
      <div className="max-w-lg mx-auto px-0 sm:px-4 py-4">

        {/* Stories bar */}
        <div className="bg-dark-card border-b border-dark-border sm:rounded-2xl sm:border px-4 py-4 mb-4">
          <StoriesFeed />
        </div>

        {/* New post button for authenticated users */}
        {isAuthenticated && (
          <div className="bg-dark-card border border-dark-border rounded-2xl px-4 py-3 mb-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-lg">+</div>
            <button
              onClick={() => setPostModalOpen(true)}
              className="flex-1 text-left text-gray-500 text-sm hover:text-gray-300 transition-colors"
            >
              Share a moment, story, or venue experience...
            </button>
            <button onClick={() => setPostModalOpen(true)} className="btn-primary text-xs py-1.5 px-3">
              Post
            </button>
          </div>
        )}

        {/* Feed posts */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonPost key={i} />)
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-dark-card rounded-2xl border border-dark-border">
              <p className="text-5xl mb-4">🌃</p>
              <p className="text-white font-semibold text-lg mb-2">The feed is quiet</p>
              <p className="text-gray-500 text-sm mb-6">Be the first to post a story or add friends to see their activity</p>
              {isAuthenticated ? (
                <button onClick={() => setPostModalOpen(true)} className="btn-primary">
                  Post a story
                </button>
              ) : (
                <Link to="/register" className="btn-primary">Join WayyOut</Link>
              )}
            </div>
          ) : (
            posts.map(post => {
              switch (post.type) {
                case 'story':
                  return <StoryPost key={post.id} item={post} />;
                case 'going':
                  return <GoingPost key={post.id} item={post} />;
                case 'review':
                  return <ReviewPost key={post.id} item={post} />;
                case 'venue_update':
                  return <VenueUpdatePost key={post.id} item={post} />;
                default:
                  return null;
              }
            })
          )}

          {/* Load more sentinel */}
          <div ref={loaderRef} className="h-4" />

          {loadingMore && (
            <div className="flex justify-center py-4">
              <div className="flex space-x-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {!hasNext && posts.length > 0 && (
            <p className="text-center text-gray-700 text-xs py-4">You're all caught up ✓</p>
          )}
        </div>
      </div>

      {postModalOpen && (
        <PostStoryModal
          onClose={() => setPostModalOpen(false)}
          onPosted={handlePosted}
        />
      )}
    </div>
  );
}
