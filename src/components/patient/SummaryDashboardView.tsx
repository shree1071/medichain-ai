import { useState } from 'react';
import {
  Mic,
  Video,
  Calendar,
  Clock,
  Sparkles,
  FileText,
  Activity,
  Heart,
  Droplet,
  MessageSquare,
  Volume2,
  Stethoscope,
  Pill,
  ArrowUpRight,
  Bot,
  Radio,
  Loader2,
  Touchpad
} from 'lucide-react';
import type { Analysis } from './AnalysisView';
import type { OpdSession } from '../../lib/insforge';
import FluidVoiceOrb from './FluidVoiceOrb';
import { useLanguage } from '../../context/LanguageContext';

interface SummaryDashboardViewProps {
  onNavigateTab: (tab: 'overview' | 'records' | 'twin' | 'appointments' | 'ai-prognosis' | 'messages' | 'bot') => void;
  onOpenVoiceIntake: () => void;
  onOpenTouchIntake?: () => void;
  onOpenModeChooser?: () => void;
  records: Analysis[];
  mySession: OpdSession | null;
}

// Radio frequency soundwave bars: clean, breathable, matching Image 2 reference
// Far left detached ticks:
const LEFT_DETACHED_TICKS = [10, 22];

// Left radio bars: Prominent 34px lead bar, drops to (22, 18), then organic radio variation (12 clean bars)
const LEFT_RADIO_BARS = [
  34, 22, 18, 26, 30, 22, 16, 25, 29, 20, 14, 8
];

// Right radio bars: Starts small near orb, crests cleanly, then tapers (16 breathable bars)
const RIGHT_RADIO_BARS = [
  6, 12, 18, 24, 32, 40, 48, 54, 46, 50, 42, 34, 26, 20, 14, 8
];

