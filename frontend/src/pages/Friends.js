import React, { useState, useEffect } from 'react';
import { socialAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

function UserAvatar({ name, size = 10 }) {
  const COLORS = ['#7C3AED', '#14B8A6', '#F59E0B', '#EC4899', '#3B82F6', '#10B981'];
  const color = COLORS[name.charCodeAt(0) % COLORS.length];
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ backgroundColor: color, width: size * 4, height: size * 4, fontSize: size * 1.4 }}
    >
      {name[0]}
    </div>
  );
}

export default function Friends() {
  const [data, setData] = useState({ friends: [], pending_received: [], pending_sent: [] });
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadFriends = () => {
    socialAPI.friends().then(r => {
      setData(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadFriends(); }, []);

  useEffect(() => {
    if (search.trim().length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await socialAPI.searchUsers(search.trim());
        setSearchResults(r.data.results || r.data);
      } catch {}
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const sendRequest = async (userId, name) => {
    try {
      await socialAPI.sendRequest(userId);
      toast.success(`Friend request sent to ${name}!`);
      setSearchResults(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not send request.');
    }
  };

  const acceptRequest = async (id, name) => {
    try {
      await socialAPI.acceptRequest(id);
      toast.success(`You and ${name} are now friends!`);
      loadFriends();
    } catch {
      toast.error('Could not accept request.');
    }
  };

  const rejectRequest = async (id) => {
    try {
      await socialAPI.rejectRequest(id);
      loadFriends();
    } catch {
      toast.error('Could not reject request.');
    }
  };

  const removeFriend = async (id) => {
    try {
      await socialAPI.rejectRequest(id);
      toast.success('Friend removed.');
      loadFriends();
    } catch {
      toast.error('Could not remove friend.');
    }
  };

  const inviteLink = `${window.location.origin}/register`;

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied!', { icon: '🎉' });
  };

  return (
    <div className="pt-20 min-h-screen max-w-2xl mx-auto px-4 py-6">
      <h1 className="font-display font-bold text-2xl text-white mb-6">Friends</h1>

      {/* Invite to platform */}
      <div className="card p-5 mb-6 border border-primary/20">
        <div className="flex items-start gap-3">
          <div className="text-3xl">🎉</div>
          <div className="flex-1">
            <h2 className="font-semibold text-white mb-1">Invite friends to WayyOut</h2>
            <p className="text-gray-500 text-sm mb-3">Share the link and explore nightlife together</p>
            <div className="flex gap-2">
              <input readOnly value={inviteLink} className="input flex-1 text-sm py-2 text-gray-400" />
              <button onClick={copyInvite} className="btn-primary text-sm px-4 py-2">Copy</button>
            </div>
          </div>
        </div>
      </div>

      {/* Search users */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-white mb-3">Find people</h2>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="input mb-3"
        />
        {searching && <p className="text-gray-500 text-sm">Searching...</p>}
        {searchResults.map(u => {
          const alreadyFriend = data.friends.some(f => f.id === u.id);
          const pendingSent = data.pending_sent.some(f => f.id === u.id);
          return (
            <div key={u.id} className="flex items-center gap-3 py-2 border-b border-dark-border last:border-0">
              <UserAvatar name={u.full_name} size={9} />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{u.full_name}</p>
                <p className="text-gray-500 text-xs">{u.city || 'WayyOut member'}</p>
              </div>
              {alreadyFriend ? (
                <span className="text-xs text-green-400 font-medium">✓ Friends</span>
              ) : pendingSent ? (
                <span className="text-xs text-gray-500">Request sent</span>
              ) : (
                <button
                  onClick={() => sendRequest(u.id, u.full_name)}
                  className="text-xs btn-primary py-1.5 px-3"
                >
                  Add friend
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Pending requests received */}
      {data.pending_received.length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-white mb-3">
            Friend requests <span className="text-primary text-sm">({data.pending_received.length})</span>
          </h2>
          {data.pending_received.map(f => (
            <div key={f.friendship_id} className="flex items-center gap-3 py-2 border-b border-dark-border last:border-0">
              <UserAvatar name={f.full_name} size={9} />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{f.full_name}</p>
                <p className="text-gray-500 text-xs">{f.city || 'WayyOut member'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => acceptRequest(f.friendship_id, f.full_name)} className="text-xs btn-primary py-1.5 px-3">Accept</button>
                <button onClick={() => rejectRequest(f.friendship_id)} className="text-xs btn-ghost py-1.5 px-3">Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friends list */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white">
            My friends {!loading && <span className="text-gray-500 font-normal text-sm">({data.friends.length})</span>}
          </h2>
          {data.friends.length > 0 && (
            <Link to="/messages" className="text-primary text-sm hover:underline">Messages →</Link>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : data.friends.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">🤝</p>
            <p className="text-gray-400 text-sm">No friends yet. Search for people above!</p>
          </div>
        ) : (
          data.friends.map(f => (
            <div key={f.friendship_id} className="flex items-center gap-3 py-2 border-b border-dark-border last:border-0">
              <UserAvatar name={f.full_name} size={9} />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{f.full_name}</p>
                <p className="text-gray-500 text-xs">{f.city || 'WayyOut member'}</p>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/messages"
                  className="text-xs btn-ghost py-1.5 px-3"
                >
                  Message
                </Link>
                <button
                  onClick={() => removeFriend(f.friendship_id)}
                  className="text-xs text-red-400 hover:text-red-300 py-1.5 px-2 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
