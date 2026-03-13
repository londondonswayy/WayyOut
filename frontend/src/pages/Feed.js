import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { storyAPI, socialAPI } from '../services/api';
import StoriesFeed from '../components/StoriesFeed';
import PostStoryModal from '../components/PostStoryModal';
import { toast } from 'react-toastify';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

const PALETTE = ['#7C3AED','#14B8A6','#F59E0B','#EC4899','#3B82F6','#10B981','#EF4444'];
const avatarColor = (name = '') => PALETTE[name.charCodeAt(0) % PALETTE.length];

function Avatar({ name = '?', size = 36 }) {
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 select-none"
      style={{ width: size, height: size, fontSize: size * 0.38, backgroundColor: avatarColor(name) }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

// ─── Share sheet ──────────────────────────────────────────────────────────────

function ShareSheet({ postId, venueSlug, onClose, currentUser }) {
  const [friends, setFriends] = useState([]);
  const [sending, setSending] = useState(null);
  const [sent, setSent] = useState(new Set());
  const ref = useRef(null);

  useEffect(() => {
    if (currentUser) {
      socialAPI.friends().then(r => setFriends(r.data.friends || [])).catch(() => {});
    }
    // Close on outside click
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [currentUser, onClose]);

  const copyLink = () => {
    const url = venueSlug
      ? `${window.location.origin}/venue/${venueSlug}`
      : `${window.location.origin}/feed`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied!', { autoClose: 1500, hideProgressBar: true });
    onClose();
  };

  const sendToFriend = async (friendId, name) => {
    if (sending || sent.has(friendId)) return;
    setSending(friendId);
    try {
      await storyAPI.shareToFriend(postId, friendId);
      setSent(prev => new Set([...prev, friendId]));
      toast.success(`Sent to ${name}!`, { autoClose: 1500, hideProgressBar: true });
    } catch {
      toast.error('Could not send.');
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div ref={ref} className="w-full max-w-lg bg-dark-card border border-dark-border rounded-t-3xl p-5 pb-8 animate-slide-up"
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-dark-border rounded-full mx-auto mb-5" />
        <h3 className="font-semibold text-white text-center mb-4">Share post</h3>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <button onClick={copyLink} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-dark-border hover:border-primary/40 transition-colors">
            <span className="text-2xl">🔗</span>
            <span className="text-xs text-gray-400">Copy link</span>
          </button>
          {currentUser && (
            <button
              onClick={() => {
                // Repost as your own story via PostStoryModal — just show toast for now
                toast.info('Open "Post" to reshare to your story!', { autoClose: 2000 });
                onClose();
              }}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-dark-border hover:border-primary/40 transition-colors">
              <span className="text-2xl">📲</span>
              <span className="text-xs text-gray-400">Your story</span>
            </button>
          )}
          {venueSlug && (
            <Link to={`/venue/${venueSlug}`} onClick={onClose}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-dark-border hover:border-primary/40 transition-colors">
              <span className="text-2xl">🏢</span>
              <span className="text-xs text-gray-400">Venue page</span>
            </Link>
          )}
        </div>

        {/* Send to friends */}
        {currentUser && friends.length > 0 && (
          <>
            <p className="text-xs text-gray-500 mb-3">Send to a friend</p>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {friends.map(f => (
                <button key={f.friendship_id} onClick={() => sendToFriend(f.id, f.full_name)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <div className="relative">
                    <Avatar name={f.full_name} size={46} />
                    {sent.has(f.id) && (
                      <div className="absolute inset-0 rounded-full bg-green-500/90 flex items-center justify-center text-white text-lg">✓</div>
                    )}
                    {sending === f.id && (
                      <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 max-w-[56px] truncate">{f.full_name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Comments section ─────────────────────────────────────────────────────────

function CommentSection({ postId, initialComments, initialCount, currentUser }) {
  const [comments, setComments] = useState(initialComments || []);
  const [count, setCount] = useState(initialCount || 0);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef(null);

  // Load all comments when expanded
  useEffect(() => {
    if (!expanded) return;
    storyAPI.comments(postId).then(r => {
      setComments(r.data);
      setCount(r.data.length);
    }).catch(() => {});
  }, [expanded, postId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const r = await storyAPI.addComment(postId, text.trim());
      setComments(prev => [...prev, r.data]);
      setCount(c => c + 1);
      setText('');
    } catch {
      toast.error('Could not post comment.');
    } finally {
      setSending(false);
    }
  };

  const displayComments = expanded ? comments : comments.slice(-2);

  return (
    <div className="px-4 pb-3">
      {count > 2 && !expanded && (
        <button onClick={() => setExpanded(true)} className="text-xs text-gray-500 hover:text-gray-300 transition-colors mb-2">
          View all {count} comments
        </button>
      )}
      {expanded && count > comments.length && (
        <button onClick={() => setExpanded(false)} className="text-xs text-gray-500 hover:text-gray-300 transition-colors mb-2">
          Show less
        </button>
      )}

      <div className="space-y-1.5 mb-2">
        {displayComments.map(c => (
          <div key={c.id} className="flex gap-2 items-start">
            <Avatar name={c.author_name} size={22} />
            <div className="flex-1 min-w-0">
              <span className="text-white font-semibold text-xs">{c.author_name.split(' ')[0]} </span>
              <span className="text-gray-300 text-xs">{c.text}</span>
            </div>
            <span className="text-gray-700 text-[10px] flex-shrink-0 mt-0.5">{timeAgo(c.created_at)}</span>
          </div>
        ))}
      </div>

      {currentUser && (
        <form onSubmit={submit} className="flex gap-2 items-center">
          <Avatar name={currentUser.full_name} size={26} />
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Add a comment…"
            className="flex-1 bg-transparent text-xs text-gray-300 placeholder-gray-600 outline-none border-b border-dark-border focus:border-primary/50 pb-1 transition-colors"
            maxLength={500}
          />
          {text.trim() && (
            <button type="submit" disabled={sending}
              className="text-xs text-primary font-semibold hover:text-primary-light transition-colors disabled:opacity-50">
              Post
            </button>
          )}
        </form>
      )}
    </div>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post, currentUser }) {
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [heartAnim, setHeartAnim] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const lastTap = useRef(0);

  const isVenuePost = post.source === 'venue';

  const handleLike = async () => {
    if (!currentUser) { toast.info('Sign in to like posts.'); return; }
    const next = !liked;
    setLiked(next);
    setLikeCount(c => next ? c + 1 : Math.max(0, c - 1));
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 500);
    try {
      await storyAPI.like(post.id);
    } catch {
      setLiked(!next);
      setLikeCount(c => next ? c - 1 : c + 1);
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 350) {
      if (!liked) handleLike();
    }
    lastTap.current = now;
  };

  return (
    <article className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar name={post.author.full_name} size={38} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-semibold text-sm leading-tight">{post.author.full_name}</p>
            {isVenuePost && post.venue && (
              <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">Venue</span>
            )}
          </div>
          {post.venue ? (
            <Link to={`/venue/${post.venue.slug}`} className="text-xs text-primary hover:underline truncate block">
              📍 {post.venue.name} · {post.venue.city}
            </Link>
          ) : (
            <p className="text-xs text-gray-500">{post.author.city || 'WayyOut'}</p>
          )}
        </div>
        <span className="text-xs text-gray-600 flex-shrink-0">{timeAgo(post.created_at)}</span>
      </div>

      {/* Media */}
      {post.media && (
        <div className="relative bg-dark select-none cursor-pointer" onClick={handleDoubleTap}
          style={{ maxHeight: 520, overflow: 'hidden' }}>
          {post.media_type === 'video' ? (
            <video src={post.media} className="w-full object-cover" controls muted playsInline loop
              style={{ maxHeight: 520 }} />
          ) : (
            <img src={post.media} alt={post.caption || ''} className="w-full object-cover"
              style={{ maxHeight: 520 }} draggable={false} />
          )}
          {/* Vibe tags */}
          {post.vibe_tags?.length > 0 && (
            <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
              {post.vibe_tags.map(tag => (
                <span key={tag} className="text-xs bg-black/70 backdrop-blur-sm text-primary px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {/* Double-tap heart overlay */}
          {heartAnim && liked && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-7xl animate-bounce" style={{ filter: 'drop-shadow(0 0 20px rgba(255,50,50,0.6))' }}>❤️</span>
            </div>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-1">
        {/* Like */}
        <button onClick={handleLike}
          className={`flex items-center gap-1.5 p-1.5 rounded-xl transition-colors ${liked ? 'text-red-400' : 'text-gray-500 hover:text-gray-300'}`}>
          <span className={`text-2xl transition-transform ${heartAnim ? 'scale-125' : 'scale-100'}`}
            style={{ transition: 'transform 0.25s cubic-bezier(0.36,0.07,0.19,0.97)' }}>
            {liked ? '❤️' : '🤍'}
          </span>
        </button>
        {likeCount > 0 && <span className="text-sm font-medium text-gray-300 -ml-1">{likeCount}</span>}

        {/* Comment */}
        <button onClick={() => setShowComments(s => !s)}
          className="flex items-center gap-1.5 p-1.5 rounded-xl text-gray-500 hover:text-gray-300 transition-colors ml-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.862 9.862 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
        {post.comment_count > 0 && <span className="text-sm font-medium text-gray-300 -ml-1">{post.comment_count}</span>}

        {/* Share */}
        <button onClick={() => setShowShare(true)}
          className="p-1.5 rounded-xl text-gray-500 hover:text-gray-300 transition-colors ml-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>

        <div className="flex-1" />
        <span className="text-gray-700 text-xs">👁 {post.view_count || 0}</span>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pb-1">
          <p className="text-gray-200 text-sm leading-relaxed">
            <span className="font-semibold text-white mr-1.5">{post.author.full_name.split(' ')[0]}</span>
            {post.caption}
          </p>
        </div>
      )}

      {/* Comments */}
      {(showComments || post.preview_comments?.length > 0) && (
        <CommentSection
          postId={post.id}
          initialComments={post.preview_comments || []}
          initialCount={post.comment_count}
          currentUser={currentUser}
        />
      )}

      {/* Share sheet */}
      {showShare && (
        <ShareSheet
          postId={post.id}
          venueSlug={post.venue?.slug}
          onClose={() => setShowShare(false)}
          currentUser={currentUser}
        />
      )}
    </article>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden animate-pulse">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-dark-border" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-dark-border rounded w-1/3" />
          <div className="h-2.5 bg-dark-border rounded w-1/2" />
        </div>
      </div>
      <div className="h-72 bg-dark-border" />
      <div className="px-4 py-3 space-y-2">
        <div className="h-3 bg-dark-border rounded w-3/4" />
        <div className="h-3 bg-dark-border rounded w-1/2" />
      </div>
    </div>
  );
}

// ─── Main Feed ────────────────────────────────────────────────────────────────

export default function Feed() {
  const { isAuthenticated, user } = useSelector(s => s.auth);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const sentinelRef = useRef(null);

  const loadPage = useCallback(async (p, append = false) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const res = await storyAPI.socialFeed({ page: p });
      const { results, has_next } = res.data;
      setPosts(prev => append ? [...prev, ...results] : results);
      setHasNext(has_next);
    } catch {
      if (p === 1) toast.error('Could not load feed.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { loadPage(1); }, [loadPage]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNext && !loadingMore && !loading) {
        const next = page + 1;
        setPage(next);
        loadPage(next, true);
      }
    }, { threshold: 0.1 });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasNext, loadingMore, loading, page, loadPage]);

  const handlePosted = (story) => {
    const post = {
      id: story.id,
      type: 'post',
      source: story.source || 'user',
      created_at: story.created_at,
      author: story.author,
      venue: story.venue,
      media: story.media,
      media_type: story.media_type,
      caption: story.caption,
      vibe_tags: story.vibe_tags || [],
      view_count: 0,
      like_count: 0,
      liked: false,
      comment_count: 0,
      preview_comments: [],
    };
    setPosts(prev => [post, ...prev]);
    toast.success('Post shared!');
  };

  return (
    <div className="pt-16 min-h-screen" style={{ background: '#0a0a18' }}>
      <div className="max-w-[470px] mx-auto px-0 sm:px-4 py-4">

        {/* Stories bar */}
        <div className="bg-dark-card border-b border-t border-dark-border sm:rounded-2xl sm:border px-4 py-4 mb-5">
          <StoriesFeed />
        </div>

        {/* Post CTA */}
        {isAuthenticated && (
          <div className="bg-dark-card border border-dark-border rounded-2xl px-4 py-3 mb-5 flex items-center gap-3">
            <Avatar name={user?.full_name || '?'} size={34} />
            <button onClick={() => setPostModalOpen(true)}
              className="flex-1 text-left text-sm text-gray-600 hover:text-gray-400 transition-colors">
              Share a moment…
            </button>
            <button onClick={() => setPostModalOpen(true)} className="btn-primary text-xs py-1.5 px-4">
              Post
            </button>
          </div>
        )}

        {/* Feed */}
        <div className="space-y-5">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} />)
            : posts.length === 0
            ? (
              <div className="text-center py-16 bg-dark-card rounded-2xl border border-dark-border">
                <p className="text-5xl mb-4">🌃</p>
                <p className="text-white font-semibold text-lg mb-2">Nothing here yet</p>
                <p className="text-gray-500 text-sm mb-6">
                  Be the first to post — venues and customers share moments here
                </p>
                {isAuthenticated ? (
                  <button onClick={() => setPostModalOpen(true)} className="btn-primary">Post a moment</button>
                ) : (
                  <Link to="/register" className="btn-primary">Join WayyOut</Link>
                )}
              </div>
            )
            : posts.map(post => (
              <PostCard key={post.id} post={post} currentUser={user} />
            ))
          }

          <div ref={sentinelRef} className="h-4" />

          {loadingMore && (
            <div className="flex justify-center py-4 gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          )}

          {!hasNext && posts.length > 0 && (
            <p className="text-center text-gray-700 text-xs py-6">You're all caught up ✓</p>
          )}
        </div>
      </div>

      {postModalOpen && (
        <PostStoryModal onClose={() => setPostModalOpen(false)} onPosted={handlePosted} />
      )}
    </div>
  );
}
