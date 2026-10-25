import { useState } from 'react';
import { Bot, Send, Sparkles, RefreshCw } from 'lucide-react';

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
      text: 'Namaste! I am your Ayush Clinical AI Assistant. I can help explain the records available in this portal. What would you like to understand today?',
      timestamp: 'Just now'
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickPrompts = [
    'Explain my Wagner Grade 2 ulcer',
    'How do I apply Jatyadi Taila correctly?',
    'Can I take Metformin with Vijaysar?',
    'What foods should I avoid for high Vata?'
  ];

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
      const response = await fetch('/api/groq-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.sender === 'user' ? 'user' : 'assistant',
            content: message.text,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.reply) {
        throw new Error(data.error || 'Groq assistant is unavailable');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: data.reply,
          timestamp: 'Just now',
        },
      ]);
    } catch (error) {
      console.warn('Groq assistant request failed:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: 'The clinical assistant is temporarily unavailable. Please try again in a moment or speak with your care team.',
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
              <h3 className="font-semibold text-sm text-[#080331]">Ayush AI Clinical Assistant</h3>
              <span className="text-[10px] font-semibold bg-[#4865ff]/10 text-[#4865ff] px-2 py-0.5 rounded-full uppercase">
                Sushruta Anamnesis
              </span>
            </div>
            <p className="text-[11px] text-stone-500">Trained on CCRAS Protocols &amp; Modern Podiatric Guidelines</p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: 'c1',
                sender: 'bot',
                text: 'Chat history reset. How can I assist you with your health records today?',
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
          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className="text-[10px] font-semibold text-stone-500">
                  {isUser ? 'You' : 'Ayush AI Assistant'}
                </span>
                <span className="text-[10px] text-stone-400">•</span>
                <span className="text-[10px] text-stone-400">{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[85%] sm:max-w-lg p-4 rounded-2xl text-xs sm:text-[12.5px] leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-[#080331] text-white rounded-tr-xs'
                    : 'bg-white text-[#080331] border border-[#4d4439]/10 rounded-tl-xs'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 p-3 bg-white border border-[#4d4439]/10 rounded-2xl max-w-xs text-xs text-stone-500">
            <Sparkles size={14} className="text-[#4865ff] animate-spin" />
            <span>Consulting the clinical assistant...</span>
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

      {/* Input Bar */}
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
          placeholder="Ask anything about your health report, diet, or treatment..."
          className="flex-1 bg-[#faf7f2] border border-[#4d4439]/15 rounded-full px-4 py-2.5 text-xs text-[#080331] focus:outline-none focus:border-[#4865ff] transition-all"
        />
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
