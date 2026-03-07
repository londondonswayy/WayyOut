import React, { useEffect, useState, useRef } from 'react';
import { storyAPI } from '../services/api';

function StoryCircle({ story, onClick }) {
  const isVenue = story.source === 'venue';
  return (
    <button
      onClick={() => onClick(story)}
      className="flex flex-col items-center space-y-1 flex-shrink-0"
    >
      <div className="story-ring p-0.5 rounded-full">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-dark-card border-2 border-dark">
          {story.venue?.cover_image || story.author?.avatar ? (
            <img
              src={story.venue?.cover_image || story.author?.avatar}
              alt={story.venue?.name || story.author?.full_name}
              className="w-full h-full object-cover"
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

function StoryViewer({ story, onClose, onNext, onPrev }) {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    setProgress(0);
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timerRef.current);
          onNext();
          return 100;
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [story]);

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="relative w-full max-w-sm h-screen max-h-[720px] bg-dark-card overflow-hidden">
        {/* Progress bar */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="h-0.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 z-10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-dark-border overflow-hidden">
              <img
                src={story.venue?.cover_image || story.author?.avatar}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div>
              <p className="text-white text-xs font-semibold">{story.venue?.name || story.author?.full_name}</p>
              <p className="text-gray-400 text-xs">{new Date(story.created_at).toLocaleTimeString()}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white text-2xl leading-none">&times;</button>
        </div>

        {/* Media */}
        {story.media_type === 'video' ? (
          <video src={story.media} className="w-full h-full object-cover" autoPlay muted loop />
        ) : (
          <img src={story.media} alt={story.caption} className="w-full h-full object-cover" />
        )}

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80">
            <p className="text-white text-sm">{story.caption}</p>
            {story.vibe_tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {story.vibe_tags.map((tag) => (
                  <span key={tag} className="badge bg-primary/30 text-primary-light text-xs">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nav areas */}
        <button onClick={onPrev} className="absolute left-0 top-0 bottom-0 w-1/3 z-20" />
        <button onClick={onNext} className="absolute right-0 top-0 bottom-0 w-1/3 z-20" />
      </div>
    </div>
  );
}

export default function StoriesFeed({ city }) {
  const [stories, setStories] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const params = city ? { city } : {};
        const res = await storyAPI.feed(params);
        setStories(res.data.results || res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, [city]);

  const handleStoryClick = (story) => {
    const index = stories.findIndex((s) => s.id === story.id);
    setActiveIndex(index);
    storyAPI.view(story.id).catch(() => {});
  };

  const handleNext = () => {
    if (activeIndex < stories.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      setActiveIndex(null);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
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

  if (!stories.length) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        No live stories right now. Be the first to share the vibe!
      </div>
    );
  }

  return (
    <>
      <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
        {stories.map((story) => (
          <StoryCircle key={story.id} story={story} onClick={handleStoryClick} />
        ))}
      </div>

      {activeIndex !== null && (
        <StoryViewer
          story={stories[activeIndex]}
          onClose={() => setActiveIndex(null)}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      )}
    </>
  );
}
