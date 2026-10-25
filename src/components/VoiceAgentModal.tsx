import { useState, useEffect, useRef } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  BarVisualizer,
  useLocalParticipant,
  useRemoteParticipants,
  useRoomContext,
  StartAudio,
} from '@livekit/components-react';
import '@livekit/components-styles';
import {
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  X,
  Radio,
  FileText,
  CheckCircle2,
  Stethoscope,
  ShieldCheck,
  Printer,
  ChevronRight,
  UserCheck,
  Touchpad,
  Send,
  Volume2,
  VolumeX,
  Loader2,
  Languages,
  Gauge
} from 'lucide-react';
import FluidVoiceOrb from './patient/FluidVoiceOrb';
import TouchHistoryEngine, { type HistoryTakingResult } from './TouchHistoryEngine';
import { useLanguage } from '../context/LanguageContext';

interface VoiceAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  roomNamePrefix?: string;
  participantName?: string;
  suggestedPrompts?: string[];
  defaultTab?: 'voice' | 'touch' | 'report';
}

export default function VoiceAgentModal({
  isOpen,
  onClose,
  title = 'MediKiosk Clinical Voice & Touch Intake',
  subtitle = 'Autonomous OPD Clinical History & E-Prescription • Dr. Vaidya Ananya Sharma (Bay 04)',
  roomNamePrefix = 'ayush-kiosk',
  participantName = 'Govind Kumar',
  suggestedPrompts = [
    'Ghav mein dard 4 number par hai, halka jalan lagta hai',
    'Ghav se koi badbu ya pus nahi hai, saaf hai',
    'Roz subah Triphala kashaya wash aur Jatyadi Ghrita patti kar raha hoon',
    'Kaishore Guggulu aur Madhumehari Churna niyamit le raha hoon',
    'Fasting blood sugar 95 mg/dL hai aur chappal pehanta hoon'
  ],
  defaultTab = 'voice'
}: VoiceAgentModalProps) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>('');
  const [connecting, setConnecting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'voice' | 'touch' | 'report'>(defaultTab);
  const [isStandaloneVoice, setIsStandaloneVoice] = useState<boolean>(true);
  const [reportSaved, setReportSaved] = useState<boolean>(false);
  const [touchResult, setTouchResult] = useState<HistoryTakingResult | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      // Directly start the hands-free Sarvam AI Phone Call without waiting for non-existent LiveKit room
      setIsStandaloneVoice(true);
      setToken(null);
    }
  }, [isOpen, defaultTab]);

  const connectToAgent = async () => {
    setConnecting(true);
    try {
      const roomName = `${roomNamePrefix}-${Math.random().toString(36).substring(7)}`;
      const res = await fetch(`/api/livekit-token?room=${roomName}&name=${encodeURIComponent(participantName)}`);
      if (!res.ok) {
        throw new Error(`Token request status: ${res.status}`);
      }
      const data = await res.json();
      if (data.token && data.url) {
        setToken(data.token);
        setServerUrl(data.url);
        setIsStandaloneVoice(false);
      } else {
        throw new Error(data.error || 'Failed to acquire LiveKit token');
      }
    } catch (err: any) {
      console.warn('LiveKit server unavailable, activating autonomous direct voice assistant:', err);
      setIsStandaloneVoice(true);
      setToken(null);
      setFallbackNotice(null);
    } finally {
      setConnecting(false);
    }
  };

  const handleEndCall = () => {
    // Show prescription report on call end so the patient and doctor have the summary ready
    setActiveTab('report');
    setToken(null);
  };

  const handleClose = () => {
    setToken(null);
    setIsStandaloneVoice(false);
    setActiveTab('voice');
    onClose();
  };

  const handleSavePrescription = () => {
    try {
      const existing = JSON.parse(localStorage.getItem('ayush_saved_prescriptions') || '[]');
      const newPrescription = {
        id: `rx-ayush-${Date.now()}`,
        patient: participantName || 'Govind Kumar',
        uhid: 'NIA-2026-GK-8821',
        age: 58,
        gender: 'Male',
        doctor: 'Dr. Vaidya Ananya Sharma, MD (Ayu)',
        bay: 'Bay 04',
        timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        chief_complaint: touchResult
          ? `${touchResult.chiefComplaint} (${touchResult.site || 'Plantar aspect'}, Duration: ${touchResult.onsetDuration})`
          : 'Plantar Neuropathic Ulcer (Left 1st Metatarsal head, Wagner Grade 2)',
        pain_score: touchResult
          ? `${touchResult.severity} / 10 (${touchResult.character})`
          : '4 / 10 (Moderate burning ache)',
        wound_condition: touchResult
          ? `Agni: ${touchResult.agni}, Koshtha: ${touchResult.koshtha}, Rasa: ${touchResult.dominantRasa}${touchResult.isRedFlag ? ' [EMERGENCY RED FLAG DETECTED]' : ''}`
          : 'Granulation tissue progressing cleanly, serous exudate minimal, no cellulitis, no foul odor',
        fasting_sugar: '95 mg/dL (Controlled within fasting target)',
        medications: [
          { name: 'Triphala Kashaya Dhawana', dosage: 'Lukewarm wash', frequency: 'Once Daily (OD)' },
          { name: 'Jatyadi Ghrita Sterile Gauze', dosage: 'Topical dressing', frequency: 'Once Daily (OD)' },
          { name: 'Kaishore Guggulu (Vati)', dosage: '2 tablets', frequency: 'Twice Daily (BD) after food with lukewarm water' },
          { name: 'Madhumehari Churna', dosage: '3 grams', frequency: 'Twice Daily (BD) before meals' },
          { name: 'Diabetic Offloading Orthotic Footwear', dosage: 'Orthotic wear', frequency: 'Mandatory continuous use. Zero barefoot walking.' }
        ]
      };
      existing.unshift(newPrescription);
      localStorage.setItem('ayush_saved_prescriptions', JSON.stringify(existing));
      window.dispatchEvent(new CustomEvent('ayush_prescription_added', { detail: newPrescription }));
      setReportSaved(true);
      setTimeout(() => setReportSaved(false), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTouchHistoryComplete = (result: HistoryTakingResult) => {
    setTouchResult(result);
    try {
      const existing = JSON.parse(localStorage.getItem('ayush_saved_prescriptions') || '[]');
      const newPrescription = {
        id: `rx-touch-${Date.now()}`,
        patient: participantName || 'Govind Kumar',
        uhid: 'NIA-2026-GK-8821',
        age: 58,
        gender: 'Male',
        doctor: 'Dr. Vaidya Ananya Sharma, MD (Ayu)',
        bay: 'Bay 04',
        timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        chief_complaint: `${result.chiefComplaint} (Site: ${result.site}, Duration: ${result.onsetDuration})`,
        pain_score: `${result.severity} / 10 (${result.character})`,
        wound_condition: `Agni: ${result.agni}, Koshtha: ${result.koshtha}, Rasa: ${result.dominantRasa}${result.isRedFlag ? ' [EMERGENCY RED FLAG: ' + result.redFlagReason + ']' : ''}`,
        fasting_sugar: '95 mg/dL (Controlled within fasting target)',
        medications: [
          { name: 'Triphala Kashaya Dhawana', dosage: 'Lukewarm wash', frequency: 'Once Daily (OD)' },
          { name: 'Jatyadi Ghrita Sterile Gauze', dosage: 'Topical dressing', frequency: 'Once Daily (OD)' },
          { name: 'Kaishore Guggulu (Vati)', dosage: '2 tablets', frequency: 'Twice Daily (BD) after food with lukewarm water' },
          { name: 'Madhumehari Churna', dosage: '3 grams', frequency: 'Twice Daily (BD) before meals' },
          { name: 'Diabetic Offloading Orthotic Footwear', dosage: 'Orthotic wear', frequency: 'Mandatory continuous use. Zero barefoot walking.' }
        ]
      };
      existing.unshift(newPrescription);
      localStorage.setItem('ayush_saved_prescriptions', JSON.stringify(existing));
      window.dispatchEvent(new CustomEvent('ayush_prescription_added', { detail: newPrescription }));
    } catch (e) {
      console.error(e);
    }
    setActiveTab('report');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl shadow-[0_24px_60px_rgba(15,23,42,0.14)] overflow-hidden flex flex-col text-slate-800 transition-all max-h-[92vh]">
        
        {/* ── Calm Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Sparkles size={19} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 text-base tracking-tight">
                  {title}
                </h3>
                <button
                  onClick={() => {
                    if (token) {
                      setToken(null);
                      setIsStandaloneVoice(true);
                       setFallbackNotice('Switched to direct voice mode: Groq reasoning + Sarvam speech');
                    } else {
                      connectToAgent();
                    }
                  }}
                  title="Click to switch voice engines"
                  className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                    token
                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200/80'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200/70'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${token ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                  {token ? 'LiveKit Room (Switch to Direct)' : isStandaloneVoice ? 'Direct Sarvam Voice' : 'Dual Voice & Touch'}
                </button>
              </div>
              <p className="text-xs text-slate-500 font-normal">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Pill */}
            <div className="flex items-center p-0.5 bg-slate-100/90 rounded-full border border-slate-200/80 text-xs">
              <button
                onClick={() => setActiveTab('voice')}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  activeTab === 'voice'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Radio size={11} className={activeTab === 'voice' ? 'text-indigo-600' : 'text-slate-400'} />
                <span>Voice Call</span>
              </button>

              <button
                onClick={() => setActiveTab('touch')}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  activeTab === 'touch'
                    ? 'bg-[#4865ff] text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Touchpad size={11} className={activeTab === 'touch' ? 'text-white' : 'text-blue-500'} />
                <span>Touch Intake</span>
              </button>

              <button
                onClick={() => setActiveTab('report')}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  activeTab === 'report'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText size={11} className="text-indigo-600" />
                <span>Doctor Rx</span>
              </button>
            </div>

            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Main Content Area ── */}
        <div className="overflow-y-auto flex-1">
          {activeTab === 'voice' ? (
            <div className="p-6 flex flex-col items-center justify-center bg-gradient-to-b from-slate-50/40 via-white to-slate-50/30">
              {fallbackNotice && (
                <div className="w-full max-w-md mx-auto mb-3 px-3.5 py-2 rounded-2xl bg-indigo-50/90 border border-indigo-200/80 text-[11px] text-indigo-900 flex items-center justify-between shadow-2xs animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <Sparkles size={13} className="text-indigo-600 shrink-0" />
                    <span className="font-medium">{fallbackNotice}</span>
                  </div>
                  <button onClick={() => setFallbackNotice(null)} className="text-indigo-400 hover:text-indigo-700 cursor-pointer ml-2">
                    <X size={13} />
                  </button>
                </div>
              )}

              {connecting ? (
                <div className="w-full flex flex-col items-center justify-center py-12">
                  <div className="relative w-20 h-20 mb-5">
                    <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-60" />
                    <div className="relative w-full h-full rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                      <Radio size={28} className="animate-pulse" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">Connecting to Dr. Sharma's Assistant...</p>
                  <p className="text-xs text-slate-500 mt-1">Starting real-time Indic voice session</p>
                </div>
              ) : token ? (
                /* LiveKit WebRTC Session */
                <LiveKitRoom
                  serverUrl={serverUrl}
                  token={token}
                  audio={true}
                  video={false}
                  onDisconnected={handleEndCall}
                  className="w-full flex flex-col items-center"
                >
                  <RoomAudioRenderer />
                  <ActiveVoiceAssistantContent
                    onEndCall={handleEndCall}
                    onOpenReport={() => setActiveTab('report')}
                    onFallbackToDirectVoice={() => {
                      setToken(null);
                      setIsStandaloneVoice(true);
                       setFallbackNotice('LiveKit room idle — auto-switched to direct Groq + Sarvam voice mode');
                    }}
                  />
                </LiveKitRoom>
              ) : (
                /* Standalone Browser-Native Autonomous Voice Engine (Never fails, zero token blocker) */
                <StandaloneVoiceAssistantContent
                  participantName={participantName}
                  onEndCall={handleEndCall}
                  onOpenReport={() => setActiveTab('report')}
                  onSwitchToTouch={() => setActiveTab('touch')}
                  suggestedPrompts={suggestedPrompts}
                />
              )}

              {/* Suggested Prompts footer (Calm Light Theme) */}
              <div className="w-full mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Stethoscope size={13} className="text-indigo-600" />
                    <span>Clinical prompts (speak in Hindi or English, or tap to speak):</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('touch')}
                    className="text-[11px] text-[#4865ff] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Touchpad size={12} />
                    <span>Prefer touch? Use MCQ mode</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedPrompts.map((hint, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('medikiosk_voice_prompt', { detail: hint }));
                      }}
                      className="text-[11px] text-slate-600 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 px-3 py-1 rounded-full border border-slate-200/80 transition-colors select-none text-left cursor-pointer"
                    >
                      "{hint}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'touch' ? (
            /* ── Tab 2: Touch-First Adaptive AI MCQ History Taking Engine ── */
            <div className="p-4 sm:p-6 bg-gradient-to-b from-slate-50/50 via-white to-slate-50/30">
              <div className="mb-4 flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Touch Case-Taking (Adaptive AI MCQ &amp; Type)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tap to answer or type custom responses. Dynamically adapts questions in real-time.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('voice')}
                  className="px-3 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer"
                >
                  <Radio size={12} className="text-indigo-600" />
                  <span>Switch to Voice</span>
                </button>
              </div>
              <TouchHistoryEngine
                onComplete={handleTouchHistoryComplete}
                patientName={participantName}
              />
            </div>
          ) : (
            /* ── Tab 3: Doctor Prescription & Clinical History Report (MineArena 1.0) ── */
            <div className="p-6 space-y-5 bg-gradient-to-b from-slate-50/40 via-white to-slate-50/30">
              {/* Prescription Header Banner */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <Stethoscope size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">National Institute of Ayurveda</h4>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        OPD Bay 04
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Attending Physician: <span className="font-semibold text-slate-800">Dr. Vaidya Ananya Sharma, MD (Ayu)</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      MineArena 1.0 Hackathon • Autonomous Clinical History &amp; Sovereign Health Records
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-full">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Dispatched to Bay 04</span>
                  </span>
                </div>
              </div>

              {/* Patient Demographics & Vitals Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Patient</div>
                  <div className="font-semibold text-slate-800 text-xs mt-0.5">{participantName}, 58 M</div>
                  <div className="text-[10px] text-slate-500">UHID: NIA-2026-GK-8821</div>
                </div>
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Ulcer Stage</div>
                  <div className="font-semibold text-amber-700 text-xs mt-0.5">Wagner Grade 2</div>
                  <div className="text-[10px] text-slate-500">Plantar Neuropathic</div>
                </div>
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Fasting Sugar</div>
                  <div className="font-semibold text-emerald-700 text-xs mt-0.5">95 mg/dL</div>
                  <div className="text-[10px] text-slate-500">Target Range Controlled</div>
                </div>
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Ayush Pariksha</div>
                  <div className="font-semibold text-indigo-700 text-xs mt-0.5">
                    {touchResult ? touchResult.agni : 'Mandagni • Vata-Kapha'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {touchResult ? `Koshtha: ${touchResult.koshtha}` : 'Shodhana & Ropana'}
                  </div>
                </div>
              </div>

              {/* Elicited Clinical History (SOCRATES Framework) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <UserCheck size={16} className="text-indigo-600" />
                    <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Elicited Clinical Anamnesis (SOCRATES Protocol)
                    </h5>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {touchResult ? 'Verified via Touch MCQ Adaptive Engine' : 'Voice Verified by Groq Clinical Assistant'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
                    <span className="font-semibold text-slate-700">Site &amp; Onset:</span>
                    <p className="text-slate-600 mt-0.5">
                      {touchResult ? `${touchResult.site}; Duration: ${touchResult.onsetDuration}` : 'Left 1st metatarsal head plantar aspect; 3 weeks non-healing duration.'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
                    <span className="font-semibold text-slate-700">Pain Score &amp; Character:</span>
                    <p className="text-slate-600 mt-0.5">
                      {touchResult ? `${touchResult.severity} / 10; ${touchResult.character}` : '4 / 10; Dull burning neuropathic ache, worse upon standing.'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
                    <span className="font-semibold text-slate-700">Ulcer Exudate &amp; Odor:</span>
                    <p className="text-slate-600 mt-0.5">
                      {touchResult ? (touchResult.isRedFlag ? `RED FLAG: ${touchResult.redFlagReason}` : 'Clean pink granulation tissue, minimal serous exudate, zero foul odor.') : 'Clean pink granulation tissue, minimal serous exudate, zero foul odor.'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
                    <span className="font-semibold text-slate-700">Treatment Adherence &amp; Diet:</span>
                    <p className="text-slate-600 mt-0.5">
                      {touchResult ? `Rasa: ${touchResult.dominantRasa}; Vihara: ${touchResult.vihara}` : 'Daily Triphala wash + Jatyadi Ghrita dressing done; Kaishore Guggulu active.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Official Prescribed Regimen (Rx Pad) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-indigo-600" />
                    <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Doctor Prescription &amp; Treatment Regimen (Rx)
                    </h5>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-700">Dr. Vaidya Ananya Sharma</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start justify-between p-2.5 rounded-xl bg-slate-50/60 border border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-900">1. Triphala Kashaya Dhawana</span>
                      <p className="text-slate-500 text-[11px]">Lukewarm sterile wound irrigation once daily prior to dressing</p>
                    </div>
                    <span className="font-medium text-slate-700 text-[11px] px-2 py-0.5 bg-white rounded-md border border-slate-200">
                      Once Daily (OD)
                    </span>
                  </div>

                  <div className="flex items-start justify-between p-2.5 rounded-xl bg-slate-50/60 border border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-900">2. Jatyadi Ghrita Gauze Dressing</span>
                      <p className="text-slate-500 text-[11px]">Topical sterile gauze application for tissue ropana &amp; vrana healing</p>
                    </div>
                    <span className="font-medium text-slate-700 text-[11px] px-2 py-0.5 bg-white rounded-md border border-slate-200">
                      Daily Dressing
                    </span>
                  </div>

                  <div className="flex items-start justify-between p-2.5 rounded-xl bg-slate-50/60 border border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-900">3. Kaishore Guggulu (Vati)</span>
                      <p className="text-slate-500 text-[11px]">2 tablets with lukewarm water after food (Pitta-Vata pacifier)</p>
                    </div>
                    <span className="font-medium text-slate-700 text-[11px] px-2 py-0.5 bg-white rounded-md border border-slate-200">
                      2 Tab BD
                    </span>
                  </div>

                  <div className="flex items-start justify-between p-2.5 rounded-xl bg-slate-50/60 border border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-900">4. Madhumehari Churna</span>
                      <p className="text-slate-500 text-[11px]">3 grams with warm water before meals for glycemic modulation</p>
                    </div>
                    <span className="font-medium text-slate-700 text-[11px] px-2 py-0.5 bg-white rounded-md border border-slate-200">
                      3g BD (AC)
                    </span>
                  </div>

                  <div className="flex items-start justify-between p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100">
                    <div>
                      <span className="font-semibold text-indigo-950">5. Diabetic Offloading Orthotic Footwear</span>
                      <p className="text-indigo-700 text-[11px]">Mandatory custom offloading footwear. Strict zero barefoot walking.</p>
                    </div>
                    <span className="font-semibold text-indigo-700 text-[11px] px-2 py-0.5 bg-white rounded-md border border-indigo-200">
                      Continuous
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Prescription */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSavePrescription}
                    className="px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    {reportSaved ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span>Prescription Saved to Records!</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={14} className="text-emerald-400" />
                        <span>Save to My Patient Records</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer size={14} className="text-slate-500" />
                    <span>Print Slip</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('touch')}
                    className="text-xs font-semibold text-[#4865ff] hover:text-[#3852e6] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Touchpad size={13} />
                    <span>Touch Case-Taking</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('voice')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Return to Voice Call</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Helper to encode Float32Array PCM audio into standard 16-bit 16kHz WAV Blob */
function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono channel
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); // Block align (1 channel * 2 bytes)
  view.setUint16(34, 16, true); // Bits per sample
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return new Blob([view], { type: 'audio/wav' });
}

/** Supported Indic call languages with native labels and script hints */
const CALL_LANGUAGES = [
  { code: 'auto', name: 'Auto-Detect', native: 'ಕನ್ನಡ / हिन्दी / Auto', flag: '🌐' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'en', name: 'English', native: 'Indian English', flag: '🌐' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
];

/**
 * Continuous Hands-Free Phone Call Assistant
 * Powered by Groq + Sarvam voice services:
 * - Groq GPT-OSS 20B: clinical reasoning with dynamic pace judgment
 * - Sarvam Bulbul v3: Natural female voice (speaker 'kavya') with adaptive pace
 * - Sarvam Saaras v3: Multilingual acoustic Speech-to-Text fallback
 * - Acoustic VAD with half-duplex turn-taking:
 *   1. The microphone is paused while the assistant speaks.
 *   2. When the patient stops talking, the turn is automatically processed.
 */
function StandaloneVoiceAssistantContent({
  participantName,
  onEndCall,
  onOpenReport,
  onSwitchToTouch,
  suggestedPrompts: _suggestedPrompts
}: {
  participantName: string;
  onEndCall: () => void;
  onOpenReport: () => void;
  onSwitchToTouch: () => void;
  suggestedPrompts: string[];
}) {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.16); // Dynamically judged by AI
  const [paceReason, setPaceReason] = useState<string>('Natural Conversational');
  const [selectedLang, setSelectedLang] = useState<string>('auto'); // Auto-detect multi-language by default
  const [detectedLang, setDetectedLang] = useState<string>(language === 'kn' ? 'kn' : language === 'en' ? 'en' : 'hi');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [typeQuery, setTypeQuery] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Sync refs so high-frequency audio analysis and async callbacks always read current state
  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isThinkingRef = useRef(false);
  const isMutedRef = useRef(false);
  const voiceSpeedRef = useRef(1.16);
  const selectedLangRef = useRef('auto');
  const isCallActiveRef = useRef(true);

  // VAD & Barge-In tracking refs (Adaptive Noise-Immune Turn Endpointing)
  const userHasSpokenRef = useRef(false);
  const noiseFloorRef = useRef<number>(0.012); // Ambient RMS baseline
  const noiseVoiceBandRef = useRef<number>(12); // Ambient voice-band baseline
  const calibrationSamplesRef = useRef<Array<{ rms: number; voiceBand: number }>>([]);
  const calibrationUntilRef = useRef<number | null>(null);
  const lastSpeechTimeRef = useRef<number | null>(null);
  const turnStartedAtRef = useRef<number | null>(null);
  const consecutiveSpeechFramesRef = useRef<number>(0);
  const consecutiveSilenceFramesRef = useRef<number>(0);
  const bargeInCounterRef = useRef<number>(0);
  const finishTurnLockRef = useRef(false);
  const startingListeningRef = useRef(false);
  const accumulatedTranscriptRef = useRef<string>('');
  const watchdogTimerRef = useRef<any>(null);

  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);
  const vadFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const speechSilenceTimerRef = useRef<any>(null);
  const detectedLangRef = useRef<string>(language === 'kn' ? 'kn' : language === 'en' ? 'en' : 'hi');

  // Keep refs in sync with state
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { voiceSpeedRef.current = voiceSpeed; }, [voiceSpeed]);
  useEffect(() => { selectedLangRef.current = selectedLang; }, [selectedLang]);
  useEffect(() => {
    if (selectedLang !== 'auto') {
      detectedLangRef.current = selectedLang;
      setDetectedLang(selectedLang);
    }
  }, [selectedLang]);

  // Dynamic clinical greeting in patient's preferred or detected language
  const getInitialGreeting = (lang: string, name: string): string => {
    switch (lang) {
      case 'kn':
        return `ನಮಸ್ಕಾರ ${name}! ನಾನು ಡಾ. ವೈದ್ಯ ಅನನ್ಯ ಶರ್ಮಾ ಅವರ AI ಕ್ಲಿನಿಕಲ್ ಸಹಾಯಕ. ನಿಮ್ಮ ಕಾಲಿನ ಗಾಯ ಅಥವಾ ಇತರ ತೊಂದರೆಗಳ ಬಗ್ಗೆ ಮುಕ್ತವಾಗಿ ಮಾತನಾಡಿ, ನಾನು ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ.`;
      case 'en':
        return `Hello ${name}! I am Dr. Vaidya Ananya Sharma's clinical voice assistant at OPD Bay 04. This call is active, please describe your foot ulcer or any symptoms.`;
      case 'mr':
        return `नमस्ते ${name}! मी डॉ. वैद्या अनन्या शर्मा यांची AI क्लिनिकल असिस्टंट आहे. कृपया तुमच्या दुखण्याबद्दल बोला.`;
      case 'te':
        return `నమస్కారం ${name}! నేను డాక్టర్ వైద్య అనన్య శర్మ యొక్క AI క్లినికಲ್ అಸಿస్టెంట్‌ని. మీ సమస్యల గురించి దయచేసి మాట్లాడండి.`;
      case 'ta':
        return `வணக்கம் ${name}! நான் டாக்டர் வைத்யா அனன்யா சர்மாவின் AI மருத்துவ உதவியாளர். உங்கள் புண் அல்லது பிற பிரச்சனைகள் பற்றி பேசுங்கள்.`;
      case 'bn':
        return `নমস্কার ${name}! আমি ড. বৈদ্য অনন্যা শর্মার এআই ক্লিনিক্যাল অ্যাসিস্ট্যান্ট। আপনার সমস্যা নিয়ে কথা বলুন।`;
      case 'gu':
        return `નમસ્તે ${name}! હું ડૉ. વૈદ્ય અનન્યા શર્માની AI ક્લિનિકલ આસિસ્ટન્ટ છું. તમારા સ્વાસ્થ્ય વિશે જણાવો.`;
      default:
        return `नमस्ते ${name}! मैं डॉ. वैद्य अनन्या शर्मा की AI क्लिनिकल असिस्टेंट हूँ। यह फोन कॉल चालू है, कृपया अपने पैर के घाव या तकलीफ के बारे में निसंकोच बोलिए।`;
    }
  };

  const [latestAssistantSpeech, setLatestAssistantSpeech] = useState<string>(() =>
    getInitialGreeting(selectedLang !== 'auto' ? selectedLang : language, participantName)
  );
  const [latestPatientSpeech, setLatestPatientSpeech] = useState<string | null>(null);

  // Phone Call Duration Timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (isCallActiveRef.current) {
        setCallDuration((c) => c + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Stop any active neural audio playback immediately
  const stopAudio = () => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (_) {}
      currentAudioRef.current = null;
    }
    setIsSpeaking(false);
    isSpeakingRef.current = false;
  };

  // High-fidelity neural voice synthesis with Sarvam Bulbul v3 (female 'kavya' voice, pace adjusted)
  const playNeuralVoice = async (text: string, langHint?: string, paceHint?: number) => {
    // Use half-duplex turn-taking: the microphone is fully stopped while TTS is playing.
    // This prevents the assistant's own voice from becoming the next user transcript.
    stopListening();
    if (!soundEnabled || !isCallActiveRef.current) {
      if (isCallActiveRef.current && !isMutedRef.current) {
        setTimeout(() => startListening(), 600);
      }
      return;
    }

    const cleanText = text.replace(/[*#_`[\]]/g, '').trim();
    if (!cleanText) return;

    stopAudio();
    setIsSpeaking(true);
    isSpeakingRef.current = true;

    // Detect language code for TTS
    let targetLang = langHint || selectedLangRef.current;
    if (targetLang === 'auto') {
      if (/[\u0C80-\u0CFF]/.test(cleanText)) targetLang = 'kn';
      else if (/[\u0900-\u097F]/.test(cleanText)) targetLang = 'hi';
      else if (/[\u0B80-\u0BFF]/.test(cleanText)) targetLang = 'ta';
      else if (/[\u0C00-\u0C7F]/.test(cleanText)) targetLang = 'te';
      else if (/[\u0980-\u09FF]/.test(cleanText)) targetLang = 'bn';
      else if (/[\u0A80-\u0AFF]/.test(cleanText)) targetLang = 'gu';
      else if (/^[A-Za-z0-9\s.,!?'"()\-]+$/.test(cleanText)) targetLang = 'en';
      else targetLang = 'hi';
    }

    const paceToUse = paceHint || voiceSpeedRef.current || 1.16;

    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          language: targetLang,
          pace: paceToUse,
          speaker: 'kavya' // Warm, articulate female neural voice
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
          const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
          currentAudioRef.current = audio;
          audio.playbackRate = paceToUse;

          audio.onended = () => {
            setIsSpeaking(false);
            isSpeakingRef.current = false;
            currentAudioRef.current = null;
            // Re-arm the microphone only after playback has completely finished.
            if (isCallActiveRef.current && !isMutedRef.current) {
              setTimeout(() => startListening(), 350);
            }
          };

          audio.onerror = (e) => {
            console.warn('Audio playback error:', e);
            setIsSpeaking(false);
            isSpeakingRef.current = false;
            currentAudioRef.current = null;
            if (isCallActiveRef.current && !isMutedRef.current) {
              setTimeout(() => startListening(), 350);
            }
          };

          await audio.play();
          return;
        }
      }
      setTimeout(() => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        if (isCallActiveRef.current && !isMutedRef.current) {
          setTimeout(() => startListening(), 350);
        }
      }, 1200);
    } catch (e) {
      console.warn('TTS request error:', e);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      if (isCallActiveRef.current && !isMutedRef.current) {
        setTimeout(() => startListening(), 350);
      }
    }
  };

  // Start continuous, hands-free phone call listening with acoustic VAD.
  // The call is intentionally half-duplex: the mic is paused while TTS is playing.
  const startListening = async () => {
    if (isListeningRef.current || startingListeningRef.current || isSpeakingRef.current || isMutedRef.current || !isCallActiveRef.current) return;
    startingListeningRef.current = true;
    setMicPermissionDenied(false);
    setLiveTranscript('');
    accumulatedTranscriptRef.current = '';
    pcmChunksRef.current = [];
    userHasSpokenRef.current = false;
    lastSpeechTimeRef.current = null;
    consecutiveSpeechFramesRef.current = 0;
    consecutiveSilenceFramesRef.current = 0;
    bargeInCounterRef.current = 0;
    finishTurnLockRef.current = false;
    turnStartedAtRef.current = null;
    calibrationSamplesRef.current = [];
    calibrationUntilRef.current = Date.now() + 900;

    // Safety watchdog: enforce both a silence endpoint and a hard maximum turn length.
    if (watchdogTimerRef.current) clearInterval(watchdogTimerRef.current);
    watchdogTimerRef.current = setInterval(() => {
      if (!isListeningRef.current || !isCallActiveRef.current) return;
      if (turnStartedAtRef.current && Date.now() - turnStartedAtRef.current >= 15000) {
        console.log('[Watchdog] Maximum turn duration reached; finalizing audio.');
        stopListeningAndProcess();
        return;
      }
      if (userHasSpokenRef.current && lastSpeechTimeRef.current) {
        const timeSinceLastSpeech = Date.now() - lastSpeechTimeRef.current;
        const currentText = (accumulatedTranscriptRef.current || liveTranscript).trim();
        if (timeSinceLastSpeech >= 1200) {
          console.log('[Watchdog] Finalizing turn after speech cessation:', currentText || '(acoustic turn)');
          stopListeningAndProcess(currentText.length > 1 ? currentText : undefined);
        }
      }
    }, 350);

    // 1. Acquire microphone stream (keep active across call)
    let stream = mediaStreamRef.current;
    if (!stream || !stream.active) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        mediaStreamRef.current = stream;
      } catch (err: any) {
        console.warn('Microphone permission or hardware access denied:', err);
        setMicPermissionDenied(true);
        startingListeningRef.current = false;
        return;
      }
    }

    // 2. Setup Web Audio Analyser for Acoustic VAD, Barge-In, and backup PCM
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx({ sampleRate: 16000 });
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }

      const source = audioCtxRef.current.createMediaStreamSource(stream);
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.2;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const timeData = new Uint8Array(analyser.fftSize);
      const sampleRate = audioCtxRef.current?.sampleRate || 16000;
      const binWidth = sampleRate / analyser.fftSize;

      const updateLevel = () => {
        if (!isCallActiveRef.current || !isListeningRef.current || isSpeakingRef.current) {
          vadFrameRef.current = null;
          return;
        }
        analyser.getByteFrequencyData(dataArray);
        analyser.getByteTimeDomainData(timeData);

        let rmsSum = 0;
        for (let i = 0; i < timeData.length; i++) {
          const normalized = (timeData[i] - 128) / 128;
          rmsSum += normalized * normalized;
        }
        const rms = Math.sqrt(rmsSum / timeData.length);

        // 1. Spectral Voice-Band Weighting: Focus on human vocal formants (250Hz - 3600Hz)
        let voiceBandSum = 0;
        let voiceBandCount = 0;
        let broadbandSum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          broadbandSum += dataArray[i];
          const freq = i * binWidth;
          if (freq >= 250 && freq <= 3600) {
            voiceBandSum += dataArray[i];
            voiceBandCount++;
          }
        }
        const broadbandAvg = broadbandSum / dataArray.length;
        const voiceBandAvg = voiceBandCount > 0 ? voiceBandSum / voiceBandCount : broadbandAvg;

        // Visual UI level (normalized 0-100)
        const level = Math.min(100, Math.round(broadbandAvg * 1.5));
        setAudioLevel(level);

        // 2. Calibrate the room before deciding whether anything is speech.
        // A median baseline is more stable than continuously chasing a fan or keyboard.
        if (calibrationUntilRef.current && Date.now() < calibrationUntilRef.current) {
          calibrationSamplesRef.current.push({ rms, voiceBand: voiceBandAvg });
          vadFrameRef.current = requestAnimationFrame(updateLevel);
          return;
        }
        if (calibrationUntilRef.current) {
          const samples = calibrationSamplesRef.current.slice().sort((a, b) => a.rms - b.rms);
          const midpoint = samples[Math.floor(samples.length / 2)];
          if (midpoint) {
            noiseFloorRef.current = Math.max(0.004, midpoint.rms);
            const voiceSamples = calibrationSamplesRef.current.map((sample) => sample.voiceBand).sort((a, b) => a - b);
            noiseVoiceBandRef.current = Math.max(8, voiceSamples[Math.floor(voiceSamples.length / 2)] || 8);
          }
          calibrationUntilRef.current = null;
          calibrationSamplesRef.current = [];
          console.log('[VAD] Room calibration complete:', {
            rms: noiseFloorRef.current.toFixed(4),
            voiceBand: noiseVoiceBandRef.current.toFixed(1),
          });
        }

        const currentNoiseFloor = noiseFloorRef.current;
        // Speech must exceed both the calibrated energy floor and the calibrated voice band.
        // Separate start/stop thresholds prevent small noise fluctuations from extending a turn.
        const speechOnsetThreshold = Math.max(18, noiseVoiceBandRef.current + 8);
        const speechSilenceThreshold = Math.max(12, noiseVoiceBandRef.current + 3);
        const speechOnsetRms = Math.max(0.018, currentNoiseFloor * 2.1, currentNoiseFloor + 0.008);
        const speechSilenceRms = Math.max(0.010, currentNoiseFloor * 1.35, currentNoiseFloor + 0.003);
        const speechCandidate = voiceBandAvg >= speechOnsetThreshold && rms >= speechOnsetRms;
        const belowSpeechFloor = voiceBandAvg <= speechSilenceThreshold || rms <= speechSilenceRms;

        // ── Acoustic VAD: Speech onset & Turn Endpointing with Hysteresis ──
        if (isListeningRef.current && !isMutedRef.current) {
          if (speechCandidate) {
            consecutiveSpeechFramesRef.current += 1;
            consecutiveSilenceFramesRef.current = 0;

            // Require sustained energy to reject clicks, fans, and isolated noise spikes.
            if (consecutiveSpeechFramesRef.current >= 4) {
              userHasSpokenRef.current = true;
              lastSpeechTimeRef.current = Date.now();
              turnStartedAtRef.current ||= Date.now();
            }
          } else if (belowSpeechFloor) {
            consecutiveSilenceFramesRef.current += 1;
            consecutiveSpeechFramesRef.current = 0;

            // Turn Endpointing: If the user was speaking, and has now been silent
            if (userHasSpokenRef.current && lastSpeechTimeRef.current !== null) {
              const silenceDuration = Date.now() - lastSpeechTimeRef.current;
              // Require a sustained quiet window before finalizing the turn.
              if (silenceDuration > 1000 && consecutiveSilenceFramesRef.current >= 12) {
                console.log(`[VAD] Turn endpoint detected (${silenceDuration}ms silence, noiseFloor=${currentNoiseFloor.toFixed(1)}). Auto-submitting turn.`);
                userHasSpokenRef.current = false;
                lastSpeechTimeRef.current = null;
                consecutiveSpeechFramesRef.current = 0;
                consecutiveSilenceFramesRef.current = 0;
                stopListeningAndProcess();
                return;
              }
            }
          } else {
            // In the hysteresis band (between silence and speech onset):
            // Maintain previous state; do NOT wipe lastSpeechTimeRef!
            consecutiveSpeechFramesRef.current = 0;
          }
        }

        vadFrameRef.current = requestAnimationFrame(updateLevel);
      };
      vadFrameRef.current = requestAnimationFrame(updateLevel);

      const processor = audioCtxRef.current.createScriptProcessor(4096, 1, 1);
      const silentGain = audioCtxRef.current.createGain();
      silentGain.gain.value = 0;
      audioSourceRef.current = source;
      processorRef.current = processor;
      silentGainRef.current = silentGain;
      processor.onaudioprocess = (e) => {
        if (!isListeningRef.current || isMutedRef.current) return;
        const channelData = e.inputBuffer.getChannelData(0);
        pcmChunksRef.current.push(new Float32Array(channelData));
      };
      source.connect(processor);
      // Keep ScriptProcessor alive without routing microphone audio to the speakers.
      processor.connect(silentGain);
      silentGain.connect(audioCtxRef.current.destination);
    } catch (e) {
      console.warn('AudioContext meter setup note:', e);
    }

    isListeningRef.current = true;
    startingListeningRef.current = false;
    setIsListening(true);

    // 3. Use browser SpeechRecognition only for an explicitly selected language.
    // Auto mode must use Sarvam Saaras so the provider can return its detected language.
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && selectedLangRef.current !== 'auto') {
      try {
        const rec = new SpeechRecognition();
        
        // Multi-language locale mapping
        const localeMap: Record<string, string> = {
          kn: 'kn-IN',   // Kannada
          hi: 'hi-IN',   // Hindi
          en: 'en-IN',   // Indian English
          mr: 'mr-IN',   // Marathi
          te: 'te-IN',   // Telugu
          ta: 'ta-IN',   // Tamil
          gu: 'gu-IN',   // Gujarati
          bn: 'bn-IN'    // Bengali
        };
        rec.lang = localeMap[selectedLangRef.current] || 'en-IN';
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        rec.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              accumulatedTranscriptRef.current += ' ' + transcript;
            } else {
              interim += transcript;
            }
          }
          const fullText = (accumulatedTranscriptRef.current + ' ' + interim).trim();
          if (fullText) {
            userHasSpokenRef.current = true;
            setLiveTranscript(fullText);

            userHasSpokenRef.current = true;
            lastSpeechTimeRef.current = Date.now();

            // Turn-taking silence debounce from speech engine (950ms silence after words)
            if (speechSilenceTimerRef.current) {
              clearTimeout(speechSilenceTimerRef.current);
            }
            speechSilenceTimerRef.current = setTimeout(() => {
              if (isListeningRef.current && isCallActiveRef.current && fullText.length > 1) {
                console.log('[STT] Speech recognition silence timeout. Processing turn:', fullText);
                userHasSpokenRef.current = false;
                lastSpeechTimeRef.current = null;
                stopListeningAndProcess(fullText);
              }
            }, 950);
          }
        };

        rec.onerror = (event: any) => {
          if (event.error === 'no-speech') return;
          if (event.error === 'not-allowed') {
            setMicPermissionDenied(true);
            stopListening();
          }
        };

        rec.onend = () => {
          // If browser speech recognition ended and we have captured transcript or active speech, finalize turn!
          const pendingText = (accumulatedTranscriptRef.current || liveTranscript).trim();
          if (pendingText && pendingText.length > 1 && isListeningRef.current && !isSpeakingRef.current && isCallActiveRef.current) {
            console.log('[STT] Speech recognition ended with pending transcript. Auto-submitting turn:', pendingText);
            userHasSpokenRef.current = false;
            lastSpeechTimeRef.current = null;
            stopListeningAndProcess(pendingText);
            return;
          }

          // Otherwise auto-restart if call is still active and listening hands-free
          if (isListeningRef.current && !isSpeakingRef.current && isCallActiveRef.current && !isMutedRef.current) {
            try {
              rec.start();
            } catch (_) {}
          }
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (err) {
        console.warn('Browser SpeechRecognition error, relying on acoustic Sarvam STT:', err);
      }
    }
  };

  // Stop listening without submitting
  const stopListening = () => {
    isListeningRef.current = false;
    setIsListening(false);
    setAudioLevel(0);

    if (vadFrameRef.current !== null) {
      cancelAnimationFrame(vadFrameRef.current);
      vadFrameRef.current = null;
    }

    if (watchdogTimerRef.current) {
      clearInterval(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }

    if (speechSilenceTimerRef.current) {
      clearTimeout(speechSilenceTimerRef.current);
      speechSilenceTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioSourceRef.current) {
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    if (silentGainRef.current) {
      silentGainRef.current.disconnect();
      silentGainRef.current = null;
    }
  };

  // Stop listening and immediately process the captured phrase (Dual-detector pipeline)
  const stopListeningAndProcess = async (textToSubmit?: string) => {
    if (finishTurnLockRef.current) return;
    finishTurnLockRef.current = true;
    stopListening();
    turnStartedAtRef.current = null;
    userHasSpokenRef.current = false;
    lastSpeechTimeRef.current = null;
    const candidateText = (textToSubmit || accumulatedTranscriptRef.current || liveTranscript).trim();
    accumulatedTranscriptRef.current = '';
    setLiveTranscript('');

    if (candidateText && candidateText.length > 1) {
      handleUserSpeech(candidateText);
      return;
    }

    // Secondary layer: Check PCM chunks for Sarvam Saaras v3 acoustic STT
    const chunks = pcmChunksRef.current;
    pcmChunksRef.current = [];
    if (chunks.length > 0) {
      setIsThinking(true);
      isThinkingRef.current = true;
      try {
        let totalLen = 0;
        for (const c of chunks) totalLen += c.length;
        const merged = new Float32Array(totalLen);
        let offset = 0;
        for (const c of chunks) {
          merged.set(c, offset);
          offset += c.length;
        }

        let sumSquares = 0;
        for (let i = 0; i < merged.length; i++) sumSquares += merged[i] * merged[i];
        const rms = Math.sqrt(sumSquares / merged.length);

        // Only send if there was meaningful sound energy (>0.5s of speech)
        if (rms > 0.003 && totalLen > 8000) {
          const currentSampleRate = audioCtxRef.current?.sampleRate || 16000;
          const wavBlob = encodeWAV(merged, currentSampleRate);
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            try {
              const res = await fetch('/api/voice/stt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  audio: base64Audio,
                  language: selectedLangRef.current === 'auto' ? 'unknown' : selectedLangRef.current
                })
              });
              if (res.ok) {
                const data = await res.json();
                if (data.transcript && data.transcript.trim()) {
                  if (data.language_code) {
                    const detectedCode = data.language_code.split('-')[0];
                    detectedLangRef.current = detectedCode;
                    setDetectedLang(detectedCode);
                    handleUserSpeech(data.transcript.trim(), detectedCode);
                  } else {
                    handleUserSpeech(data.transcript.trim(), selectedLangRef.current);
                  }
                  return;
                }
              }
            } catch (err) {
              console.warn('Sarvam STT acoustic fallback error:', err);
            }
            setIsThinking(false);
            isThinkingRef.current = false;
            // Reopen mic for patient
            if (isCallActiveRef.current && !isMutedRef.current) {
              startListening();
            }
          };
          reader.readAsDataURL(wavBlob);
          return;
        }
      } catch (e) {
        console.warn('Audio transcription error:', e);
      }
      setIsThinking(false);
      isThinkingRef.current = false;
      if (isCallActiveRef.current && !isMutedRef.current) {
        startListening();
      }
    } else {
      // Reopen mic if no speech was captured
      if (isCallActiveRef.current && !isMutedRef.current) {
        startListening();
      }
    }
  };

  // Clinical reasoning & conversation via server-side /api/voice/chat (Groq GPT-OSS 20B)
  const handleUserSpeech = async (text: string, spokenLanguage = detectedLangRef.current) => {
    stopListening();
    stopAudio();
    setLatestPatientSpeech(text);
    setIsThinking(true);
    isThinkingRef.current = true;

    try {
      const res = await fetch('/api/voice/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
            language: spokenLanguage || selectedLangRef.current,
          patientName: participantName
        })
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.reply?.trim();
        if (!reply) throw new Error('Groq returned an empty response');
        if (data.detectedLang) {
          detectedLangRef.current = data.detectedLang;
          setDetectedLang(data.detectedLang);
        }
        if (data.pace) {
          setVoiceSpeed(data.pace);
          voiceSpeedRef.current = data.pace;
        }
        if (data.paceReason) {
          setPaceReason(data.paceReason);
        }
        setLatestAssistantSpeech(reply);
        await playNeuralVoice(reply, data.detectedLang || selectedLangRef.current, data.pace);
      } else {
        throw new Error(`Voice chat error (${res.status})`);
      }
    } catch (error) {
      console.warn('Groq voice assistant request failed:', error);
      const unavailableMessage = 'The Groq clinical assistant is temporarily unavailable. Please try again or speak with your care team.';
      setLatestAssistantSpeech(unavailableMessage);
      await playNeuralVoice(unavailableMessage, detectedLangRef.current, 1.05);
    } finally {
      setIsThinking(false);
      isThinkingRef.current = false;
    }
  };

  // Auto-start call with friendly greeting when modal opens
  useEffect(() => {
    isCallActiveRef.current = true;
    const initialGreeting = getInitialGreeting(selectedLang !== 'auto' ? selectedLang : language, participantName);
    setLatestAssistantSpeech(initialGreeting);

    const timer = setTimeout(() => {
      playNeuralVoice(initialGreeting, selectedLang !== 'auto' ? selectedLang : language, 1.16);
    }, 450);

    return () => {
      clearTimeout(timer);
      isCallActiveRef.current = false;
      stopAudio();
      stopListening();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  // Suggested prompt click listener
  useEffect(() => {
    const handlePromptEvent = (e: any) => {
      const promptText = e.detail;
      if (promptText) {
        stopListening();
        stopAudio();
        handleUserSpeech(promptText, selectedLangRef.current);
      }
    };
    window.addEventListener('medikiosk_voice_prompt', handlePromptEvent);
    return () => {
      window.removeEventListener('medikiosk_voice_prompt', handlePromptEvent);
    };
  }, []);

  // Toggle Mute
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    isMutedRef.current = nextMuted;
    if (nextMuted) {
      stopListening();
    } else {
      if (!isSpeakingRef.current && !isThinkingRef.current) {
        startListening();
      }
    }
  };

  // Change language selection
  const changeLanguage = (langCode: string) => {
    setSelectedLang(langCode);
    selectedLangRef.current = langCode;
    if (langCode !== 'auto') {
      setDetectedLang(langCode);
    }
  };

  // End Call & Hang Up
  const handleHangUp = () => {
    isCallActiveRef.current = false;
    stopAudio();
    stopListening();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    onEndCall();
  };

  // Handle typing submit fallback
  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeQuery.trim()) return;
    const q = typeQuery.trim();
    setTypeQuery('');
    handleUserSpeech(q);
  };

  const detectedLangObj =
    CALL_LANGUAGES.find((l) => l.code === detectedLang) ||
    CALL_LANGUAGES.find((l) => l.code === 'hi') ||
    CALL_LANGUAGES[0];

  const effectiveState = isSpeaking
    ? 'speaking'
    : isThinking
    ? 'thinking'
    : isListening
    ? 'listening'
    : 'idle';

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top Banner / Call Connected bar */}
      <div className="w-full max-w-xl flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>OPD Bay 04 • Live Consultation</span>
              <span className="text-[10px] text-slate-400 font-normal">({formatDuration(callDuration)})</span>
            </div>
          </div>
        </div>

        {/* Right Info: Sound & Voice Info */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-full hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 text-xs transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute AI Voice' : 'Unmute AI Voice'}
          >
            {soundEnabled ? <Volume2 size={16} className="text-indigo-600" /> : <VolumeX size={16} className="text-rose-500" />}
          </button>
        </div>
      </div>

      {/* ── Multi-Language Auto-Detection & Adaptive Speed Status Ribbon ── */}
      <div className="w-full max-w-xl mx-auto mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
        {/* Language Pill & Selector */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-full px-2.5 py-1 text-xs shadow-2xs">
          <Languages size={13} className="text-indigo-600 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-700">Language:</span>
          <select
            value={selectedLang}
            onChange={(e) => changeLanguage(e.target.value)}
            className="text-[11px] font-medium text-indigo-700 bg-transparent border-0 focus:ring-0 cursor-pointer pr-1 py-0"
          >
            <option value="auto">🌐 Auto-Detect ({detectedLangObj.name})</option>
            <option value="kn">🇮🇳 Kannada (ಕನ್ನಡ)</option>
            <option value="hi">🇮🇳 Hindi (हिन्दी)</option>
            <option value="en">🌐 English (Indian)</option>
            <option value="mr">🇮🇳 Marathi (मराठी)</option>
            <option value="te">🇮🇳 Telugu (తెలుగు)</option>
            <option value="ta">🇮🇳 Tamil (தமிழ்)</option>
            <option value="gu">🇮🇳 Gujarati (ગુજરાતી)</option>
            <option value="bn">🇮🇳 Bengali (বাংলা)</option>
          </select>
          {selectedLang === 'auto' && (
            <span className="px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-semibold border border-indigo-100">
              Active: {detectedLangObj.native}
            </span>
          )}
        </div>

        {/* AI Judged Adaptive Pacing Badge (Automatic, no manual buttons!) */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-full px-3 py-1 text-xs shadow-2xs">
          <Gauge size={13} className="text-amber-600 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-700">AI Adaptive Pace:</span>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.2 rounded-full border border-amber-200">
            {voiceSpeed}x • {paceReason}
          </span>
        </div>
      </div>

      {/* Permission alert if mic blocked */}
      {micPermissionDenied && (
        <div className="w-full max-w-md mx-auto mb-2.5 p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <MicOff size={15} className="text-amber-600 shrink-0" />
            <span>Microphone access blocked. Please click the lock or camera icon in your address bar to allow mic access.</span>
          </div>
          <button onClick={() => setMicPermissionDenied(false)} className="text-amber-500 hover:text-amber-800 cursor-pointer ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Central Interactive Fluid Voice Orb ── */}
      <div className="relative my-2 flex items-center justify-center">
        {/* Ambient glow responsive to speech */}
        <div
          className={`absolute w-44 h-44 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
            effectiveState === 'speaking'
              ? 'bg-indigo-300/60 scale-125'
              : effectiveState === 'listening'
              ? 'bg-emerald-300/60 scale-115'
              : effectiveState === 'thinking'
              ? 'bg-amber-300/50 scale-105 animate-pulse'
              : 'bg-slate-100/50'
          }`}
        />

        {/* Embedded Friendly Fluid Voice Orb */}
        <FluidVoiceOrb
          isListening={isListening}
          isSpeaking={isSpeaking}
          onClick={isSpeaking ? stopAudio : toggleMute}
          size={104}
        />
      </div>

      <p className="text-[11px] text-slate-400 font-medium mb-2">
        {isSpeaking
          ? 'Doctor is speaking • Speak over to interrupt naturally (AI goes silent automatically)'
          : isMuted
          ? 'Microphone muted • Tap unmute to speak'
          : 'Hands-free phone call mode • Speak naturally, AI auto-detects when you finish'}
      </p>

      {/* Audio Wave Visualizer Bars */}
      <div className="w-52 h-7 flex items-center justify-center gap-1.5 mb-3">
        {[20, 36, 16, 44, 18, 32, 16].map((h, i) => {
          const dynamicHeight = isSpeaking
            ? Math.max(8, Math.min(32, Math.round(h * 0.7)))
            : isListening
            ? Math.max(6, Math.min(30, Math.round((audioLevel / 100) * h * 0.8 + 6)))
            : '5px';
          return (
            <span
              key={i}
              style={{
                height: typeof dynamicHeight === 'number' ? `${dynamicHeight}px` : dynamicHeight,
                transition: 'height 0.08s ease-in-out'
              }}
              className={`w-1.5 rounded-full transition-all ${
                isSpeaking
                  ? 'bg-indigo-600 animate-pulse'
                  : isListening
                  ? 'bg-emerald-500 shadow-xs'
                  : 'bg-slate-300'
              }`}
            />
          );
        })}
      </div>

      {/* ── Dialogue Bubbles ── */}
      <div className="max-w-xl w-full space-y-2.5 px-2 mb-3">
        {/* Live speech as patient is actively talking */}
        {isListening && (
          <div className="bg-emerald-50/95 border border-emerald-300 shadow-2xs px-4 py-2.5 rounded-2xl text-xs text-emerald-950 ml-auto max-w-[90%] text-right animate-in fade-in">
            <div className="flex items-center justify-end gap-1.5 mb-1 text-[10px] font-bold text-emerald-700 uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Hearing you live in {selectedLang === 'auto' ? 'Kannada / Hindi / English' : detectedLangObj.name}...</span>
            </div>
            <p className="font-semibold text-slate-800 text-[13px] leading-snug">
              {liveTranscript || 'Listening... Speak freely in Kannada, Hindi, or English (e.g. "ನನ್ನ ಕಾಲಿನಲ್ಲಿ ನೋವಿದೆ" or "Pair me dard hai")'}
            </p>
            {liveTranscript && (
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => stopListeningAndProcess(liveTranscript)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Send size={11} />
                  <span>Done Speaking (Submit Now)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {latestPatientSpeech && (
          <div className="bg-slate-100 border border-slate-200/90 px-4 py-2 rounded-2xl text-xs text-slate-700 ml-auto max-w-[85%] text-right">
            <span className="font-semibold text-slate-900 block text-[10px] uppercase">
              You ({participantName}):
            </span>
            "{latestPatientSpeech}"
          </div>
        )}

        {/* Assistant Speech Bubble */}
        <div className="bg-white border border-slate-200/90 shadow-2xs px-4 py-3 rounded-2xl text-xs text-slate-800 leading-relaxed text-left">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-indigo-700 text-xs flex items-center gap-1.5">
              <Sparkles size={12} className="text-indigo-600" />
              <span>Dr. Sharma's Assistant (Kavya Voice):</span>
            </span>
            {isSpeaking && (
              <span className="text-[10px] text-indigo-600 font-bold animate-pulse flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                <Volume2 size={11} /> Speaking @ {voiceSpeed}x ({paceReason})
              </span>
            )}
          </div>
          <p className="text-slate-800 text-[13px] font-medium leading-relaxed">
            {latestAssistantSpeech}
          </p>
        </div>
      </div>

      {/* ── State Badge ── */}
      <div className="mb-4">
        {isListening ? (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>🟢 Phone Line Open • Speak naturally (Auto-Processes when you stop)</span>
          </div>
        ) : isThinking ? (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold bg-amber-50 text-amber-800 border-amber-300 shadow-2xs">
            <Loader2 size={13} className="animate-spin text-amber-600" />
            <span>Sarvam 105B Reasoning &amp; Judging Pacing...</span>
          </div>
        ) : isSpeaking ? (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold bg-indigo-50 text-indigo-800 border-indigo-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>Assistant Speaking ({voiceSpeed}x - {paceReason})</span>
          </div>
        ) : isMuted ? (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold bg-rose-50 text-rose-800 border-rose-200">
            <MicOff size={13} />
            <span>Microphone Muted • Tap Unmute to Resume Speaking</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold bg-slate-100 text-slate-700 border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Call Connected • Ready for Symptoms</span>
          </div>
        )}
      </div>

      {/* ── Phone Call Action Bar (Clean, Minimal Phone Controls) ── */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mb-3">
        {/* Mute / Unmute Button */}
        <button
          onClick={toggleMute}
          className={`h-11 px-4 rounded-full flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
            isMuted
              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md ring-2 ring-amber-400'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
          <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
        </button>

        {/* Switch to Touch Mode */}
        <button
          onClick={onSwitchToTouch}
          className="h-11 px-4 rounded-full bg-blue-50 hover:bg-blue-100 text-[#4865ff] border border-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
        >
          <Touchpad size={14} />
          <span>Touch Mode</span>
        </button>

        {/* View Prescription Note */}
        <button
          onClick={onOpenReport}
          className="h-11 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <FileText size={14} className="text-indigo-600" />
          <span>View Rx</span>
        </button>

        {/* Red Hang Up / End Call Button */}
        <button
          onClick={handleHangUp}
          className="h-11 px-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-rose-500/25 transition-all cursor-pointer"
        >
          <PhoneOff size={15} />
          <span>End Call</span>
        </button>
      </div>

      {/* Alternative: Type Query Input Strip */}
      <form onSubmit={handleTypeSubmit} className="w-full max-w-xl flex items-center gap-2 mt-1">
        <input
          type="text"
          value={typeQuery}
          onChange={(e) => setTypeQuery(e.target.value)}
          placeholder="Or type in Kannada (ಕನ್ನಡ), Hindi (हिन्दी), or English..."
          className="flex-1 bg-white border border-slate-200/90 rounded-full px-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#4865ff] shadow-2xs"
        />
        <button
          type="submit"
          className="h-9 px-4 rounded-full bg-[#4865ff] hover:bg-[#3852e6] text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
        >
          <Send size={13} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
/** Inner component subscribed to the LiveKit WebRTC voice assistant */
function ActiveVoiceAssistantContent({
  onEndCall,
  onOpenReport,
  onFallbackToDirectVoice
}: {
  onEndCall: () => void;
  onOpenReport: () => void;
  onFallbackToDirectVoice?: () => void;
}) {
  const { state, audioTrack, agentTranscriptions } = useVoiceAssistant();
  const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const room = useRoomContext();

  // Watchdog: If no LiveKit agent worker joins the room within 4.5s, auto-switch to Direct Neural Voice
  useEffect(() => {
    if (remoteParticipants.length === 0) {
      const timer = setTimeout(() => {
        if (remoteParticipants.length === 0 && onFallbackToDirectVoice) {
          console.info('[VoiceAgent] No LiveKit agent worker detected in room after 4.5s. Seamlessly activating Direct Neural Voice.');
          onFallbackToDirectVoice();
        }
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [remoteParticipants.length, onFallbackToDirectVoice]);

  // Ensure AudioContext is unlocked in browser for WebRTC voice playback
  useEffect(() => {
    if (room) {
      room.startAudio().catch(() => {});
    }
  }, [room]);

  const toggleMic = () => {
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    }
  };

  // Determine effective status
  const hasAgent = remoteParticipants.length > 0;
  const isAgentSpeaking = state === 'speaking' || remoteParticipants.some((p) => p.isSpeaking);
  const effectiveState: string =
    state !== 'connecting'
      ? state
      : isAgentSpeaking
      ? 'speaking'
      : hasAgent
      ? 'listening'
      : 'connecting';

  // Calm State Badge Styles
  const stateLabels: Record<string, { label: string; color: string; dot: string }> = {
    listening: {
      label: 'Listening to you...',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
      dot: 'bg-emerald-500'
    },
    thinking: {
      label: 'Groq GPT-OSS 20B Clinical Reasoning...',
      color: 'text-amber-700 bg-amber-50 border-amber-200/80',
      dot: 'bg-amber-500'
    },
    speaking: {
      label: "Dr. Sharma's Assistant is Asking",
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200/80',
      dot: 'bg-indigo-500'
    },
    connecting: {
      label: 'Connecting to OPD Bay 04...',
      color: 'text-slate-600 bg-slate-100 border-slate-200',
      dot: 'bg-slate-400'
    },
    disconnected: {
      label: 'Consultation Finished',
      color: 'text-rose-700 bg-rose-50 border-rose-200',
      dot: 'bg-rose-500'
    },
  };

  const currentStatus =
    stateLabels[effectiveState] || {
      label: 'Ready for Symptoms',
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      dot: 'bg-indigo-500'
    };

  // Latest transcription text if any
  const latestTranscript = agentTranscriptions?.length
    ? agentTranscriptions[agentTranscriptions.length - 1]?.text
    : null;

  return (
    <div className="w-full flex flex-col items-center py-3">
      {/* Friendly Speaker Pill */}
      <div className="mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-600">
          <Stethoscope size={12} className="text-indigo-600" />
          <span>Clinical Anamnesis with Dr. Vaidya Ananya Sharma's Assistant</span>
        </div>
      </div>

      {/* Central Interactive Fluid Voice Orb */}
      <div className="relative mb-5 flex items-center justify-center">
        {/* Soft calm ambient light aura */}
        <div
          className={`absolute w-44 h-44 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
            effectiveState === 'speaking'
              ? 'bg-indigo-200/60 scale-125'
              : effectiveState === 'listening'
              ? 'bg-emerald-200/50 scale-110'
              : effectiveState === 'thinking'
              ? 'bg-amber-200/40 scale-105 animate-pulse'
              : 'bg-slate-100/40'
          }`}
        />

        {/* Embedded Friendly Fluid Voice Orb */}
        <FluidVoiceOrb
          isListening={effectiveState === 'listening'}
          isSpeaking={effectiveState === 'speaking' || isAgentSpeaking}
          onClick={toggleMic}
          size={104}
        />
      </div>

      {/* Real-time LiveKit Bar Visualizer in calm slate/indigo */}
      <div className="w-48 h-8 flex items-center justify-center mb-3">
        {audioTrack ? (
          <BarVisualizer
            state={effectiveState as any}
            trackRef={audioTrack}
            barCount={7}
            className="w-full h-7 text-indigo-600"
          />
        ) : (
          <div className="flex items-center gap-1.5 h-5">
            <span className="w-1.5 h-3 rounded-full bg-slate-300 animate-pulse" />
            <span className="w-1.5 h-6 rounded-full bg-indigo-400 animate-pulse delay-75" />
            <span className="w-1.5 h-4 rounded-full bg-slate-300 animate-pulse delay-150" />
            <span className="w-1.5 h-7 rounded-full bg-indigo-500 animate-pulse delay-100" />
            <span className="w-1.5 h-2 rounded-full bg-slate-300 animate-pulse delay-200" />
          </div>
        )}
      </div>

      {/* Spoken Question / Dialogue Bubble */}
      <div className="max-w-md w-full text-center px-4 mb-3">
        {latestTranscript ? (
          <div className="bg-white border border-slate-200/90 shadow-2xs px-4 py-2.5 rounded-2xl text-xs text-slate-700 leading-relaxed animate-in fade-in">
            <span className="font-semibold text-indigo-600 block mb-0.5 text-[11px]">
              Dr. Sharma's Assistant:
            </span>
            "{latestTranscript}"
          </div>
        ) : (
          <div className="bg-white/80 border border-slate-200/60 px-4 py-2 rounded-2xl text-[11px] text-slate-500 leading-relaxed">
            Assistant is ready. Tap the orb or speak to record your symptoms.
          </div>
        )}
      </div>

      {/* Calm State Badge */}
      <div
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold mb-5 transition-all duration-300 shadow-2xs ${currentStatus.color}`}
      >
        <span className={`w-2 h-2 rounded-full ${currentStatus.dot} animate-ping`} />
        <span>{currentStatus.label}</span>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center gap-3">
        {/* Hidden browser audio unlock */}
        <StartAudio label="Click to unmute sound" className="hidden" />

        {/* Mic toggle */}
        <button
          onClick={toggleMic}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isMicrophoneEnabled
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 shadow-2xs'
              : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
          }`}
          title={isMicrophoneEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {isMicrophoneEnabled ? <Mic size={18} /> : <MicOff size={18} />}
        </button>

        {/* View Doctor Prescription Note Button */}
        <button
          onClick={onOpenReport}
          className="px-4 h-11 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
        >
          <FileText size={15} />
          <span>View Prescription Note</span>
        </button>

        {/* End Voice Call Button */}
        <button
          onClick={onEndCall}
          className="px-5 h-11 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs tracking-wide flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
        >
          <PhoneOff size={15} />
          <span>End Call &amp; File Intake</span>
        </button>
      </div>
    </div>
  );
}
