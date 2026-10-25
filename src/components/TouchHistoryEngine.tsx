import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  Flame, 
  Footprints, 
  Activity, 
  Wind, 
  AlertTriangle, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  ShieldAlert, 
  Stethoscope, 
  Compass, 
  Thermometer,
  Trash2,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';
import { 
  generateAdaptiveQuestion, 
  generateInstantClinicalSummary, 
  type AdaptiveQuestion, 
  type AnswerRecord, 
  type InstantClinicalSummary 
} from '../lib/groqAdaptiveEngine';

export interface HistoryTakingResult {
  chiefComplaint: string;
  site: string;
  onsetDuration: string;
  character: string;
  radiation: string;
  associatedSymptoms: string[];
  aggravatingFactors: string;
  relievingFactors: string;
  severity: number;
  agni: string;
  koshtha: string;
  dominantRasa: string;
  vihara: string;
  isRedFlag: boolean;
  redFlagReason?: string;
  triagePriority: 'emergency' | 'urgent' | 'routine';
  structuredNotes: string;
  instantClinicalSummary?: InstantClinicalSummary;
}

interface TouchHistoryEngineProps {
  onComplete: (result: HistoryTakingResult) => void;
  patientName?: string;
  initialLanguage?: string;
}

// Initial high-yield Chief Complaint Options (Step 1 anchor)
const INITIAL_CHIEF_COMPLAINTS = [
  {
    id: 'diabetic_foot',
    labelEn: 'Diabetic Foot Ulcer / Non-healing Wound',
    labelHi: 'डायबिटिक पैर का घाव / सुन्नपन (दुष्ट व्रण)',
    labelMr: 'मधुमेहामुळे पायाची न भरणारी जखम (दुष्ट व्रण)',
    descriptionEn: 'Open sore on foot, numbness, Wagner Grade 1-2, drainage',
    descriptionHi: 'पैर में न भरने वाला घाव, तलवों में सुन्नपन या स्राव',
    descriptionMr: 'पायाला न भरणारी जखम, बधीरपणा किंवा दुर्गंधीयुक्त स्राव',
    icon: <Footprints className="text-[#2D6A4F]" size={20} />
  },
  {
    id: 'hyperacidity',
    labelEn: 'Severe Acidity & Retrosternal Burning',
    labelHi: 'खट्टी डकारें व छाती/पेट में जलन (अम्लपित्त)',
    labelMr: 'छाती व पोटात तीव्र जळजळ आणि आंबट ढेकर (अम्लपित्त)',
    descriptionEn: 'Burning behind breastbone after meals, sour burps, GERD',
    descriptionHi: 'भोजन के बाद छाती में जलन, खट्टी डकारें, आमाशय शोध',
    descriptionMr: 'जेवणानंतर छातीत जळजळ, आंबट पाणी तोंडाशी येणे',
    icon: <Flame className="text-[#D97706]" size={20} />
  },
  {
    id: 'chest_pain',
    labelEn: 'Chest Pain / Heavy Pressure',
    labelHi: 'सीने में दर्द या भारी दबाव (हृदय शूल)',
    labelMr: 'छातीत असह्य वेदना किंवा जडपणा (हृदय शूल)',
    descriptionEn: 'Pressure, tightness, or squeezing across central chest',
    descriptionHi: 'सीने के बीच में खिंचाव, जलन या दम घुटना',
    descriptionMr: 'छातीच्या मधोमध जडपणा, दाब किंवा घाम येणे',
    icon: <HeartPulse className="text-[#DC2626]" size={20} />,
    isRedFlag: true
  },
  {
    id: 'joint_pain',
    labelEn: 'Joint Pain, Swelling & Morning Stiffness',
    labelHi: 'जोड़ों में दर्द, सूजन व अकड़न (संधिवात)',
    labelMr: 'सांधेदुखी, सूज व सकाळची जकडन (संधिवात/आमवात)',
    descriptionEn: 'Knees, fingers or back pain, stiff for >30 mins in morning',
    descriptionHi: 'घुटनों, उंगलियों या कमर में दर्द और चलने में परेशानी',
    descriptionMr: 'गुडघे, बोटे किंवा पाठीत कळा, सकाळी हालचालीस त्रास',
    icon: <Activity className="text-[#8C5D36]" size={20} />
  },
  {
    id: 'cough_dyspnea',
    labelEn: 'Cough, Wheezing & Breathlessness',
    labelHi: 'खांसी, घरघराहट व सांस फूलना (कास-श्वास)',
    labelMr: 'खोकला, घरघर व धाप लागणे (कास-श्वास)',
    descriptionEn: 'Persistent chest congestion, nocturnal wheezing',
    descriptionHi: 'लगातार खांसी, छाती में बलगम, रात को सांस में तकलीफ',
    descriptionMr: 'छातीत कफ, घरघर आवाज आणि दम लागणे',
    icon: <Wind className="text-[#0D9488]" size={20} />,
    isRedFlag: true
  },
  {
    id: 'headache_fever',
    labelEn: 'Severe Headache, Vertigo or High Fever',
    labelHi: 'तेज सिरदर्द, चक्कर या तेज बुखार (ज्वर/शिरोरोग)',
    labelMr: 'तीव्र डोकेदुखी, चक्कर किंवा ताप (ज्वर/शिरोरोग)',
    descriptionEn: 'Throbbing cranial ache, elevated temperature, photophobia',
    descriptionHi: 'सिर में तेज फड़कन, बदन दर्द, तेज तापमान',
    descriptionMr: 'डोक्यात ठणका, अंगात उष्णता व चक्कर येणे',
    icon: <Thermometer className="text-[#C25E38]" size={20} />
  }
];

