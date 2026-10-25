import { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES, type Language } from '../context/LanguageContext';

interface LanguageSelectorProps {
  variant?: 'pill' | 'compact' | 'modal-bar';
  className?: string;
}

export default function LanguageSelector({ variant = 'pill', className = '' }: LanguageSelectorProps) {
  const { language, setLanguage, currentLanguageOption } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSelect = (langCode: Language) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  if (variant === 'modal-bar') {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
        {SUPPORTED_LANGUAGES.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => handleSelect(item.code)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
              language === item.code
                ? 'bg-[#4865ff] text-white border-[#4865ff] shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <span>{item.nativeName}</span>
            <span className={`text-[10px] ${language === item.code ? 'text-white/80' : 'text-slate-400'}`}>
              ({item.name})
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full border text-xs font-semibold tracking-tight transition-all cursor-pointer select-none shadow-2xs ${
          isOpen
            ? 'bg-[#4865ff] text-white border-[#4865ff] ring-2 ring-[#4865ff]/20'
            : 'bg-white hover:bg-slate-50 text-[#080331] border-slate-200 hover:border-indigo-300'
        }`}
        title="Change Language / भाषा चुनें / ভাষা পরিবর্তন"
        aria-label="Language Selector"
        aria-expanded={isOpen}
      >
        <Globe size={14} className={isOpen ? 'text-white' : 'text-[#4865ff]'} />
        <span className="font-medium">{currentLanguageOption.nativeName}</span>
        <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase tracking-wider ${
          isOpen ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
        }`}>
          {currentLanguageOption.code}
        </span>
        <ChevronDown 
          size={12} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} 
        />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-[0_20px_50px_rgba(8,3,49,0.22)] border border-slate-200 p-2.5 z-[9999] animate-in fade-in zoom-in-95 duration-150"
          style={{ transformOrigin: 'top right' }}
        >
          <div className="px-2.5 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Globe size={13} className="text-[#4865ff]" />
              <span>Select Language / भाषा चुनें</span>
            </span>
            <span className="text-[10px] text-indigo-600 bg-indigo-50 font-bold px-1.5 py-0.5 rounded">
              11 Indic
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto py-1.5 space-y-1 overscroll-contain">
            {SUPPORTED_LANGUAGES.map((item) => {
              const isSelected = language === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelect(item.code)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#4865ff] text-white font-semibold shadow-xs'
                      : 'text-slate-800 hover:bg-slate-100/80 font-normal'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-medium">{item.nativeName}</span>
                    <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                      • {item.name}
                    </span>
                  </div>
                  {isSelected && <Check size={15} className="text-white shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="px-2 py-2 border-t border-slate-100 bg-slate-50/70 rounded-b-xl text-[10px] text-slate-500 text-center font-medium">
            Ministry of Ayush • Bhashini ASR &amp; Multilingual Voice
          </div>
        </div>
      )}
    </div>
  );
}
