import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';
import { Bot, Send, User, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { renderFormattedText } from '../components/FormattedText';

export default function Assistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      analysis: 'Hello! I am Vyapaar Mithra AI, your virtual business intelligence consultant.',
      reasons: ['I have analyzed your investment bills, shelf inventory, and locality demographics.'],
      recommendations: ['Ask me questions like "What should I reorder?", "Why did profit change?", or "What to invest in next month?"'],
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  const quickPrompts = [
    'What is my estimated profit this month?',
    'Which products should I reorder?',
    'What inventory is moving slowly?',
    'Why are profits decreasing?',
    'What should I invest in next month?'
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (queryText) => {
    const text = queryText || inputMsg;
    if (!text.trim() || sending) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      analysis: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputMsg('');
    setSending(true);

    try {
      const reply = await api.sendChatMessage(text);
      setMessages(prev => [...prev, reply]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          analysis: 'I experienced a connection issue while analyzing your query. Please try again.',
          reasons: [],
          recommendations: ['Check if backend API server is running at http://localhost:8000.'],
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">AI Business Assistant</h1>
        <p className="section-subtitle">Interact with your business ledger, inventory, and market forecast using natural language Q&A</p>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Suggested Questions:</span>
        {quickPrompts.map((prompt, i) => (
          <button 
            key={i} 
            onClick={() => handleSend(prompt)} 
            className="chip-btn"
            disabled={sending}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Area */}
      <div className="glass-card chat-container">
        <div className="chat-history">
          {messages.map((msg, idx) => (
            <div 
              key={msg.id || idx} 
              className={`chat-bubble ${msg.sender}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.85rem' }}>
                {msg.sender === 'user' ? (
                  <><User size={16} /> You</>
                ) : (
                  <><Sparkles size={16} color="var(--primary)" /> Vyapaar Mithra AI Assistant</>
                )}
              </div>

              {/* Main Analysis */}
              <div style={{ fontSize: '0.95rem', fontWeight: msg.sender === 'user' ? 400 : 500, marginBottom: msg.reasons?.length ? '0.75rem' : '0', lineHeight: '1.5' }}>
                {renderFormattedText(msg.analysis || msg.message)}
              </div>

              {/* Structured Reasons (if assistant) */}
              {msg.reasons && msg.reasons.length > 0 && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(11, 15, 25, 0.5)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <strong style={{ fontSize: '0.825rem', color: 'var(--warning)', display: 'block', marginBottom: '0.4rem' }}>🔍 Key Underlying Factors:</strong>
                  <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {msg.reasons.map((r, i) => (
                      <li key={i} style={{ marginBottom: '0.3rem', lineHeight: '1.5' }}>{renderFormattedText(r)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Structured Recommendations (if assistant) */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div style={{ marginTop: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <strong style={{ fontSize: '0.825rem', color: 'var(--accent)', display: 'block', marginBottom: '0.4rem' }}>💡 Actionable Recommendations:</strong>
                  <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                    {msg.recommendations.map((rec, i) => (
                      <li key={i} style={{ marginBottom: '0.3rem', lineHeight: '1.5' }}>{renderFormattedText(rec)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          {sending && (
            <div className="chat-bubble assistant">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <Sparkles className="animate-spin" size={16} color="var(--primary)" />
                Vyapaar Mithra AI is analyzing your query...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.75rem' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Ask business questions (e.g. 'What inventory is moving slowly?')..."
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={sending}
          />
          <button 
            onClick={() => handleSend()} 
            className="btn btn-primary"
            disabled={sending || !inputMsg.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
