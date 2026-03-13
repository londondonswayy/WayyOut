import React, { useState, useEffect, useRef } from 'react';
import { socialAPI } from '../services/api';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

export default function Messages() {
  const { user } = useSelector((state) => state.auth);
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    socialAPI.conversations().then(r => {
      setConversations(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeUser) return;
    socialAPI.messages(activeUser.user_id).then(r => setMessages(r.data)).catch(() => {});
  }, [activeUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages every 5s when in a thread
  useEffect(() => {
    if (!activeUser) return;
    const interval = setInterval(() => {
      socialAPI.messages(activeUser.user_id).then(r => setMessages(r.data)).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [activeUser]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const r = await socialAPI.sendMessage(activeUser.user_id, text.trim());
      setMessages(prev => [...prev, r.data]);
      setText('');
      // Update last message in conversations list
      setConversations(prev => prev.map(c =>
        c.user_id === activeUser.user_id ? { ...c, last_message: text.trim(), unread: 0 } : c
      ));
    } catch {
      toast.error('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pt-16 min-h-screen max-w-5xl mx-auto px-4 py-6">
      <h1 className="font-display font-bold text-2xl text-white mb-6">Messages</h1>

      <div className="flex gap-4 h-[70vh]">
        {/* Conversations sidebar */}
        <div className="w-72 flex-shrink-0 card overflow-y-auto">
          {loading ? (
            <div className="p-4 text-gray-500 text-sm">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-4xl mb-2">💬</p>
              <p className="text-gray-500 text-sm">No messages yet. Add friends to start chatting.</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.user_id}
                onClick={() => setActiveUser(conv)}
                className={`w-full text-left px-4 py-3 border-b border-dark-border hover:bg-dark-border/50 transition-colors ${activeUser?.user_id === conv.user_id ? 'bg-primary/10' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {conv.full_name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white truncate">{conv.full_name}</p>
                      {conv.unread > 0 && (
                        <span className="w-5 h-5 bg-primary rounded-full text-xs text-white flex items-center justify-center font-bold flex-shrink-0">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{conv.last_message}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 card flex flex-col overflow-hidden">
          {!activeUser ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl mb-3">💬</p>
                <p className="text-gray-400">Select a conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-dark-border flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                  {activeUser.full_name[0]}
                </div>
                <p className="font-semibold text-white">{activeUser.full_name}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => {
                  const isMe = msg.sender === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                        isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-dark-border text-gray-200 rounded-bl-sm'
                      }`}>
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-light/70' : 'text-gray-500'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-3 border-t border-dark-border flex gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Type a message..."
                  className="input flex-1 py-2"
                />
                <button type="submit" disabled={sending || !text.trim()} className="btn-primary px-4 py-2 disabled:opacity-50">
                  {sending ? '...' : '→'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
