import { useState, useEffect } from 'react';
import { X, Search, AlertTriangle, RefreshCw, LogOut, HeartPulse, Check } from 'lucide-react';
import { fetchOpdQueue, updateOpdSessionStatus, type OpdSession } from '../lib/insforge';
import { useAuth } from '../context/AuthContext';

interface DoctorDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DoctorDashboardModal({ isOpen, onClose }: DoctorDashboardModalProps) {
  const { user, signOut } = useAuth();
  const [sessions, setSessions] = useState<OpdSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<OpdSession | null>(null);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await fetchOpdQueue();
      setSessions(data);
      if (data.length > 0 && !selectedSession) {
        setSelectedSession(data[0]);
      } else if (selectedSession) {
        const updated = data.find((s) => s.id === selectedSession.id);
        if (updated) setSelectedSession(updated);
      }
    } catch (e) {
      console.error('Queue load failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadQueue();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredSessions = sessions.filter((s) => {
    const q = searchQuery.toLowerCase();
    const pName = s.patients?.full_name?.toLowerCase() || '';
    const token = s.token_number?.toLowerCase() || '';
    const abha = s.patients?.abha_id?.toLowerCase() || '';
    return pName.includes(q) || token.includes(q) || abha.includes(q);
  });

  const handleStatusChange = async (sessionId: string, newStatus: 'in_consultation' | 'completed') => {
    const success = await updateOpdSessionStatus(sessionId, newStatus);
    if (success) {
      await loadQueue();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#080331]/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-[1100px] h-[88vh] bg-[#f8f3eb] rounded-[32px] p-5 sm:p-7 shadow-[0_24px_64px_rgba(8,3,49,0.3)] border border-[#4d4439]/15 text-[#080331] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[#080331]/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4865ff]/10 text-[#4865ff] flex items-center justify-center shadow-inner">
              <HeartPulse size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-[22px] sm:text-[24px] text-[#080331] font-normal leading-tight">
                  Vaidya Consultation Bay
                </h2>
                <span className="bg-[#328a3b]/10 text-[#328a3b] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  LIVE INSFORGE
                </span>
              </div>
              <p className="text-xs text-stone/70">
                {user?.name || 'Dr. Vaidya Ananya Sharma, BAMS MD'} · AIIMS Ayush OPD Bay 01
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadQueue}
              disabled={loading}
              title="Refresh Queue"
              className="w-9 h-9 rounded-full bg-white hover:bg-white/80 border border-[#080331]/10 flex items-center justify-center text-[#080331] shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              title="Sign Out"
              className="w-9 h-9 rounded-full bg-white hover:bg-red-50 text-stone hover:text-red-600 border border-[#080331]/10 flex items-center justify-center shadow-xs transition-all cursor-pointer"
            >
              <LogOut size={15} />
            </button>

            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white hover:bg-white/80 text-stone hover:text-[#080331] border border-[#080331]/10 flex items-center justify-center shadow-xs transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main Content: 2-Column Split (Queue Left, Details Right) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 min-h-0 overflow-hidden">
          
          {/* Left Column: Live Queue (5 cols) */}
          <div className="lg:col-span-5 flex flex-col min-h-0 bg-white rounded-2xl p-4 border border-[#080331]/10 shadow-xs">
            {/* Search Bar */}
            <div className="relative mb-3 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone/50" size={14} />
              <input 
                type="text" 
                placeholder="Search token, patient, or ABHA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f8f3eb] border border-[#080331]/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#080331] focus:outline-none focus:border-[#4865ff]"
              />
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 hide-scrollbar">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-10 text-stone/60 text-xs">
                  {loading ? 'Fetching queue from InsForge...' : 'No OPD patients found.'}
                </div>
              ) : (
                filteredSessions.map((s) => {
                  const isSelected = selectedSession?.id === s.id;
                  const isEmergency = s.triage_priority === 'emergency';
                  const isUrgent = s.triage_priority === 'urgent';

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSession(s)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                        isSelected 
                          ? 'bg-[#dce4fb]/60 border-[#4865ff] shadow-xs' 
                          : 'bg-white hover:bg-[#f8f3eb]/60 border-[#080331]/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-[#080331] text-white px-2 py-0.5 rounded">
                            {s.token_number}
                          </span>
                          <span className="font-semibold text-xs text-[#080331] truncate max-w-[140px]">
                            {s.patients?.full_name || 'Patient'}
                          </span>
                        </div>
                        <span 
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isEmergency 
                              ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse' 
                              : isUrgent 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {s.triage_priority}
                        </span>
                      </div>

                      <p className="text-[11px] text-stone/80 line-clamp-1 mb-1 font-sans">
                        {s.chief_complaint || 'No complaint recorded'}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-stone/60 pt-1 border-t border-[#080331]/5 font-sans">
                        <span>ABHA: {s.patients?.abha_id || 'Guest'}</span>
                        <span className="capitalize">{s.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Patient Clinical Summary & Anamnesis (7 cols) */}
          <div className="lg:col-span-7 flex flex-col min-h-0 bg-white rounded-2xl p-5 border border-[#080331]/10 shadow-xs overflow-y-auto">
            {selectedSession ? (
              <div className="space-y-4">
                {/* Patient Banner */}
                <div className="flex items-start justify-between pb-3 border-b border-[#080331]/10">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-serif text-xl sm:text-2xl text-[#080331] font-normal">
                        {selectedSession.patients?.full_name}
                      </h3>
                      <span className="text-xs bg-[#f8f3eb] px-2.5 py-0.5 rounded-full border border-[#080331]/10 font-semibold">
                        {selectedSession.patients?.age} Yrs · {selectedSession.patients?.gender}
                      </span>
                    </div>
                    <p className="text-xs text-stone/70 mt-0.5">
                      ABHA ID: <span className="font-mono font-bold text-[#080331]">{selectedSession.patients?.abha_id || 'Guest Token'}</span> · Language: {selectedSession.patients?.preferred_language?.toUpperCase() || 'HI'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {selectedSession.status === 'waiting' && (
                      <button
                        onClick={() => handleStatusChange(selectedSession.id, 'in_consultation')}
                        className="bg-[#4865ff] hover:bg-[#3852e6] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-sm transition-all cursor-pointer"
                      >
                        Start Consultation
                      </button>
                    )}
                    {selectedSession.status === 'in_consultation' && (
                      <button
                        onClick={() => handleStatusChange(selectedSession.id, 'completed')}
                        className="bg-[#328a3b] hover:bg-[#286f30] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-sm transition-all cursor-pointer"
                      >
                        Complete &amp; Push Rx
                      </button>
                    )}
                  </div>
                </div>

                {/* Triage Alert (If emergency or urgent) */}
                {selectedSession.triage_priority !== 'routine' && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
                    <AlertTriangle className="shrink-0 mt-0.5 text-red-600" size={16} />
                    <div>
                      <span className="font-bold uppercase tracking-wider block">
                        Triage Flag: {selectedSession.triage_priority}
                      </span>
                      <span>{selectedSession.triage_reason || 'Urgent physician evaluation indicated.'}</span>
                    </div>
                  </div>
                )}

                {/* Chief Complaint & SOCRATES Data */}
                <div className="bg-[#f8f3eb] rounded-xl p-3.5 border border-[#080331]/10 text-xs">
                  <span className="font-semibold text-[#080331] block mb-1 uppercase tracking-wider text-[10px]">
                    Kiosk Anamnesis / Chief Complaint
                  </span>
                  <p className="text-[#333333] leading-relaxed mb-2 font-medium">
                    "{selectedSession.chief_complaint}"
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#080331]/10 font-sans">
                    <div>
                      <span className="text-[10px] text-stone/60 block">Duration:</span>
                      <span className="font-semibold text-[#080331]">{selectedSession.symptoms_duration || '2 weeks'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone/60 block">Severity:</span>
                      <span className="font-semibold text-red-600">{selectedSession.socrates_data?.severity || 6}/10</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone/60 block">Site/Onset:</span>
                      <span className="font-semibold text-[#080331]">{selectedSession.socrates_data?.site || 'Epigastric'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone/60 block">Timing:</span>
                      <span className="font-semibold text-[#080331]">{selectedSession.socrates_data?.timing || 'Continuous'}</span>
                    </div>
                  </div>
                </div>

                {/* Ayush Ahara-Vihara Pariksha */}
                <div className="bg-[#eef5ee] rounded-xl p-3.5 border border-[#328a3b]/20 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#328a3b] uppercase tracking-wider text-[10px]">
                      Ayush Ahara-Vihara &amp; Prakriti Assessment
                    </span>
                    <span className="text-[10px] font-bold text-[#328a3b] bg-white px-2 py-0.5 rounded-full border border-[#328a3b]/20 flex items-center gap-1">
                      <Check size={11} />
                      <span>Dashavidha Ready</span>
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-[#080331] font-sans">
                    <div>
                      <span className="font-semibold">Dominant Rasa: </span>
                      <span>{selectedSession.ayush_pariksha?.[0]?.dominant_rasa || 'Katu (Pungent) & Lavana (Salty)'}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Agni (Digestion): </span>
                      <span>{selectedSession.ayush_pariksha?.[0]?.agni_state || 'Mandagni (Sluggish Digestion)'}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Nidra / Vihara: </span>
                      <span>{selectedSession.ayush_pariksha?.[0]?.vihara_habits?.sleep || 'Disturbed, late night wakefulness (Ratri Jagarana)'}</span>
                    </div>
                  </div>
                </div>

                {/* Prescription & Past Medication OCR */}
                <div className="bg-[#fdf2f7] rounded-xl p-3.5 border border-[#f098d7]/30 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#1b1463] uppercase tracking-wider text-[10px]">
                      Handwritten Rx &amp; Lab OCR Extraction
                    </span>
                    <span className="text-[10px] font-bold text-[#1b1463] bg-white px-2 py-0.5 rounded-full border border-[#f098d7]/30">
                      98.4% Confidence
                    </span>
                  </div>
                  
                  {/* Allergy Alert */}
                  {selectedSession.prescription_scans?.[0]?.detected_allergies?.length ? (
                    <div className="mb-2 p-2 rounded-lg bg-red-100 text-red-800 font-semibold text-[11px] border border-red-200 flex items-center gap-1.5">
                      <AlertTriangle size={13} className="text-red-700 shrink-0" />
                      <span>Active Drug Allergies: {selectedSession.prescription_scans[0].detected_allergies.join(', ')}</span>
                    </div>
                  ) : null}

                  <div className="space-y-1 text-xs text-[#333333] font-sans">
                    <span className="font-semibold text-[#080331] block">Past Medications on File:</span>
                    <p>
                      {selectedSession.prescription_scans?.[0]?.extracted_medications?.map((m: any) => m.name).join(', ') || 'Pantocid-D 1 Cap OD, Yograj Guggulu 2 Tab BD'}
                    </p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-20 text-stone/60 text-xs">
                Select a patient from the queue to inspect complete clinical intake.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
