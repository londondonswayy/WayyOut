import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import StoriesFeed from '../components/StoriesFeed';
import PostStoryModal from '../components/PostStoryModal';
import { useTranslation } from '../i18n/LanguageContext';

export default function StoriesPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [stories, setStories] = useState([]);

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-3xl text-white">{t('home.stories.title')}</h1>
            <p className="text-gray-500 text-sm mt-1">{t('home.stories.desc')}</p>
          </div>
          {isAuthenticated && (
            <button
              onClick={() => setPostModalOpen(true)}
              className="btn-primary px-5 py-2.5 text-sm"
            >
              + {t('stories.post')}
            </button>
          )}
        </div>

        <StoriesFeed city="" expanded />
      </div>

      {postModalOpen && (
        <PostStoryModal
          onClose={() => setPostModalOpen(false)}
          onPosted={(s) => setStories((prev) => [s, ...prev])}
        />
      )}
    </div>
  );
}
