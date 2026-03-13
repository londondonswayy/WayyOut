import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { toggleAIChat } from '../store/slices/uiSlice';
import { aiAPI } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';

// Minimal markdown renderer for bold (**text**), bullet lines, and newlines
function Markdown({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        // Bold: **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
          }
          return part;
        });
        const isBullet = line.trimStart().startsWith('-') || line.trimStart().startsWith('•');
        const content = isBullet ? parts.slice(1) : parts;
        if (isBullet) {
          return (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-primary mt-0.5 flex-shrink-0">·</span>
              <span>{content}</span>
            </div>
          );
        }
        return <div key={i}>{parts}</div>;
      })}
    </div>
  );
}

const QUICK_QUESTIONS = [
  { label: '🍸 Best bar tonight', msg: 'What\'s the best bar open tonight?' },
  { label: '🎉 Party vibes', msg: 'Where can I find a lively party vibe tonight?' },
  { label: '🏙️ Rooftop spots', msg: 'Show me rooftop spots' },
  { label: '🍽️ Nice restaurant', msg: 'Recommend a nice restaurant' },
  { label: '📋 How do I reserve?', msg: 'How do I make a reservation?' },
  { label: '👥 How do friends work?', msg: 'How does the friends feature work?' },
];

const GREETING = `Hey! 👋 I'm your WayyOut guide. Ask me anything — find a spot for tonight, learn how features work, or plan your evening. What can I help with?`;

export default function AIChat() {
  const dispatch = useDispatch();
  const { aiChatOpen, userLocation } = useSelector((state) => state.ui);
  const { t } = useTranslation();
  const [history, setHistory] = useState([]); // [{role, content, suggestions, tips}]
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  useEffect(() => {
    if (aiChatOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [aiChatOpen]);

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const userMsg = { role: 'user', content };
    const nextHistory = [...history, userMsg];
    setHistory(nextHistory);
    setInput('');
    setLoading(true);

    try {
      const payload = {
        messages: nextHistory.map(m => ({ role: m.role, content: m.content })),
        lat: userLocation?.lat,
        lng: userLocation?.lng,
      };
      const res = await aiAPI.chat(payload);
      const { reply, suggestions, tips } = res.data;
      setHistory(prev => [
        ...prev,
        { role: 'assistant', content: reply, suggestions: suggestions || [], tips: tips || [] },
      ]);
    } catch {
      setHistory(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I ran into an issue. Please try again!', suggestions: [], tips: [] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  // Floating button when closed
  if (!aiChatOpen) {
    return (
      <button
        onClick={() => dispatch(toggleAIChat())}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary rounded-full shadow-2xl flex items-center justify-center text-2xl hover:bg-primary-dark transition-all hover:scale-110 z-40"
        title="AI Guide"
      >
        ✨
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-96 h-[600px] card flex flex-col z-40 shadow-2xl border border-primary/20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border bg-gradient-to-r from-primary/10 to-accent-purple/10 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-lg">✨</div>
          <div>
            <p className="font-semibold text-sm text-white">{t('ai.title')}</p>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
              {t('ai.online')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={() => setHistory([])}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors px-2 py-1"
              title="Clear chat"
            >
              Clear
            </button>
          )}
          <button onClick={() => dispatch(toggleAIChat())} className="text-gray-500 hover:text-white transition-colors text-xl leading-none">
            &times;
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Greeting */}
        <div className="flex justify-start">
          <div className="max-w-[88%] bg-dark-border rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-gray-200">
            <Markdown text={GREETING} />
          </div>
        </div>

        {/* Quick question chips — only when no history */}
        {history.length === 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q.msg}
                onClick={() => sendMessage(q.msg)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
              >
                {q.label}
              </button>
            ))}
          </div>
        )}

        {/* Conversation */}
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[88%] space-y-2">
              <div className={`rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-dark-border text-gray-200 rounded-bl-sm'
              }`}>
                {msg.role === 'user' ? msg.content : <Markdown text={msg.content} />}
              </div>

              {/* Tips */}
              {msg.tips?.length > 0 && (
                <div className="space-y-1 px-1">
                  {msg.tips.map((tip, j) => (
                    <p key={j} className="text-xs text-gray-500 flex items-start gap-1.5">
                      <span className="text-accent-teal flex-shrink-0 mt-0.5">→</span>
                      <span>{tip}</span>
                    </p>
                  ))}
                </div>
              )}

              {/* Venue suggestions */}
              {msg.suggestions?.length > 0 && (
                <div className="space-y-2">
                  {msg.suggestions.map((venue) => (
                    <VenueMini key={venue.id} venue={venue} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-dark-border rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-dark-border flex-shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('ai.placeholder')}
            className="input flex-1 text-sm py-2"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary py-2 px-4 text-sm disabled:opacity-50"
          >
            →
          </button>
        </div>
      </form>
    </div>
  );
}

function VenueMini({ venue }) {
  const priceStr = venue.price_level
    ? '$'.repeat(venue.price_level) + '$'.repeat(4 - venue.price_level).replace(/\$/g, '·')
    : null;

  return (
    <Link
      to={`/venue/${venue.slug}`}
      className="block bg-dark rounded-xl border border-dark-border hover:border-primary/40 transition-colors p-3"
    >
      <div className="flex items-center gap-3">
        {venue.cover_image ? (
          <img src={venue.cover_image} alt={venue.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
            {venue.category?.icon || '🏢'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white text-sm truncate">{venue.name}</p>
          <p className="text-xs text-gray-500 truncate">📍 {venue.city}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-yellow-400 text-xs">★ {Number(venue.rating).toFixed(1)}</span>
            {priceStr && (
              <span className="text-xs">
                <span className="text-green-400">{priceStr.split('·')[0]}</span>
                <span className="text-gray-700">{'·'.repeat(4 - venue.price_level)}</span>
              </span>
            )}
            {venue.is_open ? (
              <span className="text-xs text-teal-400">● Open</span>
            ) : (
              <span className="text-xs text-gray-600">Closed</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
