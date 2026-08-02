import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Globe2, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';
import { renderFormattedText } from '../components/FormattedText';

export default function Assistant() {
  const [selectedLang, setSelectedLang] = useState('en'); // 'en' | 'te'
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
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const quickPromptsEn = [
    'What is my estimated profit this month?',
    'Which products should I reorder?',
    'What inventory is moving slowly?',
    'Why are profits decreasing?',
    'What should I invest in next month?'
  ];

  const quickPromptsTe = [
    'నా అంచనా లాభం ఎంత?',
    'నేను ఏ ఉత్పత్తులను రీఆర్డర్ చేయాలి?',
    'ఏ సరుకులు నెమ్మదిగా అమ్ముడవుతున్నాయి?',
    'లాభాలు ఎందుకు తగ్గుతున్నాయి?',
    'వచ్చే నెల దేనిలో పెట్టుబడి పెట్టాలి?'
  ];

  const currentPrompts = selectedLang === 'te' ? quickPromptsTe : quickPromptsEn;

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clean up speech synthesis & recognition on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      stopVoiceInput();
    };
  }, []);

  // Stop active speech recognition safely
  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // Continuous Speech Recognition (Voice Input - Does not cut off on 2 sec pause)
  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice speech recognition is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      stopVoiceInput();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = selectedLang === 'te' ? 'te-IN' : 'en-IN';
      recognition.continuous = true; // Listen continuously without cutting off mid-sentence
      recognition.interimResults = true; // Live interim text update into input box
      recognition.maxAlternatives = 1;

      recognitionRef.current = recognition;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e) => {
        console.error("Speech Recognition Error:", e);
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalTranscript += res[0].transcript + ' ';
          } else {
            interimTranscript += res[0].transcript;
          }
        }

        const combined = (finalTranscript + interimTranscript).trim();
        if (combined) {
          setInputMsg(combined);
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Speech Recognition setup error:", err);
      setIsListening(false);
    }
  };

  // Build complete text string for Text-to-Speech (Analysis + Reasons + Recommendations)
  const getCompleteSpeechText = (msg) => {
    const parts = [];
    if (msg.analysis || msg.message) {
      parts.push(msg.analysis || msg.message);
    }
    if (msg.reasons && msg.reasons.length > 0) {
      const reasonsHeader = selectedLang === 'te' ? 'కారణాలు. ' : 'Key factors. ';
      parts.push(reasonsHeader + msg.reasons.join('. '));
    }
    if (msg.recommendations && msg.recommendations.length > 0) {
      const recsHeader = selectedLang === 'te' ? 'సిఫార్సులు. ' : 'Recommendations. ';
      parts.push(recsHeader + msg.recommendations.join('. '));
    }
    return parts.join('. ').replace(/\*\*/g, '').replace(/\*/g, '');
  };

  // Text to Speech (Read Aloud Complete Response without Cutoff)
  const handleReadAloud = (msgId, msgObj) => {
    if (!window.speechSynthesis) return;

    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const fullText = getCompleteSpeechText(msgObj);
    // Split full text into sentence chunks so speech synthesis never truncates long text
    const sentences = fullText.match(/[^.!?]+[.!?]+/g) || [fullText];
    let sentenceIndex = 0;

    const speakNext = () => {
      if (sentenceIndex >= sentences.length) {
        setSpeakingId(null);
        return;
      }

      const chunk = sentences[sentenceIndex].trim();
      if (!chunk) {
        sentenceIndex++;
        speakNext();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = selectedLang === 'te' ? 'te-IN' : 'en-IN';
      utterance.rate = 0.95;

      utterance.onend = () => {
        sentenceIndex++;
        speakNext();
      };

      utterance.onerror = () => {
        setSpeakingId(null);
      };

      window.speechSynthesis.speak(utterance);
    };

    setSpeakingId(msgId);
    speakNext();
  };

  // Handle Send User Message (Clears input field unconditionally)
  const handleSend = async (queryText) => {
    const text = (queryText !== undefined ? queryText : inputMsg).trim();
    if (!text || sending) return;

    // Stop voice mic if recording
    stopVoiceInput();

    // ALWAYS clear text input box immediately
    setInputMsg('');

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      analysis: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    try {
      const reply = await api.sendChatMessage(text, selectedLang);
      setMessages(prev => [...prev, reply]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          analysis: selectedLang === 'te' 
            ? 'క్షమించండి, మీ అభ్యర్థనను విశ్లేషించడంలో సాంకేతిక లోపం ఏర్పడింది. దయచేసి మళ్లీ ప్రయత్నించండి.'
            : 'I experienced a connection issue while analyzing your query. Please try again.',
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
      {/* Header & Language Switcher */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="section-title">AI Business Assistant</h1>
          <p className="section-subtitle">
            Interact with your business ledger, inventory, and market forecast using natural language Voice & Text Q&A
          </p>
        </div>

        {/* Global Language Selector Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(18, 26, 43, 0.8)', padding: '0.3rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)' }}>
          <Globe2 size={16} style={{ marginLeft: '0.4rem', color: 'var(--primary)' }} />
          <button 
            className={`filter-chip ${selectedLang === 'en' ? 'active' : ''}`}
            onClick={() => setSelectedLang('en')}
            style={{ borderRadius: 'var(--radius-full)', padding: '0.25rem 0.75rem' }}
          >
            English
          </button>
          <button 
            className={`filter-chip ${selectedLang === 'te' ? 'active' : ''}`}
            onClick={() => setSelectedLang('te')}
            style={{ borderRadius: 'var(--radius-full)', padding: '0.25rem 0.75rem' }}
          >
            తెలుగు (Telugu)
          </button>
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {selectedLang === 'te' ? 'సూచించిన ప్రశ్నలు:' : 'Suggested Questions:'}
        </span>
        {currentPrompts.map((prompt, i) => (
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

      {/* Chat Messages Container */}
      <div className="glass-card chat-container">
        <div className="chat-history">
          {messages.map((msg, idx) => {
            const currentMsgId = msg.id || idx;
            const isSpeakingThis = speakingId === currentMsgId;

            return (
              <div 
                key={currentMsgId} 
                className={`chat-bubble ${msg.sender}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem' }}>
                    {msg.sender === 'user' ? (
                      <><User size={16} /> You</>
                    ) : (
                      <><Sparkles size={16} color="var(--primary)" /> Vyapaar Mithra AI Assistant</>
                    )}
                  </div>

                  {/* Read Aloud TTS button for assistant responses */}
                  {msg.sender === 'assistant' && (
                    <button 
                      onClick={() => handleReadAloud(currentMsgId, msg)}
                      style={{ 
                        background: isSpeakingThis ? 'rgba(6, 182, 212, 0.15)' : 'none', 
                        border: isSpeakingThis ? '1px solid var(--primary)' : 'none', 
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        color: isSpeakingThis ? 'var(--primary)' : 'var(--text-muted)', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.35rem', 
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                      title={isSpeakingThis ? "Stop Listening" : "Listen to complete response"}
                    >
                      {isSpeakingThis ? <VolumeX size={15} className="animate-pulse" /> : <Volume2 size={15} />}
                      <span>{isSpeakingThis ? (selectedLang === 'te' ? 'ఆపు...' : 'Stop') : (selectedLang === 'te' ? 'వినండి' : 'Listen')}</span>
                    </button>
                  )}
                </div>

                {/* Main Analysis */}
                <div style={{ fontSize: '0.95rem', fontWeight: msg.sender === 'user' ? 400 : 500, marginBottom: msg.reasons?.length ? '0.75rem' : '0', lineHeight: '1.5' }}>
                  {renderFormattedText(msg.analysis || msg.message)}
                </div>

                {/* Structured Reasons */}
                {msg.reasons && msg.reasons.length > 0 && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(11, 15, 25, 0.5)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <strong style={{ fontSize: '0.825rem', color: 'var(--warning)', display: 'block', marginBottom: '0.4rem' }}>
                      {selectedLang === 'te' ? '🔍 కారణాలు / ముఖ్యాంశాలు:' : '🔍 Key Underlying Factors:'}
                    </strong>
                    <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      {msg.reasons.map((r, i) => (
                        <li key={i} style={{ marginBottom: '0.3rem', lineHeight: '1.5' }}>{renderFormattedText(r)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Structured Recommendations */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div style={{ marginTop: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <strong style={{ fontSize: '0.825rem', color: 'var(--accent)', display: 'block', marginBottom: '0.4rem' }}>
                      {selectedLang === 'te' ? '💡 సిఫార్సులు & సలహాలు:' : '💡 Actionable Recommendations:'}
                    </strong>
                    <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                      {msg.recommendations.map((rec, i) => (
                        <li key={i} style={{ marginBottom: '0.3rem', lineHeight: '1.5' }}>{renderFormattedText(rec)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}

          {sending && (
            <div className="chat-bubble assistant">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <Sparkles className="animate-spin" size={16} color="var(--primary)" />
                {selectedLang === 'te' ? 'వ్యాపార మిత్ర AI విశ్లేషిస్తోంది...' : 'Vyapaar Mithra AI is analyzing your query...'}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Listening Indicator Toast Banner */}
        {isListening && (
          <div style={{ padding: '0.5rem 1.25rem', background: 'rgba(239, 68, 68, 0.15)', borderTop: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>
            <span className="pulse-dot" style={{ backgroundColor: '#EF4444' }}></span>
            {selectedLang === 'te' ? 'వాయిస్ రికార్డింగ్ జరుగుతోంది... మాట్లాడండి' : 'Listening continuously... Speak your query and click Send or Mic to finish'}
          </div>
        )}

        {/* Input Controls Bar with Voice Mic + Text Input */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            type="button"
            onClick={toggleVoiceInput}
            className={`btn ${isListening ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              padding: '0.75rem', 
              borderRadius: 'var(--radius-sm)',
              background: isListening ? '#EF4444' : undefined,
              borderColor: isListening ? '#EF4444' : undefined
            }}
            title={isListening ? "Stop Voice Input" : `Speak continuously in ${selectedLang === 'te' ? 'Telugu' : 'English'}`}
          >
            {isListening ? <MicOff size={20} className="animate-pulse" /> : <Mic size={20} className="text-cyan" />}
          </button>

          <input 
            type="text" 
            className="form-input" 
            placeholder={
              selectedLang === 'te' 
                ? "వ్యాపార ప్రశ్న అడగండి (ఉదా. 'నేను ఏ ఉత్పత్తులను రీఆర్డర్ చేయాలి?')..." 
                : "Ask business questions (e.g. 'What inventory is moving slowly?')..."
            }
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