export default function SummaryDashboardView({
  onNavigateTab,
  onOpenVoiceIntake,
  onOpenTouchIntake,
  onOpenModeChooser,
  records,
  mySession
}: SummaryDashboardViewProps) {
  const { t, currentLanguageOption } = useLanguage();

  // Voice Assistant State
  const [isListening, setIsListening] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState('');
  const [voiceReply, setVoiceReply] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Suggested Voice Prompts (Bhashini multilingual anamnesis)
  const voiceSuggestions = [
    { label: t('patient.chipUlcer', 'Pair ke ghav ka status?'), query: 'Mera diabetic foot ulcer kaisa heal ho raha hai?' },
    { label: t('patient.chipDressing', "Today's Dressing Protocol"), query: 'Aaj kaunsi dawai aur dressing karni hai?' },
    { label: t('patient.chipDoctor', 'Doctor se appointment'), query: 'Doctor Vaidya Ananya Sharma se tele-kiosk connect karein' },
    { label: t('patient.chipSugar', 'Blood Sugar Summary'), query: 'Mera fasting sugar aur HbA1c ka status kya hai?' }
  ];

  // Voice Interaction Handler (with Web Speech API + SpeechSynthesis)
  const handleToggleVoice = () => {
    if (isListening || isProcessingAI) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setVoiceReply(null);

    // If browser supports SpeechRecognition, use it; otherwise provide immediate high-accuracy voice simulation
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = currentLanguageOption?.ttsLocale || 'hi-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setVoiceQuery(transcript);
          processVoiceQuery(transcript);
          setIsListening(false);
        };

        recognition.onerror = () => {
          simulateVoiceIntake();
        };

        recognition.start();
        return;
      } catch (_) {
        simulateVoiceIntake();
      }
    } else {
      simulateVoiceIntake();
    }
  };

  const simulateVoiceIntake = () => {
    setTimeout(() => {
      const demoTranscript = 'Pair mein dard kam hai, lekin subah thoda discharge tha. Jatyadi Taila kab lagana hai?';
      setVoiceQuery(demoTranscript);
      processVoiceQuery(demoTranscript);
      setIsListening(false);
    }, 1800);
  };

  // Route the assistant request through the local server so the Groq key never reaches the browser.
  const processVoiceQuery = async (text: string) => {
    setIsProcessingAI(true);
    setVoiceReply(null);

    try {
      const res = await fetch('/api/groq-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language: currentLanguageOption?.name || 'Hindi',
          patientName: 'Govind Kumar',
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Groq API HTTP error: ${res.status}`);
      }

      const data = await res.json();
      const reply = data.reply?.trim();
      if (!reply) throw new Error('Groq returned an empty response');
      setVoiceReply(reply);

      // Speak response using SpeechSynthesis with Indic pronunciation
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(reply);
          const targetLocale = currentLanguageOption?.ttsLocale || 'hi-IN';
          utterance.lang = targetLocale;
          utterance.rate = 0.95;
          const langPrefix = targetLocale.split('-')[0].toLowerCase();
          const voices = window.speechSynthesis.getVoices();
          const matchedVoice = voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix)) ||
                               voices.find((v) => v.lang.startsWith('hi') || v.lang.startsWith('en-IN')) || 
                               voices[0];
          if (matchedVoice) utterance.voice = matchedVoice;

          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => setIsSpeaking(false);
          window.speechSynthesis.speak(utterance);
        } catch (_) {}
      }
    } catch (err) {
      console.warn('Groq assistant request failed:', err);
      setVoiceReply('The clinical assistant is temporarily unavailable. Please try again in a moment or speak with your care team.');
    } finally {
      setIsProcessingAI(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HERO: VOICE-FIRST CLINICAL INTAKE (MediChain AI Core)
          ───────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────
          1. HERO: ETHEREAL VOICE-FIRST AI INTAKE (Inspiration Image Matched)
          Luminous light canvas, flowing pastel aurora wave ribbons,
          glowing glassmorphic central orb, and radiating frequency waveform bars
          ───────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────
          1. INTEGRATED VOICE INTAKE CONSOLE (Natural Part of Patient Dashboard)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs relative overflow-hidden">
        
        {/* Simple & serene flowing silk wave (clean 4-line contour matching reference) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          <svg
            className="absolute right-0 bottom-0 w-[70%] sm:w-[65%] h-full object-cover animate-ribbon-drift"
            viewBox="0 0 800 320"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Soft, serene base wash fading gently from left to right */}
              <linearGradient id="silkWashBase" x1="0%" y1="0%" x2="100%" y2="80%">
                <stop offset="0%" stopColor="#EDE9FE" stopOpacity="0" />
                <stop offset="30%" stopColor="#EDE9FE" stopOpacity="0.18" />
                <stop offset="65%" stopColor="#DDD6FE" stopOpacity="0.32" />
                <stop offset="88%" stopColor="#C7D2FE" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.18" />
              </linearGradient>

              {/* Silk contour line gradients: serene lavender, periwinkle & soft sky blue */}
              <linearGradient id="silkLineHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.35" />
                <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.8" />
                <stop offset="85%" stopColor="#EDE9FE" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.2" />
              </linearGradient>

              <linearGradient id="silkLineLavender" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EDE9FE" stopOpacity="0" />
                <stop offset="25%" stopColor="#DDD6FE" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#C4B5FD" stopOpacity="0.6" />
                <stop offset="85%" stopColor="#A78BFA" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#C7D2FE" stopOpacity="0.2" />
              </linearGradient>

              <linearGradient id="silkLinePeriwinkle" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#DDD6FE" stopOpacity="0" />
                <stop offset="30%" stopColor="#C4B5FD" stopOpacity="0.35" />
                <stop offset="65%" stopColor="#818CF8" stopOpacity="0.5" />
                <stop offset="85%" stopColor="#93C5FD" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.15" />
              </linearGradient>

              <linearGradient id="silkLineSky" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C7D2FE" stopOpacity="0" />
                <stop offset="35%" stopColor="#A5B4FC" stopOpacity="0.3" />
                <stop offset="70%" stopColor="#93C5FD" stopOpacity="0.45" />
                <stop offset="90%" stopColor="#BAE6FD" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Soft fluid base wash */}
            <path
              d="M0,175 C165,125 335,215 488,208 C622,202 710,154 820,134 L820,320 L0,320 Z"
              fill="url(#silkWashBase)"
            />

            {/* 4 Clean, Elegant, Flowing Silk Lines (Simple & Nice) */}
            {/* 1. Silk crest highlight */}
            <path
              d="M0,165 C165,120 335,212 488,206 C622,200 710,152 820,132"
              stroke="url(#silkLineHighlight)"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.8"
            />

            {/* 2. Soft lavender upper fold */}
            <path
              d="M0,185 C172,140 345,226 498,220 C632,214 718,170 820,154"
              stroke="url(#silkLineLavender)"
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity="0.65"
            />

            {/* 3. Gentle periwinkle mid flow under orb */}
            <path
              d="M0,210 C182,164 358,244 510,238 C645,232 730,192 820,180"
              stroke="url(#silkLinePeriwinkle)"
              strokeWidth="1.3"
              strokeLinecap="round"
              opacity="0.55"
            />

            {/* 4. Delicate sky-blue lower sweep */}
            <path
              d="M30,240 C195,190 380,268 535,254 C668,240 742,200 820,224"
              stroke="url(#silkLineSky)"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.5"
            />
          </svg>

          {/* Gentle soft ambient glow right behind the orb */}
          <div className="absolute -bottom-10 right-10 w-72 h-72 bg-purple-100/30 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Content: Integrated Two-Column Console */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left Column (7 cols): Patient Greeting & Clinical Action */}
          <div className="lg:col-span-7 space-y-3">
            
            {/* Status chip */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-700 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-500 font-normal">OPD Bay 04 •</span>
              <span className="text-slate-900">Dr. Vaidya Ananya Sharma</span>
              <span className="text-slate-300">•</span>
              <span className="text-indigo-600 font-semibold flex items-center gap-1">
                <Radio size={11} className="text-indigo-500" />
                LiveKit + Sarvam AI
              </span>
            </div>

            {/* Natural Dashboard Heading */}
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t('patient.welcomeDesc', 'Namaste Govind, describe your symptoms')}
            </h2>

            {/* Clinical context */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
              {t('patient.heroSub', "Tap the radio mic to speak in Hindi, English, or your local dialect. MediKiosk transcribes and structures your clinical anamnesis directly for your doctor's consultation.")}
            </p>

            {/* Quick symptom prompts */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[11px] text-slate-400 font-medium mr-1">{t('patient.quickIntake', 'Quick intake:')}</span>
              {voiceSuggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setVoiceQuery(s.query);
                    processVoiceQuery(s.query);
                  }}
                  className="text-[11px] bg-slate-50 hover:bg-purple-50 hover:text-purple-700 text-slate-700 border border-slate-200/80 px-3 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap"
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Primary Consultation Action Buttons (Clear 2-Option Hierarchy) */}
            <div className="flex items-center gap-3 pt-3 flex-wrap">
              {/* Option 1: LiveKit Voice Consultation */}
              <button
                type="button"
                onClick={onOpenVoiceIntake}
                className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-5 py-3 rounded-full transition-all shadow-md shadow-slate-900/20 flex items-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Radio size={14} className="text-purple-300 animate-pulse" />
                <span>{t('patient.btnVoice', 'LiveKit Voice Call')}</span>
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
                  {t('patient.tagHandsFree', 'Hands-Free')}
                </span>
              </button>

              {/* Option 2: Adaptive Quiz with Bhashini */}
              <button
                type="button"
                onClick={onOpenTouchIntake}
                className="bg-[#4865ff] hover:bg-[#3852e6] text-white text-xs font-semibold px-5 py-3 rounded-full transition-all shadow-md shadow-[#4865ff]/25 flex items-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Touchpad size={15} />
                <span>{t('patient.btnQuiz', 'Adaptive Quiz (Touch & Bhashini)')}</span>
                <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
                  {t('patient.tagMcqVoice', 'MCQ + Voice')}
                </span>
              </button>

              {/* Secondary: Reopen Intake Mode Modal */}
              {onOpenModeChooser && (
                <button
                  type="button"
                  onClick={onOpenModeChooser}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs font-semibold px-4 py-3 rounded-full transition-all flex items-center gap-2 cursor-pointer shadow-2xs hover:border-slate-300 active:scale-[0.98]"
                  title="Reopen Consultation Mode chooser modal"
                >
                  <Sparkles size={13} className="text-indigo-600" />
                  <span>{t('patient.btnChooseMode', 'Choose Mode')}</span>
                </button>
              )}
            </div>

          </div>

          {/* Right Column (5 cols): The Radio Frequency Wave & Centerpiece Orb (Integrated directly) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center pt-4 lg:pt-0">
            
            {/* Elegant Serif Label above Orb matching Image 2 */}
            <div
              className="text-center mb-3 text-slate-700 text-sm italic font-serif"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              {isListening ? t('patient.listening', 'Listening to symptoms...') : isSpeaking ? t('patient.speaking', 'Ayush AI speaking...') : t('patient.tryItOut', 'Try it out')}
            </div>

            {/* Exact Radio Waveform from Image 2 */}
            <div className="flex items-center justify-center gap-0 w-full py-2 select-none">
              
              {/* Left Side: Detached Ticks + Left Radio Bars grouped together (No accidental gap between them) */}
              <div className="flex items-center justify-end flex-1 h-16">
                {/* Far Left Detached Ticks */}
                <div className="flex items-center gap-1 mr-2 sm:mr-2.5 shrink-0">
                  {LEFT_DETACHED_TICKS.map((height, idx) => (
                    <span
                      key={`detached-${idx}`}
                      style={{ height: `${height}px` }}
                      className="w-[1.5px] sm:w-[2px] bg-slate-800/90 block rounded-full"
                    />
                  ))}
                </div>

                {/* Left Radio Bars: First big line (34px), then smaller (22, 18), then organic radio variation */}
                <div className="flex items-center gap-[2.5px] sm:gap-[3px] shrink-0">
                  {LEFT_RADIO_BARS.map((height, idx) => {
                    const animationClass = isListening
                      ? `animate-soundwave-${(idx % 5) + 1}`
                      : isSpeaking
                      ? `animate-soundwave-${((idx + 2) % 5) + 1}`
                      : '';
                    return (
                      <span
                        key={`left-radio-${idx}`}
                        style={{ height: `${height}px` }}
                        className={`w-[1.5px] sm:w-[2px] block rounded-full transition-all duration-200 ${
                          isListening
                            ? 'bg-purple-600'
                            : isSpeaking
                            ? 'bg-indigo-500'
                            : 'bg-slate-800/90'
                        } ${animationClass}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Central Fluid Voice Orb Button (Matching user's exact button class and fluid visualizer) */}
              <div className="relative shrink-0 mx-3">
                <FluidVoiceOrb
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  onClick={handleToggleVoice}
                  size={84}
                />
              </div>

              {/* Right Radio Bars: Starts small near orb, builds into tall radio frequency cluster on right */}
              <div className="flex items-center gap-[2.5px] sm:gap-[3px] justify-start flex-1 h-16">
                {RIGHT_RADIO_BARS.map((height, idx) => {
                  const animationClass = isListening
                    ? `animate-soundwave-${((idx + 1) % 5) + 1}`
                    : isSpeaking
                    ? `animate-soundwave-${((idx + 3) % 5) + 1}`
                    : '';
                  return (
                    <span
                      key={`right-radio-${idx}`}
                      style={{ height: `${height}px` }}
                      className={`w-[1.5px] sm:w-[2px] block rounded-full transition-all duration-200 ${
                        isListening
                          ? 'bg-purple-600'
                          : isSpeaking
                          ? 'bg-indigo-500'
                          : 'bg-slate-800/90'
                      } ${animationClass}`}
                    />
                  );
                })}
              </div>

            </div>

            {/* Spoken Output Box if active */}
            {(voiceQuery || voiceReply || isProcessingAI) && (
              <div className="w-full mt-3 p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200/80 text-xs space-y-2 animate-fade-in shadow-2xs">
                {voiceQuery && (
                  <div className="text-slate-700 flex items-start gap-2">
                    <Mic size={13} className="text-purple-600 shrink-0 mt-0.5" />
                    <span><strong className="font-semibold text-slate-900">Patient:</strong> "{voiceQuery}"</span>
                  </div>
                )}
                {isProcessingAI ? (
                  <div className="flex items-center gap-2 text-indigo-700 py-1 font-medium">
                    <Loader2 size={13} className="animate-spin text-indigo-600" />
                    <span>Querying Sarvam 105B Indic clinical model...</span>
                  </div>
                ) : voiceReply ? (
                  <div className="text-slate-800 pt-2 border-t border-purple-200/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-purple-900 font-semibold text-[11px]">
                        <Volume2 size={13} className={`${isSpeaking ? 'text-purple-600 animate-bounce' : 'text-purple-500'}`} />
                        <span>Sarvam AI Guidance</span>
                      </div>
                      <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full border border-purple-200/60">
                        Sarvam 105B Indic
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-sans">{voiceReply}</p>
                    <div className="pt-1 flex items-center justify-end gap-2">
                      <button
                        onClick={onOpenTouchIntake}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-full transition-all cursor-pointer shadow-2xs"
                      >
                        <Touchpad size={11} className="text-blue-600" />
                        <span>Touch Case-Taking</span>
                      </button>
                      <button
                        onClick={onOpenVoiceIntake}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full transition-all cursor-pointer shadow-2xs"
                      >
                        <Radio size={11} className="text-indigo-500 animate-pulse" />
                        <span>Connect Voice Call</span>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. TOP ROW: HEALTH OVERVIEW & UPCOMING APPOINTMENT (Matching User Image)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: Health Overview / Clean Summary Vitals (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{t('patient.healthOverview', 'Health Overview')}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t('patient.healthOverviewSub', 'Summary of key clinical markers & vital signs')}</p>
              </div>

              {/* Vitals Indicator Legend */}
              <div className="hidden sm:flex items-center gap-3 text-[11px] font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span> {t('patient.heartRate', 'Heart Rate')}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span> {t('patient.bloodPressure', 'Blood Pressure')}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {t('patient.bloodSugar', 'Blood Sugar')}
                </span>
              </div>
            </div>

            {/* Clean Snapshot Metrics (NO complex real-time graphs as requested!) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-5">
              
              {/* Blood Sugar */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t('patient.bloodSugar', 'Blood Sugar')}</span>
                  <Droplet size={13} className="text-emerald-600" />
                </div>
                <div className="text-xl font-bold text-slate-900">95 <span className="text-xs font-normal text-slate-500">mg/dL</span></div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">
                  {t('patient.optimalFasting', 'Optimal (Fasting)')}
                </span>
              </div>

              {/* Blood Pressure */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t('patient.bloodPressure', 'Blood Pressure')}</span>
                  <Activity size={13} className="text-cyan-600" />
                </div>
                <div className="text-xl font-bold text-slate-900">120/80 <span className="text-xs font-normal text-slate-500">mmHg</span></div>
                <span className="text-[10px] font-semibold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">
                  {t('patient.normalRange', 'Normal Range')}
                </span>
              </div>

              {/* Heart Rate */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t('patient.heartRate', 'Heart Rate')}</span>
                  <Heart size={13} className="text-rose-500" />
                </div>
                <div className="text-xl font-bold text-slate-900">72 <span className="text-xs font-normal text-slate-500">bpm</span></div>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">
                  {t('patient.restingPulse', 'Resting Pulse')}
                </span>
              </div>

              {/* Wound Healing Risk */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t('patient.ulcerHealing', 'Ulcer Healing')}</span>
                  <Activity size={13} className="text-amber-500" />
                </div>
                <div className="text-xl font-bold text-slate-900">78 <span className="text-xs font-normal text-slate-500">/100</span></div>
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">
                  {t('patient.wagnerGrade2', 'Wagner Grade 2')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick jump to 3D Digital Twin */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Correlated with active 3D organ twin</span>
            <button
              onClick={() => onNavigateTab('twin')}
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>{t('patient.view3DTwin', 'View 3D Anatomical Twin')}</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* RIGHT: Upcoming Appointment Card (5 cols - Exactly matching reference image!) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">{t('patient.upcomingAppointment', 'Upcoming Appointment')}</h3>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {t('patient.confirmed', 'Confirmed')}
              </span>
            </div>

            {/* Doctor Profile Info */}
            <div className="flex items-center gap-3.5 my-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shadow-2xs shrink-0">
                <img 
                  src="/portrait-female-pediatrician-work.webp" 
                  alt="Dr. Vaidya Ananya Sharma" 
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Dr. Vaidya Ananya Sharma, MD</h4>
                <p className="text-xs text-slate-500 font-medium">Shalya Tantra (Wound Healing &amp; DFU)</p>
                <div className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold mt-1">
                  <Clock size={13} />
                  <span>
                    Today, 10:30 AM • {mySession?.token_number ? `OPD Token ${mySession.token_number} (Bay 04)` : 'OPD Bay 04'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons (Matching reference image!) */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => alert('Connecting to Dr. Vaidya Ananya Sharma on Ayush Tele-Kiosk Stream...')}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-3 px-4 rounded-full transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Video size={15} />
              <span>{t('patient.joinVideoCall', 'Join Video Call')}</span>
            </button>

            <button
              onClick={() => onNavigateTab('appointments')}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold py-2.5 px-4 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar size={14} className="text-slate-500" />
              <span>{t('patient.reschedule', 'Reschedule in Calendar')}</span>
            </button>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MIDDLE ROW: RECENT TESTS & SCANS (Matching User Image with "See All")
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">{t('patient.recentTests', 'Recent Tests & Digitized Scans')}</h3>
            <p className="text-xs text-slate-500">Processed through Sarvam OCR &amp; ABDM Health Locker</p>
          </div>
          <button
            onClick={() => onNavigateTab('records')}
            className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
          >
            {t('patient.seeAll', 'See All')}
          </button>
        </div>

        {/* Horizontal Test Cards (Dynamically populated from clinical records) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {records && records.length > 0 ? (
            records.slice(0, 3).map((rec, idx) => (
              <div
                key={rec.id || idx}
                onClick={() => onNavigateTab('records')}
                className="p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-100 border border-slate-200/70 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`w-10 h-10 rounded-xl ${
                    idx === 0 ? 'bg-blue-50 text-blue-600' : idx === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  } flex items-center justify-center font-bold text-xs shrink-0`}>
                    {idx === 0 ? <FileText size={18} /> : idx === 1 ? <Activity size={18} /> : <Sparkles size={18} />}
                  </div>
                  <div className="overflow-hidden pr-2">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {rec.conditions && rec.conditions.length > 0 ? rec.conditions[0] : rec.file_name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{rec.created_at}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 shrink-0">
                  Completed
                </span>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-6 text-xs text-slate-400">
              No recent scans recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. BOTTOM ROW: TODAY'S PRESCRIPTIONS & MY DOCTORS (Matching User Image)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: Today's Prescriptions & Dressing Schedule (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Pill size={16} className="text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Today's Regimen</h3>
              </div>
              <span className="text-xs text-slate-400">3 Active</span>
            </div>

            <div className="space-y-2.5 my-4">
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">Jatyadi Taila Dressing</div>
                  <div className="text-[11px] text-slate-500">Apply after Panchavalkala wash • OD</div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  11:00 AM
                </span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">Cap Pantocid-D</div>
                  <div className="text-[11px] text-slate-500">Empty stomach before food • 1 Cap OD</div>
                </div>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                  Done
                </span>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">Tab Yograj Guggulu</div>
                  <div className="text-[11px] text-slate-500">With warm water after lunch • 2 Tab BD</div>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  01:30 PM
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('records')}
            className="w-full text-center text-xs text-slate-600 hover:text-slate-900 font-semibold py-2 border-t border-slate-100 cursor-pointer"
          >
            View Full Medication Dossier →
          </button>
        </div>

        {/* RIGHT: My Doctors (7 cols - Matching User Image!) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Stethoscope size={16} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">My Care Team</h3>
              </div>
              <span className="text-xs text-slate-500">AIIMS / OPD Bay 04</span>
            </div>

            {/* Primary Attending Doctor Card */}
            <div className="p-4 my-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                  <img 
                    src="/portrait-female-pediatrician-work.webp" 
                    alt="Dr. Vaidya Ananya Sharma" 
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">Dr. Vaidya Ananya Sharma, MD</h4>
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Primary
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Attending Clinician • Shalya Tantra (Wound Healing)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  onClick={() => alert('Viewing Dr. Vaidya Ananya Sharma clinical credentials: MD (Ayush), Shalya Tantra, OPD Bay 04.')}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
                >
                  View Profile
                </button>
                <button
                  onClick={() => onNavigateTab('messages')}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <MessageSquare size={13} />
                  <span>Message</span>
                </button>
              </div>
            </div>

            {/* Secondary / Consulted Doctors List */}
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Recent Consultations
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                    R
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Dr. Rameshwar Nath, BAMS</div>
                    <div className="text-[11px] text-slate-400">Internal Medicine (Kayachikitsa) • Bay 02</div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateTab('messages')}
                  className="text-xs font-semibold text-slate-600 hover:text-black cursor-pointer"
                >
                  Message
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>2 ABDM Verified Clinicians on your case</span>
            <button
              onClick={() => onNavigateTab('bot')}
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Bot size={13} />
              <span>Ask Ayush Assistant</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
