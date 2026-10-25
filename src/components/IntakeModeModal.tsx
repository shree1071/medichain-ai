import { X, Mic, Radio, Touchpad, Sparkles, ArrowRight, ShieldCheck, Stethoscope } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface IntakeModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVoice: () => void;
  onSelectQuiz: () => void;
  patientName?: string;
}

export default function IntakeModeModal({
  isOpen,
  onClose,
  onSelectVoice,
  onSelectQuiz,
  patientName = 'Govind Narain'
}: IntakeModeModalProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-[0_24px_60px_rgba(15,23,42,0.18)] border border-slate-200/90 overflow-hidden flex flex-col text-slate-800 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 via-white to-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Stethoscope size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200/60">
                  {t('intakeModal.setup', 'OPD Intake Setup')}
                </span>
                <span className="text-xs text-slate-500 font-medium">{t('intakeModal.bayInfo', 'Bay 04 • Dr. Vaidya Ananya Sharma')}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-0.5">
                {t('intakeModal.title', 'Namaste {name}, how would you like to provide your symptoms?', { name: patientName })}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body: Two Core Options */}
        <div className="p-6 sm:p-8 space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed text-center max-w-lg mx-auto mb-2">
            {t('intakeModal.sub', 'Please choose your preferred method of consultation intake. Both options structure your clinical anamnesis directly for your doctor.')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* OPTION 1: Voice-Based Input (LiveKit WebRTC Call) */}
            <div 
              onClick={() => {
                onClose();
                onSelectVoice();
              }}
              className="group relative bg-gradient-to-b from-slate-50/80 to-white hover:from-indigo-50/50 hover:to-white border-2 border-slate-200/80 hover:border-indigo-500/80 rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:shadow-lg cursor-pointer flex flex-col justify-between"
            >
              {/* Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  <Radio size={12} className="text-indigo-600 animate-pulse" />
                  <span>{t('intakeModal.opt1Badge', 'Option 1: LiveKit Voice Call')}</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors">
                  {t('intakeModal.opt1Tag', 'Hands-Free')}
                </span>
              </div>

              {/* Center Icon & Info */}
              <div className="space-y-3 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/25 group-hover:scale-105 transition-transform">
                  <Mic size={28} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {t('intakeModal.opt1Title', 'Voice-Based Intake')}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    {t('intakeModal.opt1Desc', "Speak naturally in Hindi, Marathi, English, or your regional language. Dr. Sharma's AI voice assistant conducts a live conversational anamnesis call.")}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{t('intakeModal.opt1Feat1', 'Real-time conversational WebRTC audio')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>{t('intakeModal.opt1Feat2', 'Sarvam 105B Indic Clinical Reasoning')}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 group-hover:bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <span>{t('intakeModal.opt1Btn', 'Start Voice Call')}</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* OPTION 2: Adaptive Quiz (Touch Anamnesis + Bhashini Voice Typing) */}
            <div 
              onClick={() => {
                onClose();
                onSelectQuiz();
              }}
              className="group relative bg-gradient-to-b from-slate-50/80 to-white hover:from-blue-50/50 hover:to-white border-2 border-slate-200/80 hover:border-[#4865ff] rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:shadow-lg cursor-pointer flex flex-col justify-between"
            >
              {/* Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  <Sparkles size={12} className="text-blue-600" />
                  <span>{t('intakeModal.opt2Badge', 'Option 2: Adaptive Quiz')}</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">
                  {t('intakeModal.opt2Tag', 'Bhashini Dictation')}
                </span>
              </div>

              {/* Center Icon & Info */}
              <div className="space-y-3 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-[#4865ff] text-white flex items-center justify-center shadow-md shadow-[#4865ff]/25 group-hover:scale-105 transition-transform">
                  <Touchpad size={28} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-[#4865ff] transition-colors">
                    {t('intakeModal.opt2Title', 'Adaptive Touch Quiz')}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    {t('intakeModal.opt2Desc', 'Answer step-by-step multiple choice questions. Dynamically branches based on your symptoms, with Bhashini voice-to-type at every step.')}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>{t('intakeModal.opt2Feat1', 'Touch MCQ + Bhashini Voice-to-Type')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{t('intakeModal.opt2Feat2', 'SOCRATES + AYUSH Dashavidha Pariksha')}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl bg-[#4865ff] group-hover:bg-[#3852e6] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <span>{t('intakeModal.opt2Btn', 'Start Adaptive Quiz')}</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

          </div>

          {/* Footer Assistance Note */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>{t('intakeModal.footer', 'MediChain Clinical Protocol • MineArena 1.0')}</span>
            </div>
            <span className="text-[11px] text-slate-400">{t('intakeModal.switchAnytime', 'You can switch modes anytime during intake')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
