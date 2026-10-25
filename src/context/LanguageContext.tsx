import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Language = 
  | 'en' // English
  | 'hi' // हिन्दी (Hindi)
  | 'ta' // தமிழ் (Tamil)
  | 'te' // తెలుగు (Telugu)
  | 'bn' // বাংলা (Bengali)
  | 'mr' // मराठी (Marathi)
  | 'gu' // ગુજરાતી (Gujarati)
  | 'kn' // ಕನ್ನಡ (Kannada)
  | 'ml' // മലയാളം (Malayalam)
  | 'or' // ଓଡ଼ିଆ (Odia)
  | 'pa'; // ਪੰਜਾਬੀ (Punjabi)

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  ttsLocale: string;
  flagGlyph: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', ttsLocale: 'hi-IN', flagGlyph: '🇮🇳' },
  { code: 'en', name: 'English', nativeName: 'English', ttsLocale: 'en-IN', flagGlyph: '🇬🇧' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', ttsLocale: 'ta-IN', flagGlyph: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', ttsLocale: 'te-IN', flagGlyph: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', ttsLocale: 'bn-IN', flagGlyph: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', ttsLocale: 'mr-IN', flagGlyph: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', ttsLocale: 'gu-IN', flagGlyph: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', ttsLocale: 'kn-IN', flagGlyph: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', ttsLocale: 'ml-IN', flagGlyph: '🇮🇳' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', ttsLocale: 'or-IN', flagGlyph: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', ttsLocale: 'pa-IN', flagGlyph: '🇮🇳' },
];

import { TRANSLATIONS } from './translations';
export { TRANSLATIONS };


interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  languages: LanguageOption[];
  currentLanguageOption: LanguageOption;
  t: (key: string, fallback?: string, params?: Record<string, string>) => string;
  speakText: (text: string, overrideLang?: Language) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('ayush_app_language');
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      return saved as Language;
    }
    return 'hi';
  });

  const [isSpeaking, setIsSpeaking] = useState(false);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('ayush_app_language', lang);
  };

  const currentLanguageOption = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const t = useCallback((key: string, fallback?: string, params?: Record<string, string>): string => {
    const langDict = TRANSLATIONS[language];
    let res = (langDict && langDict[key]) || (TRANSLATIONS.en && TRANSLATIONS.en[key]) || fallback || key;
    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        res = res.replace(new RegExp('\\{' + paramKey + '\\}', 'g'), paramVal);
      });
    }
    return res;
  }, [language]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speakText = useCallback((text: string, overrideLang?: Language) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    try {
      window.speechSynthesis.cancel();
      const targetLang = overrideLang || language;
      const langOption = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92;
      utterance.pitch = 1.0;

      if (langOption?.ttsLocale) {
        utterance.lang = langOption.ttsLocale;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setIsSpeaking(false);
    }
  }, [language]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        languages: SUPPORTED_LANGUAGES,
        currentLanguageOption,
        t,
        speakText,
        stopSpeaking,
        isSpeaking,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
