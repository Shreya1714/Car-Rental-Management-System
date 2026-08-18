import { useState, useRef, useEffect } from 'react';
import { Api } from '../api';

export default function ChatWidget() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! Ask me things like "cheapest car available" or "SUV for a family of 6 going outstation".' }
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const res = await Api.aiChat(msg);
      setMessages(m => [...m, { role: 'bot', text: res.reply }]);
    } catch {
      setMessages(m => [...m, { role: 'bot', text: 'Sorry, something went wrong.', error: true }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <div className="chat-header-left">
              <span className="chat-avatar"><i className="bi bi-robot"></i></span>
              <div>
                <div className="chat-title">AI Assistant</div>
                <div className="chat-subtitle">Powered by DriveEasy</div>
              </div>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="chat-body" ref={bodyRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-row ${m.role}`}>
                {m.role === 'bot' && <span className="chat-bubble-avatar"><i className="bi bi-robot"></i></span>}
                <div className={`chat-msg ${m.role}${m.error ? ' error' : ''}`}>{m.text}</div>
              </div>
            ))}
            {loading && (
              <div className="chat-row bot">
                <span className="chat-bubble-avatar"><i className="bi bi-robot"></i></span>
                <div className="chat-msg bot typing">Typing…</div>
              </div>
            )}
          </div>

          <div className="chat-input">
            <input
              className="chat-input-field"
              placeholder="Type a message…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            />
            <button className="chat-send-btn" onClick={send}>
              <i className="bi bi-send-fill"></i>
            </button>
          </div>
        </div>
      )}
      <button className="chat-fab" onClick={() => setOpen(o => !o)}>
        <i className={`bi ${open ? 'bi-x-lg' : 'bi-chat-dots-fill'}`}></i>
      </button>
    </div>
  );
}
