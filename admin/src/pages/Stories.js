import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import { toast } from 'react-toastify';

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.stories();
      setStories(res.data.results || res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchStories(); }, []);

  const handleModerate = async (id, action) => {
    try {
      await adminAPI.moderateStory(id, action);
      toast.success(action === 'remove' ? 'Story removed.' : 'Story approved.');
      fetchStories();
    } catch { toast.error('Failed to moderate.'); }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl h-64 animate-pulse" />
          ))
        ) : stories.map((story) => (
          <div key={story.id} className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Media preview */}
            <div className="relative h-40 bg-black">
              {story.media_type === 'video' ? (
                <video src={story.media} className="w-full h-full object-cover" muted />
              ) : (
                <img src={story.media} alt="" className="w-full h-full object-cover" />
              )}
              {!story.is_active && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-red-400 font-semibold text-sm">Removed</span>
                </div>
              )}
            </div>

            <div className="p-3">
              <p className="text-white text-xs font-medium">{story.author?.full_name}</p>
              <p className="text-gray-500 text-xs">{story.venue?.name || 'User story'}</p>
              {story.caption && <p className="text-gray-400 text-xs mt-1 line-clamp-2">{story.caption}</p>}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-600">👁 {story.view_count}</span>
                {story.is_active && (
                  <div className="flex space-x-2">
                    <button onClick={() => handleModerate(story.id, 'approve')}
                      className="text-xs text-green-400 hover:text-green-300">Approve</button>
                    <button onClick={() => handleModerate(story.id, 'remove')}
                      className="text-xs text-red-400 hover:text-red-300">Remove</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
