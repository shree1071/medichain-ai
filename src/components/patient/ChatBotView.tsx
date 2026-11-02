import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, RefreshCw, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { askGroqClinicalChat } from '../../lib/keys';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

export default function ChatBotView() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'c1',
      sender: 'bot',
      text: 'Namaste! I am Dr. Vaidya Ananya Sharma & Ayush AI Clinical Assistant at OPD Bay 04. I can explain your prescriptions, wound care regimen, dietary precautions, and test results. How can I help you today?',
      timestamp: 'Just now'
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const quickPrompts = [
    'Explain my Wagner Grade 2 ulcer',
    'How do I apply Jatyadi Taila correctly?',
    'Can I take Metformin with Vijaysar?',
    'What foods should I avoid for high Vata?'
  ];

  // Speech Recognition setup (Voice-to-text input)
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = 'hi-IN'; // Default to Indian Hindi/English
      rec.continuous = false;
      rec.interimResults = true;

      rec.onstart = () => setIsListening(true);
      rec.onresult = (e: any) => {
        const transcript = Array.from(e.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setInput(transcript);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
      rec.start();
    } catch (_) {
      setIsListening(false);
    }
  };

  // Text-to-Speech playback for assistant answers
  const speakMessage = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#_`[\]]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.lang = /[\u0900-\u097F]/.test(cleanText) ? 'hi-IN' : 'en-IN';

      utterance.onstart = () => setSpeakingMsgId(msgId);
      utterance.onend = () => setSpeakingMsgId(null);
      utterance.onerror = () => setSpeakingMsgId(null);

      window.speechSynthesis.speak(utterance);
    } catch (_) {
      setSpeakingMsgId(null);
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
    };
  }, []);

  const handleSend = async (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: userText.trim(),
      timestamp: 'Just now'
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsTyping(true);

    try {
      const reply = await askGroqClinicalChat({
        messages: nextMessages.map((message) => ({
          role: message.sender === 'user' ? 'user' : 'assistant',
          content: message.text,
        })),
        patientName: 'Govind Kumar',
      });

      const botMsgId = `b-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          sender: 'bot',
          text: reply,
          timestamp: 'Just now',
        },
      ]);
    } catch (error) {
      console.warn('Groq assistant request note:', error);
      // Helpful medical fallback tailored to common patient queries
      const fallbackReplies: Record<string, string> = {
        ulcer: 'A Wagner Grade 2 ulcer involves a deep ulcer penetrating to tendon, bone, or joint capsule without gross infection. At OPD Bay 04, our protocol combines daily sterile Triphala wash with Jatyadi Ghrita dressing and non-weight-bearing footwear.',
        jatyadi: 'Apply Jatyadi Ghrita after irrigating the wound with lukewarm Triphala Kashaya. Gently pat dry with sterile gauze and apply a thin layer of Jatyadi Ghrita before covering with a non-adherent sterile dressing.',
        metformin: 'Metformin can generally be taken alongside Vijaysar, but blood glucose must be monitored closely to prevent hypoglycemia. Always take Metformin with meals as prescribed.',
        vata: 'For elevated Vata dosha, avoid dry, cold, raw, and bitter foods like cabbage, raw salads, and iced drinks. Favor warm, nourishing cooked meals with healthy fats (ghee, sesame oil) and grounding spices.'
      };

      const queryLower = userText.toLowerCase();
      let matchedReply = 'Namaste. OPD Bay 04 is monitoring your recovery. Please continue your prescribed Triphala wash and Jatyadi Ghrita dressing. If you notice fever or increased wound redness, alert our care team immediately.';
      for (const [key, val] of Object.entries(fallbackReplies)) {
        if (queryLower.includes(key)) {
          matchedReply = val;
          break;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: matchedReply,
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#4d4439]/10 shadow-sm overflow-hidden flex flex-col h-[650px] animate-fade-in text-[#080331]">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-[#faf7f2] border-b border-[#4d4439]/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#080331] text-white flex items-center justify-center shadow-xs">
            <Bot size={20} className="text-[#4865ff]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-[#080331]">Ayush AI Clinical Voice &amp; Chat Assistant</h3>
              <span className="text-[10px] font-semibold bg-[#4865ff]/10 text-[#4865ff] px-2 py-0.5 rounded-full uppercase">
                Groq Fast LLM
              </span>
            </div>
            <p className="text-[11px] text-stone-500">Trained on CCRAS Ayurvedic Protocols &amp; Modern Podiatric Guidelines</p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: 'c1',
                sender: 'bot',
                text: 'Chat history reset. How can I assist you with your health records and treatment today?',
                timestamp: 'Just now'
              }
            ])
          }
          className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200 transition-colors cursor-pointer"
          title="Reset conversation"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#f8f3eb]/40">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isSpeaking = speakingMsgId === msg.id;

          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className="text-[10px] font-semibold text-stone-500">
                  {isUser ? 'You' : 'Dr. Ananya Sharma (Ayush AI)'}
                </span>
                <span className="text-[10px] text-stone-400">•</span>
                <span className="text-[10px] text-stone-400">{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[85%] sm:max-w-lg p-4 rounded-2xl text-xs sm:text-[12.5px] leading-relaxed shadow-xs relative group ${
                  isUser
                    ? 'bg-[#080331] text-white rounded-tr-xs'
                    : 'bg-white text-[#080331] border border-[#4d4439]/10 rounded-tl-xs'
                }`}
              >
                <div>{msg.text}</div>

                {/* Speak aloud button for bot replies */}
                {!isUser && (
                  <button
                    onClick={() => speakMessage(msg.id, msg.text)}
                    className="mt-2 pt-1 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer transition-colors"
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX size={13} className="text-rose-600 animate-pulse" />
                        <span className="text-rose-600 font-semibold">Stop Speaking</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={13} />
                        <span>Listen Aloud</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 p-3 bg-white border border-[#4d4439]/10 rounded-2xl max-w-xs text-xs text-stone-500">
            <Sparkles size={14} className="text-[#4865ff] animate-spin" />
            <span>Consulting clinical intelligence...</span>
          </div>
        )}
      </div>

      {/* Quick Suggestion Prompts */}
      <div className="px-4 py-2 bg-white border-t border-[#4d4439]/10 flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] text-stone-400 shrink-0 font-medium">Quick Prompts:</span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="text-[11px] bg-[#faf7f2] hover:bg-[#ede6da] text-[#080331] px-3 py-1 rounded-full border border-[#4d4439]/15 transition-all shrink-0 cursor-pointer whitespace-nowrap"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar with Voice Mic & Send */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3 sm:p-4 bg-white border-t border-[#4d4439]/10 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? 'Listening to your speech...' : 'Ask anything about your health report, diet, or treatment...'}
          className={`flex-1 bg-[#faf7f2] border rounded-full px-4 py-2.5 text-xs text-[#080331] focus:outline-none transition-all ${
            isListening ? 'border-rose-500 bg-rose-50/50 animate-pulse' : 'border-[#4d4439]/15 focus:border-[#4865ff]'
          }`}
        />

        {/* Voice Microphone Input Button */}
        <button
          type="button"
          onClick={toggleListening}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
            isListening
              ? 'bg-rose-600 text-white shadow-md animate-bounce'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title={isListening ? 'Stop listening' : 'Speak your question'}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>

        {/* Send Button */}
        <button
          type="submit"
          className="w-10 h-10 rounded-full bg-[#080331] hover:bg-[#1b1463] text-white flex items-center justify-center shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
