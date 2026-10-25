import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Mic } from 'lucide-react';
import VoiceAgentModal from '../components/VoiceAgentModal';

export default function AIGuide() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Namaskar! I am your AI Heritage Voice Guide for Odisha and Indian cultural monuments. You can ask me questions here or tap "Start Voice Call" to talk naturally.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = { role: 'user', content: input };
    const promptText = input;
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Keep the Groq key on the local server instead of exposing it in the browser.
      const res = await fetch('/api/groq-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          systemPrompt: 'You are an expressive, knowledgeable AI Heritage Guide for Odisha and Indian cultural heritage (Konark Sun Temple, Puri Jagannath Temple, Lingaraj Temple, Dhauli). Be concise, respectful, and engaging. Do not invent facts; clearly say when you are uncertain.'
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Groq API HTTP error: ${res.status}`);
      const reply = data.reply?.trim() || 'Could not retrieve a response from the Groq assistant.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Apologies, could not connect to the AI Guide service. Please verify your internet connection.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] lg:h-screen bg-background">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AI Heritage Guide</h1>
            <p className="text-xs text-indigo-400 font-medium tracking-wide uppercase">Groq GPT-OSS 20B + LiveKit Voice</p>
          </div>
        </div>

        {/* LiveKit Voice Call Trigger */}
        <button
          onClick={() => setIsVoiceModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold tracking-wide shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute" />
            <Mic size={14} className="relative text-white" />
          </div>
          <span>Start Voice Call</span>
        </button>
      </header>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`px-4 py-3 rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border border-border text-foreground rounded-tl-sm shadow-sm'}`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Bot size={16} className="text-muted-foreground" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-card border border-border rounded-tl-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-75" />
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-150" />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t border-border">
        <div className="flex items-center gap-2 bg-card border border-border rounded-full p-1 shadow-sm max-w-4xl mx-auto">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about Odisha monuments, history, or culture..."
            className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 transition-opacity shrink-0"
          >
            <Send size={16} className="ml-1" />
          </button>
        </div>
      </div>

      {/* LiveKit Voice Modal */}
      <VoiceAgentModal 
        isOpen={isVoiceModalOpen} 
        onClose={() => setIsVoiceModalOpen(false)} 
      />
    </div>
  );
}
