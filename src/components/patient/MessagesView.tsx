import { useState } from 'react';
import { Send, CheckCheck, Paperclip, Stethoscope } from 'lucide-react';

interface Message {
  id: string;
  sender: 'doctor' | 'patient';
  senderName: string;
  text: string;
  timestamp: string;
}

export default function MessagesView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'doctor',
      senderName: 'Dr. Vaidya Ananya Sharma (Bay 04)',
      text: 'Namaste Shri Rajesh ji. I have reviewed your latest high-definition wound picture and the OCR extraction of your Civil Hospital prescription.',
      timestamp: 'Today, 09:15 AM'
    },
    {
      id: 'm2',
      sender: 'doctor',
      senderName: 'Dr. Vaidya Ananya Sharma (Bay 04)',
      text: 'The Wagner Grade 2 ulcer at the 1st metatarsal head has satisfactory granulation tissue. Please continue the Panchavalkala Kashaya wash before your Jatyadi Taila sterile dressing daily.',
      timestamp: 'Today, 09:17 AM'
    },
    {
      id: 'm3',
      sender: 'patient',
      senderName: 'Rajesh Verma (You)',
      text: 'Thank you doctor. Should I keep the off-loading footwear on while walking inside the house as well?',
      timestamp: 'Today, 09:40 AM'
    },
    {
      id: 'm4',
      sender: 'doctor',
      senderName: 'Dr. Vaidya Ananya Sharma (Bay 04)',
      text: 'Yes, absolutely! Even brief unprotected steps on tile or concrete floors generate shear pressure exceeding 50 N/cm², which can disrupt new capillary buds. Keep the off-loader on at all times when standing.',
      timestamp: 'Today, 09:42 AM'
    }
  ]);

  const [newMsg, setNewMsg] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

    const userMessage: Message = {
      id: `m-${Date.now()}`,
      sender: 'patient',
      senderName: 'Rajesh Verma (You)',
      text: newMsg.trim(),
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, userMessage]);
    setNewMsg('');

    // Simulate doctor response
    setTimeout(() => {
      const docReply: Message = {
        id: `m-${Date.now() + 1}`,
        sender: 'doctor',
        senderName: 'Dr. Vaidya Ananya Sharma (Bay 04)',
        text: 'Received your message. Please proceed to Bay 04 when your token AYUSH-44 is called.',
        timestamp: 'Just now'
      };
      setMessages((prev) => [...prev, docReply]);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#4d4439]/10 shadow-sm overflow-hidden flex flex-col h-[650px] animate-fade-in text-[#080331]">
      {/* Thread Header */}
      <div className="p-4 sm:p-5 bg-[#faf7f2] border-b border-[#4d4439]/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#080331] text-white flex items-center justify-center font-serif text-sm font-semibold shadow-xs">
            <Stethoscope size={18} className="text-[#4865ff]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-[#080331]">Dr. Vaidya Ananya Sharma</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-700 font-medium">Online at Bay 04</span>
            </div>
            <p className="text-[11px] text-stone-500">Head of Shalya Tantra • Ayush OPD Tele-Desk</p>
          </div>
        </div>

        <span className="text-xs bg-white text-stone-600 border border-[#4d4439]/10 px-3 py-1 rounded-full font-mono">
          Token: #AYUSH-44
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#f8f3eb]/40">
        {messages.map((m) => {
          const isMe = m.sender === 'patient';
          return (
            <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className="text-[10px] font-semibold text-stone-500">{m.senderName}</span>
                <span className="text-[10px] text-stone-400">•</span>
                <span className="text-[10px] text-stone-400">{m.timestamp}</span>
              </div>

              <div
                className={`max-w-[82%] sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-[12.5px] leading-relaxed shadow-xs ${
                  isMe
                    ? 'bg-[#080331] text-white rounded-tr-xs'
                    : 'bg-white text-[#080331] border border-[#4d4439]/10 rounded-tl-xs'
                }`}
              >
                {m.text}
              </div>

              <div className="flex items-center gap-1 mt-1 px-1 text-stone-400 text-[10px]">
                {isMe && <CheckCheck size={12} className="text-[#4865ff]" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Message Input Bar */}
      <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-[#4d4439]/10 flex items-center gap-2">
        <button
          type="button"
          onClick={() => alert('Attach wound photograph or previous lab PDF.')}
          className="p-2 text-stone-400 hover:text-[#080331] rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          title="Attach document or image"
        >
          <Paperclip size={18} />
        </button>

        <input
          type="text"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Ask Dr. Ananya Sharma about your dressings, symptoms, or medications..."
          className="flex-1 bg-[#faf7f2] border border-[#4d4439]/15 rounded-full px-4 py-2.5 text-xs text-[#080331] focus:outline-none focus:border-[#4865ff] transition-all"
        />

        <button
          type="submit"
          className="w-10 h-10 rounded-full bg-[#080331] hover:bg-[#1b1463] text-white flex items-center justify-center shadow-sm transition-all cursor-pointer shrink-0"
          title="Send Message"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
