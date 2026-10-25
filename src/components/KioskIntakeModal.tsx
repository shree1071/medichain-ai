import { useState, useEffect } from 'react';
import { X, Mic, CheckCircle, Globe, ArrowRight, ArrowLeft, Loader2, Sparkles, Check, AlertTriangle } from 'lucide-react';
import { createKioskIntake } from '../lib/insforge';
import { useLanguage } from '../context/LanguageContext';
import TouchHistoryEngine, { type HistoryTakingResult } from './TouchHistoryEngine';
import LanguageSelector from './LanguageSelector';

interface KioskIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIntakeComplete?: () => void;
  initialStep?: 1 | 2 | 3 | 4;
  defaultAnamnesisMode?: 'touch' | 'voice';
}

export default function KioskIntakeModal({ 
  isOpen, 
  onClose, 
  onIntakeComplete,
  initialStep = 1,
  defaultAnamnesisMode = 'touch'
}: KioskIntakeModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialStep);
  const [submitting, setSubmitting] = useState(false);
  const [completedToken, setCompletedToken] = useState<string | null>(null);

  const { language, t } = useLanguage();
  const [anamnesisMode, setAnamnesisMode] = useState<'touch' | 'voice'>(defaultAnamnesisMode);
  const [isRedFlagDetected, setIsRedFlagDetected] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
      setAnamnesisMode(defaultAnamnesisMode);
    }
  }, [isOpen, initialStep, defaultAnamnesisMode]);

  // Form State
  const [fullName, setFullName] = useState('Govind Narain');
  const [age, setAge] = useState('52');
  const [gender, setGender] = useState('Male');
  const [abhaId, setAbhaId] = useState('91-3829-5512');

  const [chiefComplaint, setChiefComplaint] = useState('Severe hyperacidity with retrosternal burning and joint stiffness');
  const [duration, setDuration] = useState('2 months');
  const [severity, setSeverity] = useState(7);
  const [isRecording, setIsRecording] = useState(false);

  const [dominantRasa, setDominantRasa] = useState('Katu (Pungent) & Lavana (Salty)');
  const [agniState, setAgniState] = useState('Mandagni (Sluggish Digestion)');
  const [sleepState, setSleepState] = useState('Ratri Jagarana (Late Night Awakening)');

  const [rxMeds, setRxMeds] = useState('Pantocid-D 1 Cap OD, Yograj Guggulu 2 Tab BD');
  const [allergies, setAllergies] = useState('Sulfa Drugs');
  const [instantSummary, setInstantSummary] = useState<any>(null);
  const [structuredNotes, setStructuredNotes] = useState<string>('');

  const handleTouchHistoryComplete = (result: HistoryTakingResult) => {
    setChiefComplaint(result.chiefComplaint);
    setDuration(result.onsetDuration);
    setSeverity(result.severity);
    setDominantRasa(result.dominantRasa);
    setAgniState(result.agni);
    setSleepState(result.vihara);
    if (result.isRedFlag) {
      setIsRedFlagDetected(true);
    }
    if (result.instantClinicalSummary) {
      setInstantSummary(result.instantClinicalSummary);
    }
    if (result.structuredNotes) {
      setStructuredNotes(result.structuredNotes);
    }
    setStep(3);
  };

  if (!isOpen) return null;

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setChiefComplaint('Pet mein bohot jalan hoti hai khane ke baad, aur subah hath-pair ke jodon mein bohot jakdan rehti hai.');
      }, 2500);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await createKioskIntake({
        patient: {
          full_name: fullName,
          age: parseInt(age) || 45,
          gender,
          abha_id: abhaId || undefined,
          preferred_language: language,
        },
        session: {
          chief_complaint: chiefComplaint,
          symptoms_duration: duration,
          department: 'Kayachikitsa (Internal Ayush)',
          triage_priority: isRedFlagDetected || severity >= 8 ? 'emergency' : severity >= 5 ? 'urgent' : 'routine',
          triage_reason: isRedFlagDetected ? 'Emergency Red Flag detected during anamnesis' : severity >= 8 ? 'High acute severity intake' : 'Standard pre-consultation intake',
          socrates_data: {
            severity,
            duration,
            structured_notes: structuredNotes,
            instant_clinical_summary: instantSummary
          },
          voice_transcript: structuredNotes || chiefComplaint,
        },
        ayush: {
          dominant_rasa: dominantRasa,
          agni_state: agniState,
          vihara_habits: { sleep: sleepState },
        },
        prescription: {
          prescribing_doctor: 'Past Hospital OPD',
          diagnosis_found: 'Amlapitta & Sandhivata',
          extracted_medications: [{ name: 'Pantocid-D', dosage: '1 Cap OD' }, { name: 'Yograj Guggulu', dosage: '2 Tab BD' }],
          detected_allergies: allergies.split(',').map((s) => s.trim()),
          ocr_confidence: 98.4,
        },
      });

      if (res.success && res.token_number) {
        setCompletedToken(res.token_number);
        if (onIntakeComplete) onIntakeComplete();
      } else {
        alert(res.error || 'Failed to submit intake. Please try again.');
      }
    } catch (e: any) {
      alert(e?.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setCompletedToken(null);
    setStep(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080331]/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-[680px] bg-white rounded-2xl p-6 sm:p-8 shadow-[0_8px_40px_rgba(8,3,49,0.12)] border border-slate-200/80 text-[#080331] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={resetAndClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-stone hover:text-[#080331] flex items-center justify-center transition-all border border-[#080331]/10 shadow-xs cursor-pointer"
        >
          <X size={18} />
        </button>

        {completedToken ? (
          /* Success Screen */
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-[#328a3b]/15 text-[#328a3b] mx-auto flex items-center justify-center mb-4">
              <CheckCircle size={36} />
            </div>
            <h2 className="font-sans text-2xl text-slate-900 font-semibold mb-1">
              Intake Completed!
            </h2>
            <p className="text-xs sm:text-sm text-stone/80 mb-6 font-sans">
              Clinical summary, Ahara-Vihara pariksha, and Rx OCR synced to Doctor Bay.
            </p>

            <div className="bg-white rounded-2xl p-6 border border-[#328a3b]/20 shadow-sm max-w-[320px] mx-auto mb-6">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-stone/60">Your OPD Token</span>
              <div className="font-sans text-[48px] text-[#1C1917] font-bold leading-tight my-1">
                {completedToken}
              </div>
              <span className="inline-flex items-center gap-1 bg-[#328a3b]/10 text-[#328a3b] font-bold text-xs px-3 py-1 rounded-full">
                ● Ready for Doctor
              </span>
            </div>

            <button
              onClick={resetAndClose}
              className="bg-[#1C1917] hover:bg-[#2E2824] text-white font-medium text-sm px-8 py-3 rounded-full shadow-md transition-all cursor-pointer"
            >
              Done / Return to Home
            </button>
          </div>
        ) : (
          /* Multi-Step Intake Form */
          <div>
            {/* Stepper Header */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#8C5D36] uppercase">
                  STEP {step} OF 4
                </span>
                <h3 className="font-sans text-lg text-slate-900 font-semibold mt-0.5">
                  {step === 1 && t('kiosk.step1', 'Patient ID & Language')}
                  {step === 2 && (anamnesisMode === 'touch' ? t('kiosk.step2', 'Clinical Anamnesis') : 'Bhashini Voice Anamnesis')}
                  {step === 3 && t('kiosk.step3', 'Ayush Ahara-Vihara')}
                  {step === 4 && t('kiosk.step4', 'Past Prescription OCR')}
                </h3>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((s) => (
                  <div 
                    key={s} 
                    className={`h-1.5 rounded-full transition-all ${
                      s === step ? 'w-6 bg-[#1C1917]' : s < step ? 'w-2 bg-emerald-500' : 'w-2 bg-slate-200'
                    }`} 
                  />
                ))}
              </div>
            </div>

            {/* Step 1: Patient Identity */}
            {step === 1 && (
              <div className="space-y-4 font-sans text-xs sm:text-sm">
                <div>
                  <label className="block text-xs font-semibold text-[#080331] mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white border border-[#080331]/15 rounded-xl px-3.5 py-2 text-[#080331] focus:outline-none focus:border-[#8C5D36]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#080331] mb-1">Age</label>
                    <input 
                      type="number" 
                      value={age} 
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-white border border-[#080331]/15 rounded-xl px-3.5 py-2 text-[#080331] focus:outline-none focus:border-[#8C5D36]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#080331] mb-1">Gender</label>
                    <select 
                      value={gender} 
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-white border border-[#080331]/15 rounded-xl px-3.5 py-2 text-[#080331] focus:outline-none focus:border-[#8C5D36]"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#080331] mb-1">ABHA Health ID / Token</label>
                  <input 
                    type="text" 
                    value={abhaId} 
                    onChange={(e) => setAbhaId(e.target.value)}
                    placeholder="e.g. 91-8291-3829"
                    className="w-full bg-white border border-[#080331]/15 rounded-xl px-3.5 py-2 text-[#080331] focus:outline-none focus:border-[#8C5D36]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#080331] mb-1.5 flex items-center justify-between">
                    <span>Intake Mother Tongue / भाषा चुनें</span>
                    <span className="text-[10px] text-indigo-600 font-semibold">11 Indic Languages</span>
                  </label>
                  <LanguageSelector variant="modal-bar" />
                </div>
              </div>
            )}

            {/* Step 2: Multimodal Anamnesis (Touch MCQ & Type + Voice) */}
            {step === 2 && (
              <div className="space-y-4 font-sans text-xs sm:text-sm">
                {/* Mode Selector Pill */}
                <div className="flex items-center p-1 bg-white rounded-full border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setAnamnesisMode('touch')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      anamnesisMode === 'touch'
                        ? 'bg-[#1C1917] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles size={13} />
                    <span>{t('touch.modeTouch', 'Adaptive Quiz (Touch & Bhashini)')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnamnesisMode('voice')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      anamnesisMode === 'voice'
                        ? 'bg-[#1C1917] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Mic size={13} />
                    <span>{t('touch.modeVoice', 'Bhashini Voice ASR')}</span>
                  </button>
                </div>

                {anamnesisMode === 'touch' ? (
                  <TouchHistoryEngine
                    patientName={fullName}
                    onComplete={handleTouchHistoryComplete}
                  />
                ) : (
                  <div className="space-y-4 font-sans text-xs sm:text-sm">
                    <div className="bg-white rounded-2xl p-4 border border-[#080331]/10 text-center">
                      <span className="inline-flex items-center gap-1.5 bg-[#8C5D36]/10 text-[#8C5D36] text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-3">
                        <Globe size={12} />
                        <span>BHASHINI ASR ENGINE</span>
                      </span>
                      <div className="mb-3">
                        <button
                          type="button"
                          onClick={handleVoiceToggle}
                          className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center transition-all shadow-md cursor-pointer ${
                            isRecording 
                              ? 'bg-red-500 text-white animate-pulse shadow-red-300' 
                              : 'bg-[#1C1917] hover:bg-[#2E2824] text-white'
                          }`}
                        >
                          <Mic size={24} />
                        </button>
                      </div>
                      <p className="text-xs text-stone/70">
                        {isRecording ? 'Listening in Hindi/Tamil... Speak symptoms freely' : 'Tap to simulate speaking symptom history'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#080331] mb-1">Chief Symptoms / Transcription</label>
                      <textarea 
                        rows={3} 
                        value={chiefComplaint} 
                        onChange={(e) => setChiefComplaint(e.target.value)}
                        className="w-full bg-white border border-[#080331]/15 rounded-xl p-3 text-[#080331] focus:outline-none focus:border-[#8C5D36] text-xs leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#080331] mb-1">Duration</label>
                        <input 
                          type="text" 
                          value={duration} 
                          onChange={(e) => setDuration(e.target.value)}
                          className="w-full bg-white border border-[#080331]/15 rounded-xl px-3 py-2 text-[#080331] text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#080331] mb-1">
                          Pain Scale ({severity}/10)
                        </label>
                        <input 
                          type="range" 
                          min="1" 
                          max="10" 
                          value={severity} 
                          onChange={(e) => setSeverity(parseInt(e.target.value))}
                          className="w-full mt-2 accent-[#8C5D36]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Ayush Ahara-Vihara */}
            {step === 3 && (
              <div className="space-y-4 font-sans text-xs sm:text-sm">
                <div>
                  <label className="block text-xs font-semibold text-[#080331] mb-1">Dominant Diet Taste (Ahara Rasa)</label>
                  <select 
                    value={dominantRasa} 
                    onChange={(e) => setDominantRasa(e.target.value)}
                    className="w-full bg-white border border-[#080331]/15 rounded-xl px-3.5 py-2 text-[#080331] focus:outline-none focus:border-[#8C5D36]"
                  >
                    <option value="Katu (Pungent) & Lavana (Salty)">Katu (Pungent) &amp; Lavana (Salty)</option>
                    <option value="Madhura (Sweet) & Snigdha (Oily)">Madhura (Sweet) &amp; Snigdha (Oily)</option>
                    <option value="Tikta (Bitter) & Kashaya (Astringent)">Tikta (Bitter) &amp; Kashaya (Astringent)</option>
                    <option value="Balanced Shad-Rasa">Balanced Shad-Rasa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#080331] mb-1">Digestion Power (Agni)</label>
                  <select 
                    value={agniState} 
                    onChange={(e) => setAgniState(e.target.value)}
                    className="w-full bg-white border border-[#080331]/15 rounded-xl px-3.5 py-2 text-[#080331] focus:outline-none focus:border-[#8C5D36]"
                  >
                    <option value="Mandagni (Sluggish Digestion)">Mandagni (Sluggish Digestion / Indigestion)</option>
                    <option value="Tikshnagni (Intense Hunger / Acidic)">Tikshnagni (Intense Hunger / Acidic)</option>
                    <option value="Vishamagni (Irregular Appetite)">Vishamagni (Irregular Appetite)</option>
                    <option value="Samagni (Balanced Digestion)">Samagni (Balanced Digestion)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#080331] mb-1">Lifestyle &amp; Sleep Pattern (Vihara)</label>
                  <input 
                    type="text" 
                    value={sleepState} 
                    onChange={(e) => setSleepState(e.target.value)}
                    className="w-full bg-white border border-[#080331]/15 rounded-xl px-3.5 py-2 text-[#080331] focus:outline-none focus:border-[#8C5D36]"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Past Rx OCR */}
            {step === 4 && (
              <div className="space-y-4 font-sans text-xs sm:text-sm">
                <div className="bg-[#fdf2f7] border border-[#f098d7]/30 rounded-2xl p-4 text-[#080331]">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#328a3b] bg-emerald-50 px-2.5 py-0.5 rounded-full mb-2">
                    <Check size={11} />
                    <span>SARVAM VISION OCR</span>
                  </span>
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-[#080331]">Past Prescriptions Extracted:</p>
                    <p className="text-stone/70">Scanned crumpled slip from Dr. Sen (AIIMS OPD)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#080331] mb-1">Extracted Past Medications</label>
                  <input 
                    type="text" 
                    value={rxMeds} 
                    onChange={(e) => setRxMeds(e.target.value)}
                    className="w-full bg-white border border-[#080331]/15 rounded-xl px-3.5 py-2 text-[#080331] focus:outline-none focus:border-[#8C5D36]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-red-600 mb-1 flex items-center gap-1.5">
                    <AlertTriangle size={13} />
                    <span>Detected Drug Allergies (Red-Flag)</span>
                  </label>
                  <input 
                    type="text" 
                    value={allergies} 
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full bg-white border border-red-300 rounded-xl px-3.5 py-2 text-red-700 font-semibold focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#080331]/10">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as any)}
                  className="flex items-center gap-1.5 text-xs text-stone hover:text-[#080331] font-semibold px-4 py-2 rounded-full cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>{t('kiosk.back', 'Back')}</span>
                </button>
              ) : <div />}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s + 1) as any)}
                  className="flex items-center gap-1.5 bg-[#1C1917] hover:bg-[#2E2824] text-white text-xs font-medium px-6 py-2.5 rounded-full shadow-sm transition-all cursor-pointer"
                >
                  <span>{t('kiosk.continue', 'Continue')}</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-1.5 bg-[#328a3b] hover:bg-[#286f30] text-white text-xs font-semibold px-7 py-2.5 rounded-full shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>{t('kiosk.generateToken', 'Generate OPD Token & Sync')}</span>
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
