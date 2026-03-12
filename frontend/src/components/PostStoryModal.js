import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { storyAPI, venueAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from '../i18n/LanguageContext';

const VIBES = ['casual', 'lively', 'romantic', 'upscale', 'party'];

export default function PostStoryModal({ onClose, onPosted }) {
  const { user } = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const fileInputRef = useRef(null);   // gallery / device files
  const cameraInputRef = useRef(null); // camera capture
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mediaType, setMediaType] = useState('photo');
  const [caption, setCaption] = useState('');
  const [vibeTags, setVibeTags] = useState([]);
  const [venueId, setVenueId] = useState('');
  const [myVenues, setMyVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const isOwner = user?.role === 'venue_owner';

  useEffect(() => {
    if (isOwner) {
      venueAPI.myVenues().then((res) => setMyVenues(res.data.results || res.data)).catch(() => {});
    }
  }, [isOwner]);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setMediaType(f.type.startsWith('video') ? 'video' : 'photo');
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const toggleVibe = (v) =>
    setVibeTags((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('media', file);
      form.append('media_type', mediaType);
      form.append('caption', caption);
      form.append('vibe_tags', JSON.stringify(vibeTags));
      form.append('source', isOwner ? 'venue' : 'user');
      if (isOwner && venueId) form.append('venue_id', venueId);
      const res = await storyAPI.create(form);
      toast.success(t('stories.posted'));
      onPosted(res.data);
      onClose();
    } catch {
      toast.error(t('stories.postFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary/20 rounded-lg flex items-center justify-center text-sm">📷</div>
            <h3 className="font-semibold text-white">{t('stories.post')}</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl leading-none">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Upload / preview */}
          {!preview ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="space-y-3"
            >
              {/* Camera capture button */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full h-24 border border-dark-border rounded-xl flex items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">📷</span>
                <div className="text-left">
                  <p className="text-white text-sm font-medium">{t('stories.takePhoto')}</p>
                  <p className="text-gray-600 text-xs">{t('stories.takePhotoDesc')}</p>
                </div>
              </button>

              {/* Gallery / file picker button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 border border-dashed border-dark-border rounded-xl flex items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">🖼️</span>
                <div className="text-left">
                  <p className="text-white text-sm font-medium">{t('stories.uploadFromDevice')}</p>
                  <p className="text-gray-600 text-xs">{t('stories.fileTypes')}</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="relative w-full h-64 rounded-xl overflow-hidden bg-dark-border">
              {mediaType === 'video' ? (
                <video src={preview} className="w-full h-full object-cover" muted />
              ) : (
                <img src={preview} alt="" className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => { setFile(null); setPreview(null); }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full text-white/80 hover:text-white flex items-center justify-center text-sm"
              >
                &times;
              </button>
              {/* Retake / change */}
              <div className="absolute bottom-2 left-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="text-xs bg-black/60 text-white/80 hover:text-white px-3 py-1 rounded-full"
                >
                  📷 {t('stories.retake')}
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs bg-black/60 text-white/80 hover:text-white px-3 py-1 rounded-full"
                >
                  🖼️ {t('stories.change')}
                </button>
              </div>
            </div>
          )}

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={(e) => handleFile(e.target.files[0])}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*,video/*"
            capture="environment"
            onChange={(e) => handleFile(e.target.files[0])}
            className="hidden"
          />

          {/* Caption */}
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={t('stories.captionPlaceholder')}
            maxLength={500}
            rows={2}
            className="input w-full resize-none text-sm"
          />

          {/* Vibe tags */}
          <div>
            <p className="text-xs text-gray-500 mb-2">{t('stories.vibeTags')}</p>
            <div className="flex flex-wrap gap-2">
              {VIBES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggleVibe(v)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                    vibeTags.includes(v)
                      ? 'bg-primary text-white'
                      : 'bg-dark-border text-gray-400 hover:text-white'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Venue selector — owners only */}
          {isOwner && myVenues.length > 0 && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('stories.tagVenue')}</label>
              <select
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                className="input w-full text-sm"
              >
                <option value="">{t('stories.selectVenue')}</option>
                {myVenues.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-600">⏱ {t('stories.expires24h')}</p>
            <button type="submit" disabled={!file || loading} className="btn-primary py-2 px-6 text-sm">
              {loading ? t('stories.posting') : t('stories.share')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
