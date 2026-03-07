import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleAIChat } from '../store/slices/uiSlice';
import { aiAPI } from '../services/api';
import VenueCard from './VenueCard';

export default function AIChat() {
  const dispatch = useDispatch();
  const { aiChatOpen, userLocation } = useSelector((state) => state.ui);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hey! I'm your Way Out guide. Tell me what you're looking for tonight — vibe, food, party, whatever — and I'll find the perfect spot for you.",
      suggestions: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    const query = input;
    setInput('');
    setLoading(true);

    try {
      const res = await aiAPI.discover({
        query,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
      });
      const { message, suggestions, tips } = res.data;
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: message, suggestions, tips },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: "Sorry, I couldn't find anything right now. Try again in a moment!", suggestions: [] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!aiChatOpen) {
    return (
      <button
        onClick={() => dispatch(toggleAIChat())}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary rounded-full shadow-2xl flex items-center justify-center text-2xl hover:bg-primary-dark transition-all hover:scale-110 z-40"
      >
        ✨
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-96 h-[600px] card flex flex-col z-40 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-border bg-gradient-to-r from-primary/10 to-accent-purple/10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-lg">✨</div>
          <div>
            <p className="font-semibold text-sm text-white">AI Guide</p>
            <p className="text-xs text-green-400">● Online now</p>
          </div>
        </div>
        <button onClick={() => dispatch(toggleAIChat())} className="text-gray-500 hover:text-white transition-colors text-xl">
          &times;
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] space-y-2`}>
              <div className={`rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-dark-border text-gray-200 rounded-bl-sm'
              }`}>
                {msg.text}
              </div>

              {msg.tips?.length > 0 && (
                <div className="space-y-1">
                  {msg.tips.map((tip, j) => (
                    <p key={j} className="text-xs text-gray-500 flex items-start space-x-1">
                      <span className="text-accent-teal">→</span>
                      <span>{tip}</span>
                    </p>
                  ))}
                </div>
              )}

              {msg.suggestions?.map((venue) => (
                <VenueCard key={venue.id} venue={venue} compact />
              ))}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-dark-border rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-dark-border">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What are you looking for tonight?"
            className="input flex-1 text-sm py-2"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} className="btn-primary py-2 px-4 text-sm">
            →
          </button>
        </div>
      </form>
    </div>
  );
}