export default function TouchHistoryEngine({ onComplete, patientName = 'Govind Narain' }: TouchHistoryEngineProps) {
  const { language, speakText, stopSpeaking, isSpeaking } = useLanguage();

  // Answer records history (sent to Groq for real-time contextual adaptation)
  const [answerHistory, setAnswerHistory] = useState<AnswerRecord[]>([]);

  // Active step index (0 = Step 1 Chief Complaint, 1..N = Groq Adaptive Steps)
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const maxAdaptiveSteps = 4; // 1 initial + 3 dynamic Groq questions = 4 total, then Instant Summary

  // Groq Adaptive Questions store
  const [adaptiveQuestions, setAdaptiveQuestions] = useState<Record<number, AdaptiveQuestion>>({});
  const [isGeneratingNextQ, setIsGeneratingNextQ] = useState(false);

  // Live Instant Clinical Summary State
  const [instantSummary, setInstantSummary] = useState<InstantClinicalSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSummaryDrawerOpen, setIsSummaryDrawerOpen] = useState(false);
  const [isReviewingFinalSummary, setIsReviewingFinalSummary] = useState(false);

  // Custom Typed / Bhashini Voice Input
  const [customTypedInput, setCustomTypedInput] = useState('');
  const [isVoiceTyping, setIsVoiceTyping] = useState(false);

  // Red Flag Alert State
  const [redFlagAlert, setRedFlagAlert] = useState<{ active: boolean; reason: string }>({
    active: false,
    reason: ''
  });

  const currentLangOption = SUPPORTED_LANGUAGES.find((l) => l.code === language);

  // Helper to get bilingual label for initial chief complaint
  const getChiefComplaintLabel = (c: typeof INITIAL_CHIEF_COMPLAINTS[0]) => {
    if (language === 'mr' && c.labelMr) return c.labelMr;
    if (language === 'hi' && c.labelHi) return c.labelHi;
    return c.labelEn;
  };

  const getChiefComplaintDesc = (c: typeof INITIAL_CHIEF_COMPLAINTS[0]) => {
    if (language === 'mr' && c.descriptionMr) return c.descriptionMr;
    if (language === 'hi' && c.descriptionHi) return c.descriptionHi;
    return c.descriptionEn;
  };

  // Trigger audio guide when step changes
  useEffect(() => {
    stopSpeaking();
  }, [currentStepIndex, isReviewingFinalSummary, stopSpeaking]);

  // Read current question out loud
  const handleSpeakCurrent = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    if (isReviewingFinalSummary && instantSummary) {
      const summaryText = `${instantSummary.chiefComplaint}. ${instantSummary.doctorHandoverNote}`;
      speakText(summaryText, language);
      return;
    }

    if (currentStepIndex === 0) {
      const qText = language === 'mr'
        ? 'आज आपली मुख्य समस्या किंवा लक्षण काय आहे?'
        : language === 'hi'
        ? 'आज आपकी मुख्य समस्या या लक्षण क्या है?'
        : 'What is your primary discomfort or symptom today?';
      speakText(qText, language);
    } else {
      const q = adaptiveQuestions[currentStepIndex];
      if (q) {
        speakText(`${q.question}. ${q.subtitle}`, language);
      }
    }
  };

  // Background update for Instant Clinical Summary
  const refreshInstantSummary = async (history: AnswerRecord[]) => {
    if (history.length === 0) return;
    setIsGeneratingSummary(true);
    try {
      const summary = await generateInstantClinicalSummary(history, language, patientName);
      setInstantSummary(summary);
    } catch (err) {
      console.warn('Background summary update error:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Process a chosen option (either initial or adaptive)
  const handleSelectOption = async (option: { id: string; label: string; description?: string; isRedFlag?: boolean }) => {
    stopSpeaking();

    const isRed = Boolean(option.isRedFlag);
    if (isRed) {
      setRedFlagAlert({
        active: true,
        reason: `Critical Indicator: ${option.label}`
      });
    }

    let questionTitle = '';
    let category = '';

    if (currentStepIndex === 0) {
      questionTitle = 'Primary Clinical Discomfort (Chief Complaint)';
      category = 'Chief Complaint';
    } else {
      const activeQ = adaptiveQuestions[currentStepIndex];
      questionTitle = activeQ?.question || 'Clinical Probe';
      category = activeQ?.category || 'SOCRATES & Pariksha';
    }

    const newRecord: AnswerRecord = {
      step: currentStepIndex + 1,
      questionId: option.id,
      question: questionTitle,
      answer: option.label,
      category,
      isRedFlag: isRed
    };

    const updatedHistory = [...answerHistory, newRecord];
    setAnswerHistory(updatedHistory);
    setCustomTypedInput('');

    // Kick off real-time instant summary update
    refreshInstantSummary(updatedHistory);

    // Check if we should generate the next adaptive question or conclude
    if (currentStepIndex + 1 < maxAdaptiveSteps) {
      const nextStep = currentStepIndex + 1;
      setIsGeneratingNextQ(true);

      try {
        const nextAdaptiveQ = await generateAdaptiveQuestion(updatedHistory, language, nextStep, patientName);
        setAdaptiveQuestions((prev) => ({ ...prev, [nextStep]: nextAdaptiveQ }));
        setCurrentStepIndex(nextStep);
      } catch (err) {
        console.error('Failed to generate adaptive question:', err);
      } finally {
        setIsGeneratingNextQ(false);
      }
    } else {
      // Transition to Final Instant Clinical Summary Screen
      finalizeSummaryAndShow(updatedHistory);
    }
  };

  // Handle Custom Typed or Bhashini Voice Answer Submission
  const handleCustomSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customTypedInput.trim() || isGeneratingNextQ) return;

    stopSpeaking();
    const typedText = customTypedInput.trim();

    // Check for red flag keywords in typed text
    const lower = typedText.toLowerCase();
    const isRed = 
      lower.includes('chest') ||
      lower.includes('heart') ||
      lower.includes('breath') ||
      lower.includes('bleed') ||
      lower.includes('unconscious') ||
      lower.includes('attack') ||
      lower.includes('gangrene') ||
      lower.includes('सीने') ||
      lower.includes('छातीत');

    if (isRed) {
      setRedFlagAlert({
        active: true,
        reason: `Flagged in typed response: "${typedText}"`
      });
    }

    const questionTitle = currentStepIndex === 0
      ? 'Primary Clinical Discomfort (Chief Complaint)'
      : (adaptiveQuestions[currentStepIndex]?.question || 'Clinical Probe');

    const newRecord: AnswerRecord = {
      step: currentStepIndex + 1,
      questionId: `typed_${currentStepIndex + 1}`,
      question: questionTitle,
      answer: typedText,
      category: currentStepIndex === 0 ? 'Chief Complaint' : 'Patient Dictation',
      isRedFlag: isRed
    };

    const updatedHistory = [...answerHistory, newRecord];
    setAnswerHistory(updatedHistory);
    setCustomTypedInput('');

    // Update instant summary in real-time
    refreshInstantSummary(updatedHistory);

    if (currentStepIndex + 1 < maxAdaptiveSteps) {
      const nextStep = currentStepIndex + 1;
      setIsGeneratingNextQ(true);

      try {
        const nextAdaptiveQ = await generateAdaptiveQuestion(updatedHistory, language, nextStep, patientName);
        setAdaptiveQuestions((prev) => ({ ...prev, [nextStep]: nextAdaptiveQ }));
        setCurrentStepIndex(nextStep);
      } catch (err) {
        console.error('Failed to generate adaptive question:', err);
      } finally {
        setIsGeneratingNextQ(false);
      }
    } else {
      finalizeSummaryAndShow(updatedHistory);
    }
  };

  // Finalize and present the Instant Clinical Summary Screen
  const finalizeSummaryAndShow = async (history: AnswerRecord[]) => {
    setIsReviewingFinalSummary(true);
    setIsGeneratingSummary(true);
    try {
      const finalSummary = await generateInstantClinicalSummary(history, language, patientName);
      setInstantSummary(finalSummary);
    } catch (err) {
      console.warn('Final summary generation error:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Complete anamnesis and hand off to parent Kiosk modal
  const handleConfirmAndComplete = () => {
    stopSpeaking();
    const chief = answerHistory[0]?.answer || 'Clinical Anamnesis';
    const hasRedFlag = redFlagAlert.active || answerHistory.some((h) => h.isRedFlag);
    const triage = hasRedFlag ? 'emergency' : instantSummary?.triagePriority || 'routine';

    const structured = instantSummary
      ? `CHIEF COMPLAINT: ${instantSummary.chiefComplaint}
HPI (SOCRATES): ${instantSummary.hpiSummary}
AYUSH PARIKSHA & DOSHA: ${instantSummary.ayushDoshaAnalysis}
SEVERITY: ${instantSummary.estimatedSeverity}
TRIAGE PRIORITY: ${triage.toUpperCase()} ${hasRedFlag ? '[RED-FLAG ESCALATION]' : ''}
DOCTOR HANDOVER NOTE: ${instantSummary.doctorHandoverNote}
RECOMMENDATIONS: ${(instantSummary.keyRecommendations || []).join('; ')}`
      : answerHistory.map((h) => `[${h.question}]: ${h.answer}`).join('\n');

    onComplete({
      chiefComplaint: chief,
      site: answerHistory[1]?.answer || 'Unspecified',
      onsetDuration: answerHistory[2]?.answer || 'Subacute',
      character: answerHistory[3]?.answer || 'Moderate discomfort',
      radiation: 'None reported',
      associatedSymptoms: answerHistory.map((h) => h.answer),
      aggravatingFactors: 'Activity',
      relievingFactors: 'Rest / Warm Bio-Wash',
      severity: hasRedFlag ? 9 : 6,
      agni: 'Mandagni (Sluggish Digestion)',
      koshtha: 'Madhyama (Regular Bowel)',
      dominantRasa: 'Katu & Lavana (Pungent & Salty)',
      vihara: 'Ratri Jagarana & Moderate Physical Strain',
      isRedFlag: hasRedFlag,
      redFlagReason: redFlagAlert.reason || undefined,
      triagePriority: triage,
      structuredNotes: structured,
      instantClinicalSummary: instantSummary || undefined
    });
  };

  // Bhashini Voice Dictation (Speech-to-Text) with Web Speech API & Indic Locales
  const handleToggleVoiceDictation = () => {
    if (isVoiceTyping) {
      setIsVoiceTyping(false);
      return;
    }

    const langLocales: Record<string, string> = {
      hi: 'hi-IN',
      en: 'en-IN',
      mr: 'mr-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      bn: 'bn-IN',
      gu: 'gu-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      pa: 'pa-IN',
      or: 'or-IN'
    };

    const targetLocale = langLocales[language] || 'hi-IN';
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = targetLocale;
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => setIsVoiceTyping(true);
        recognition.onresult = (event: any) => {
          let interimText = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            interimText += event.results[i][0].transcript;
          }
          if (interimText) {
            setCustomTypedInput(interimText);
          }
        };
        recognition.onerror = () => setIsVoiceTyping(false);
        recognition.onend = () => setIsVoiceTyping(false);

        recognition.start();
      } catch (err) {
        console.warn('SpeechRecognition failed, fallback simulate', err);
        simulateVoiceDictation();
      }
    } else {
      simulateVoiceDictation();
    }
  };

  const simulateVoiceDictation = () => {
    setIsVoiceTyping(true);
    setTimeout(() => {
      setIsVoiceTyping(false);
      const demoDictations: Record<string, string> = {
        mr: 'पायावर दोन आठवड्यांपासून अल्सर आहे, सूज आली आहे आणि पिवळसर पाणी येत आहे.',
        hi: 'पैर में दो हफ़्ते से घाव है, सूजन है और चलने में काफ़ी जलन और दर्द होता है।',
        en: 'The ulcer on my foot has been present for 2 weeks with swelling and yellowish discharge.'
      };
      setCustomTypedInput(demoDictations[language] || demoDictations.en);
    }, 1800);
  };

  const currentAdaptiveQ = adaptiveQuestions[currentStepIndex];

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: INSTANT CLINICAL SUMMARY FINAL SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (isReviewingFinalSummary) {
    return (
      <div className="w-full space-y-4 text-left animate-in fade-in duration-200">
        
        {/* Header Ribbon: Warm Editorial Anamnesis Dossier */}
        <div className="bg-[#FAF6F0] text-[#1C1917] p-5 rounded-3xl border border-[#E4DBD0] shadow-warm-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#EAE2D5] text-[#8C5D36] flex items-center justify-center font-bold">
                <FileText size={18} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#EFE8DC] text-[#78614E] border border-[#DDD3C5]">
                  Instant Clinical Summary · तात्कालिक क्लिनिकल सारांश
                </span>
                <h3 className="text-base font-bold text-[#1C1917] mt-1 tracking-tight">
                  Pre-Consultation Anamnesis Dossier
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSpeakCurrent}
                className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#F0EAE0] text-[#1C1917] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-[#DDD3C5] shadow-2xs"
                title="Read summary out loud"
              >
                {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} className="text-[#8C5D36]" />}
                <span>{isSpeaking ? 'Stop Audio' : 'Listen Summary'}</span>
              </button>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#E4DBD0] flex items-center justify-between text-xs text-[#78716C] flex-wrap gap-2">
            <span>Patient: <strong className="text-[#1C1917]">{patientName}</strong> (58 M • ABHA: 91-3829-5512)</span>
            <span>OPD Bay: <strong className="text-[#1C1917]">Bay 04 • Dr. Vaidya Ananya Sharma</strong></span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
              redFlagAlert.active || instantSummary?.triagePriority === 'emergency'
                ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA] animate-pulse'
                : instantSummary?.triagePriority === 'urgent'
                ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                : 'bg-[#EAF3EC] text-[#245E41] border-[#C6DFD2]'
            }`}>
              Triage: {instantSummary?.triagePriority?.toUpperCase() || 'ROUTINE'}
            </span>
          </div>
        </div>

        {/* Loading Spinner if synthesizing */}
        {isGeneratingSummary && (
          <div className="p-4 bg-[#FAF6F0] border border-[#E4DBD0] rounded-2xl flex items-center gap-3 text-[#78614E] text-xs">
            <Loader2 size={16} className="animate-spin text-[#8C5D36] shrink-0" />
            <span className="font-medium">
              Groq ultra-fast model (openai/gpt-oss-20b) is synthesizing comprehensive clinical report...
            </span>
          </div>
        )}

        {/* Summary Content Dossier Cards */}
        {instantSummary ? (
          <div className="space-y-3.5">
            
            {/* 1. Chief Complaint & HPI Progression */}
            <div className="bg-[#FAF7F2] rounded-2xl p-4 sm:p-5 border border-[#E6DED3] shadow-warm-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#8C5D36] uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope size={13} />
                  <span>Clinical Impression &amp; HPI (SOCRATES)</span>
                </span>
                <span className="text-[10px] bg-[#EFE9DF] text-[#574B3D] border border-[#DDD3C5] font-semibold px-2 py-0.5 rounded-full">
                  Severity: {instantSummary.estimatedSeverity}
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#1C1917] leading-snug">
                {instantSummary.chiefComplaint}
              </h4>
              <p className="text-xs text-[#57534E] leading-relaxed font-normal">
                {instantSummary.hpiSummary}
              </p>
            </div>

            {/* 2. Ayush Tri-Dosha & Agni Analysis */}
            <div className="bg-[#FAF7F2] rounded-2xl p-4 sm:p-5 border border-[#E6DED3] shadow-warm-sm space-y-2">
              <span className="text-[10px] font-bold text-[#A05C33] uppercase tracking-wider flex items-center gap-1.5">
                <Flame size={13} />
                <span>AYUSH Dashavidha Pariksha &amp; Dosha Analysis</span>
              </span>
              <p className="text-xs text-[#292524] leading-relaxed">
                {instantSummary.ayushDoshaAnalysis}
              </p>
            </div>

            {/* 3. Triage & Recommendations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Red-Flag & Triage Justification */}
              <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#E6DED3] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C5D36]">
                  <ShieldAlert size={14} />
                  <span>Triage Rationale</span>
                </div>
                {instantSummary.redFlags && instantSummary.redFlags.length > 0 ? (
                  <ul className="text-xs text-rose-900 space-y-1 pl-4 list-disc font-medium">
                    {instantSummary.redFlags.map((rf: string, i: number) => (
                      <li key={i}>{rf}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#78716C]">No acute red-flags triggered. Stable for routine OPD consultation.</p>
                )}
              </div>

              {/* Recommendations */}
              <div className="bg-[#F0F5F1] rounded-2xl p-4 border border-[#C6DFD2] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#245E41]">
                  <CheckCircle2 size={14} className="text-[#245E41]" />
                  <span>Key Clinical Pointers</span>
                </div>
                {instantSummary.keyRecommendations && instantSummary.keyRecommendations.length > 0 ? (
                  <ul className="text-xs text-[#1E4631] space-y-1 pl-4 list-disc">
                    {instantSummary.keyRecommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#78716C]">Standard bio-wash and examination protocol.</p>
                )}
              </div>
            </div>

            {/* 4. Doctor Handover Note (SOAP format) */}
            <div className="bg-[#FAF7F2] text-[#1C1917] rounded-2xl p-4 sm:p-5 border border-[#E6DED3] shadow-warm-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-[#78716C] pb-2 border-b border-[#E6DED3]">
                <span className="font-semibold text-[#1C1917] flex items-center gap-1.5">
                  <FileText size={13} className="text-[#8C5D36]" />
                  <span>Doctor Handover Brief (Pre-Consultation SOAP Note)</span>
                </span>
                <span className="font-mono text-[10px] text-[#78716C]">AYUSH OPD BAY 04</span>
              </div>
              <div className="p-3 bg-[#F4EFE6] rounded-xl border border-[#E0D5C7] text-xs text-[#292524] leading-relaxed font-mono">
                {instantSummary.doctorHandoverNote}
              </div>
            </div>

          </div>
        ) : null}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E6DED3] flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsReviewingFinalSummary(false)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#57534E] hover:text-[#1C1917] px-4 py-2 rounded-full border border-[#D5C9B8] hover:bg-[#FAF7F2] transition-all cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Answer More Questions</span>
          </button>

          <button
            type="button"
            onClick={handleConfirmAndComplete}
            className="flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#245740] text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-warm-sm transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <CheckCircle2 size={15} />
            <span>Confirm &amp; Proceed to OPD Token</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: ADAPTIVE REAL-TIME QUIZ SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="w-full space-y-3.5 text-left">
      
      {/* ── Emergency Red-Flag Banner (If triggered) ── */}
      {redFlagAlert.active && (
        <div className="p-3.5 bg-rose-50 border-2 border-rose-500/70 rounded-2xl flex items-start gap-3 shadow-md animate-bounce-short">
          <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
            <ShieldAlert size={20} />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                EMERGENCY RED FLAG DETECTED
              </span>
              <span className="text-[11px] font-semibold text-rose-600">Code Red Triage</span>
            </div>
            <p className="text-xs text-rose-900 mt-0.5 font-medium leading-relaxed">
              Acute symptoms flagged for immediate emergency triage. Alerting OPD Bay 04 doctor &amp; nursing staff.
            </p>
            <div className="text-[11px] text-rose-700 font-mono mt-1">
              Trigger: {redFlagAlert.reason}
            </div>
          </div>
        </div>
      )}

      {/* ── Top Bar: Step Counter, Audio Guide & Instant Summary Pill ── */}
      <div className="flex items-center justify-between px-1 py-1 text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[#1C1917] text-white flex items-center justify-center font-bold text-[10px]">
            {currentStepIndex + 1}
          </span>
          <div>
            <span className="font-semibold text-[#1C1917] text-xs">
              {currentStepIndex === 0 ? 'Chief Complaint' : currentAdaptiveQ?.category || 'Adaptive Probe'}
            </span>
            <span className="text-[#78716C] text-[11px] ml-1.5">
              ({currentStepIndex + 1}/{maxAdaptiveSteps})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Instant Summary Live Peek Pill */}
          {answerHistory.length > 0 && (
            <button
              type="button"
              onClick={() => setIsSummaryDrawerOpen(!isSummaryDrawerOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF2EB] hover:bg-[#F5E7DA] text-[#8C5D36] border border-[#E8D6C5] transition-all cursor-pointer shadow-2xs"
              title="Peek Instant Clinical Summary"
            >
              <Sparkles size={12} className="text-[#8C5D36]" />
              <span>Instant Summary</span>
              <span className="text-[10px] bg-[#EFE0D3] text-[#5C3D24] px-1.5 py-0.2 rounded-full font-bold">
                {answerHistory.length}
              </span>
              {isSummaryDrawerOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}

          {/* Audio TTS Read-aloud button */}
          <button
            type="button"
            onClick={handleSpeakCurrent}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
              isSpeaking
                ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] animate-pulse'
                : 'bg-white hover:bg-[#FAF6F0] text-[#1C1917] border-[#E6DED3] shadow-2xs'
            }`}
            title="Read Question Out Loud / प्रश्न सुनें"
          >
            {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} className="text-[#8C5D36]" />}
            <span>{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
          </button>
        </div>
      </div>

      {/* ── Expandable Live Instant Clinical Summary Drawer ── */}
      {isSummaryDrawerOpen && (
        <div className="bg-[#FAF7F2] border border-[#E6DED3] rounded-2xl p-4 text-xs space-y-2.5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6DED3]">
            <div className="flex items-center gap-1.5 font-bold text-[#1C1917]">
              <Sparkles size={14} className="text-[#8C5D36]" />
              <span>Live Instant Clinical Summary (Real-Time Groq AI)</span>
            </div>
            <button
              type="button"
              onClick={() => finalizeSummaryAndShow(answerHistory)}
              className="text-[11px] font-semibold text-[#8C5D36] hover:underline cursor-pointer"
            >
              View Full Dossier →
            </button>
          </div>

          {instantSummary ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1C1917]">{instantSummary.chiefComplaint}</span>
                <span className="text-[10px] bg-[#EFE8DC] text-[#574B3D] font-bold px-2 py-0.5 rounded-full border border-[#DDD3C5]">
                  {instantSummary.triagePriority.toUpperCase()}
                </span>
              </div>
              <p className="text-[#57534E] text-[11px] leading-relaxed line-clamp-3">
                {instantSummary.hpiSummary}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#78716C] text-[11px]">
              <Loader2 size={12} className="animate-spin text-[#8C5D36]" />
              <span>Synthesizing clinical findings as you answer...</span>
            </div>
          )}

          {/* Quick chip history */}
          <div className="flex flex-wrap gap-1 pt-1">
            {answerHistory.map((ans, i) => (
              <span key={i} className="bg-white border border-[#E6DED3] text-[#57534E] px-2 py-0.5 rounded-full text-[10px]">
                {ans.answer}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Active Question Card ── */}
      <div className="bg-[#FCFAF7] border border-[#E6DED3] rounded-3xl p-5 sm:p-6 shadow-warm-sm text-left relative overflow-hidden">
        
        {/* Loading overlay when Groq is tailoring next question in real-time */}
        {isGeneratingNextQ && (
          <div className="absolute inset-0 bg-[#FAF7F2]/90 backdrop-blur-xs z-20 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <Loader2 size={20} className="animate-spin text-[#8C5D36] mb-2" />
            <div className="text-xs text-[#78716C]">
              Generating next question…
            </div>
          </div>
        )}

        {/* Question Header label */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8C5D36] mb-2">
          <Sparkles size={11} />
          <span>{currentStepIndex === 0 ? 'Chief Complaint' : 'Adaptive Probe'}</span>
        </div>

        {/* Question Title */}
        <h4 className="font-sans text-base sm:text-[17px] text-[#1C1917] font-semibold leading-snug">
          {currentStepIndex === 0
            ? (language === 'mr'
                ? 'आज आपली मुख्य समस्या किंवा लक्षण काय आहे?'
                : language === 'hi'
                ? 'आज आपकी मुख्य समस्या या लक्षण क्या है?'
                : 'What is your primary discomfort today?')
            : currentAdaptiveQ?.question || 'Please provide further details regarding your symptom.'}
        </h4>

        {/* Question Subtitle */}
        <p className="text-xs text-[#78716C] mt-1 leading-relaxed">
          {currentStepIndex === 0
            ? 'Touch the option that best describes what brought you to the OPD, or speak your symptoms below.'
            : currentAdaptiveQ?.subtitle || 'Touch the option that best matches your situation, or type/dictate below.'}
        </p>

        {/* ── Multiple Choice Touch Options Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
          {currentStepIndex === 0 ? (
            INITIAL_CHIEF_COMPLAINTS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectOption({
                  id: opt.id,
                  label: getChiefComplaintLabel(opt),
                  description: getChiefComplaintDesc(opt),
                  isRedFlag: opt.isRedFlag
                })}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer group flex items-start gap-3 select-none active:scale-[0.98] ${
                  opt.isRedFlag
                    ? 'bg-[#FFF6F6] hover:bg-[#FEECEC] border-[#FCD8D8] hover:border-[#F87171] shadow-2xs'
                    : 'bg-white hover:bg-[#F7F3EC] border-[#E6DED3] hover:border-[#D5C9B8] shadow-2xs hover:shadow-xs'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] border border-[#E6DED3] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {opt.icon || <Compass size={16} className="text-[#8C5D36]" />}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-xs text-[#1C1917] group-hover:text-[#8C5D36] transition-colors leading-tight">
                    {getChiefComplaintLabel(opt)}
                  </div>
                  <div className="text-[11px] text-[#78716C] mt-0.5 line-clamp-2 leading-relaxed">
                    {getChiefComplaintDesc(opt)}
                  </div>
                  {opt.isRedFlag && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#DC2626] uppercase tracking-tight mt-1 bg-[#FEE2E2] px-2 py-0.5 rounded-full border border-[#FECACA]">
                      <AlertTriangle size={10} />
                      <span>Emergency Indicator</span>
                    </span>
                  )}
                </div>
              </button>
            ))
          ) : currentAdaptiveQ ? (
            currentAdaptiveQ.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectOption(opt)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer group flex items-start gap-3 select-none active:scale-[0.98] ${
                  opt.isRedFlag
                    ? 'bg-[#FFF6F6] hover:bg-[#FEECEC] border-[#FCD8D8] hover:border-[#F87171] shadow-2xs'
                    : 'bg-white hover:bg-[#F7F3EC] border-[#E6DED3] hover:border-[#D5C9B8] shadow-2xs hover:shadow-xs'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] border border-[#E6DED3] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Compass size={16} className={opt.isRedFlag ? 'text-[#DC2626]' : 'text-[#8C5D36]'} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-xs text-[#1C1917] group-hover:text-[#8C5D36] transition-colors leading-tight">
                    {opt.label}
                  </div>
                  {opt.description && (
                    <div className="text-[11px] text-[#78716C] mt-0.5 line-clamp-2 leading-relaxed">
                      {opt.description}
                    </div>
                  )}
                  {opt.isRedFlag && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#DC2626] uppercase tracking-tight mt-1 bg-[#FEE2E2] px-2 py-0.5 rounded-full border border-[#FECACA]">
                      <AlertTriangle size={10} />
                      <span>Emergency Red Flag</span>
                    </span>
                  )}
                </div>
              </button>
            ))
          ) : null}
        </div>

        {/* ── Bhashini Voice Dictation & Text Input Strip ── */}
        <div className="mt-4 pt-4 border-t border-[#E6DED3]">
          
          {/* Bhashini Voice Dictation Trigger Bar */}
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={handleToggleVoiceDictation}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer shrink-0 border ${
                isVoiceTyping
                  ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA] ring-2 ring-red-100'
                  : 'bg-white text-[#57534E] hover:bg-[#FAF6F0] hover:text-[#1C1917] border-[#E6DED3] shadow-2xs'
              }`}
            >
              {isVoiceTyping ? (
                <>
                  <MicOff size={14} />
                  <span>Stop</span>
                  <div className="flex items-center gap-0.5">
                    <span className="w-0.5 h-2.5 bg-red-400 rounded-full animate-pulse" />
                    <span className="w-0.5 h-4 bg-red-400 rounded-full animate-pulse delay-75" />
                    <span className="w-0.5 h-2 bg-red-400 rounded-full animate-pulse delay-150" />
                  </div>
                </>
              ) : (
                <>
                  <Mic size={14} />
                  <span className="hidden sm:inline">
                    {currentLangOption ? currentLangOption.nativeName : 'Speak'}
                  </span>
                </>
              )}
            </button>

            {/* Input Form inline with mic */}
            <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customTypedInput}
                  onChange={(e) => setCustomTypedInput(e.target.value)}
                  placeholder={isVoiceTyping ? 'Listening… speak your answer' : 'Or type a custom answer…'}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-[#8C5D36] transition-all pr-7 shadow-2xs ${
                    isVoiceTyping ? 'bg-[#FFF6F6] border-red-200' : 'bg-white border-[#E6DED3]'
                  }`}
                />
                {customTypedInput && (
                  <button
                    type="button"
                    onClick={() => setCustomTypedInput('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#57534E] cursor-pointer"
                    title="Clear"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={!customTypedInput.trim() || isGeneratingNextQ}
                className="bg-[#1C1917] hover:bg-[#2E2824] disabled:opacity-40 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-warm-sm"
              >
                <span>Next</span>
                <Send size={12} />
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* ── Navigation Controls: Previous / Skip / Complete & Instant Summary ── */}
      <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentStepIndex === 0 || isGeneratingNextQ}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 disabled:opacity-30 font-medium px-3 py-1.5 rounded-full transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Previous Question</span>
        </button>

        {/* Step dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: maxAdaptiveSteps }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStepIndex
                  ? 'w-6 bg-[#4865ff]'
                  : idx < currentStepIndex
                  ? 'w-2 bg-emerald-500'
                  : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {answerHistory.length > 0 && (
            <button
              type="button"
              onClick={() => finalizeSummaryAndShow(answerHistory)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-xs transition-all cursor-pointer"
            >
              <Sparkles size={12} />
              <span>Instant Clinical Summary</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
