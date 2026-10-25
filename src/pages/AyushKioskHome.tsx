import { useState, useEffect, useRef } from 'react';
import { ArrowRight, UploadCloud, Mic, Touchpad, Check, AlertTriangle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import AuthModal from '../components/AuthModal';
import KioskIntakeModal from '../components/KioskIntakeModal';
import DoctorDashboardModal from '../components/DoctorDashboardModal';
import VoiceAgentModal from '../components/VoiceAgentModal';
import Human3DViewerModal from '../components/Human3DViewerModal';
import MediChainOverviewSection from '../components/MediChainOverviewSection';

export default function AyushKioskHome() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRole, setAuthRole] = useState<'vaidya' | 'patient'>('vaidya');
  const [isKioskModalOpen, setIsKioskModalOpen] = useState(false);
  const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [is3DViewerOpen, setIs3DViewerOpen] = useState(false);

  const [heroCurveHeight, setHeroCurveHeight] = useState<number>(80);
  const [valuesCurveHeight, setValuesCurveHeight] = useState<number>(96);
  const carouselRef = useRef<HTMLDivElement>(null);
  const valuesCurveRef = useRef<HTMLDivElement>(null);

  // Scroll effect: curves flatten to straight horizontal lines as user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;

      // 1. Hero curve: transitions from 80px down to 0px (straight) as user leaves the hero
      const newHeroHeight = Math.max(0, Math.min(80, 80 - scrollY * 0.45));
      setHeroCurveHeight(newHeroHeight);

      // 2. Values section break curve: flattens from 96px to 0px (straight) as user scrolls past Values section
      if (valuesCurveRef.current) {
        const rect = valuesCurveRef.current.getBoundingClientRect();
        const vh = window.innerHeight;
        // Exact August Health GSAP ScrollTrigger equivalent: start: 'bottom 85%', end: 'bottom 30%'
        const start = vh * 0.85;
        const end = vh * 0.30;
        const bottom = rect.bottom;

        if (bottom >= start) {
          setValuesCurveHeight(96);
        } else if (bottom <= end) {
          setValuesCurveHeight(0);
        } else {
          const progress = (start - bottom) / (start - end);
          // Power2 ease-out flattening
          const eased = 1 - Math.pow(1 - progress, 2);
          setValuesCurveHeight(Math.max(0, Math.min(96, Math.round(96 * (1 - eased)))));
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -420, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 420, behavior: 'smooth' });
    }
  };


  return (
    <div className="ayush-home min-h-screen bg-[#f8f3eb] text-[#080331] font-sans selection:bg-[#4865ff]/20 selection:text-[#080331] overflow-x-hidden antialiased">
      
      {/* ──────────────────────────────────────────────────────────
          1. STICKY PILL NAVIGATION BAR (Exact August Health Replica)
          ────────────────────────────────────────────────────────── */}
      <div className="home-nav-shell w-full pt-3 sm:pt-4 px-2 sm:px-4 lg:px-6 fixed top-0 left-0 right-0 z-50 pointer-events-none flex justify-center">
        <nav className="home-nav max-w-[1400px] w-full bg-white/95 backdrop-blur-xl rounded-full px-4 sm:px-6 lg:px-7 py-2 sm:py-2.5 flex items-center justify-between pointer-events-auto border border-black/5 shadow-[0_12px_32px_rgba(75,68,57,0.06),0_2px_8px_rgba(0,0,0,0.04)]">
          
          {/* Logo Brand (Exact August 8-Dot Starburst + AyushKiosk Serif) */}
          <a href="#" className="flex items-center gap-2.5 group cursor-pointer shrink-0 mr-4 lg:mr-6">
            <svg 
              id="logo-icon" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="group-hover:rotate-45 transition-transform duration-500 shrink-0"
            >
              <g>
                <path d="M15.7578 0.891945C15.7578 3.02664 14.0273 4.75716 11.8926 4.75716C9.75786 4.75716 8.02734 3.02664 8.02734 0.891945C8.02734 -1.24275 9.75786 -2.97327 11.8926 -2.97327C14.0273 -2.97327 15.7578 -1.24275 15.7578 0.891945Z" fill="#4865FF"/>
                <path d="M15.7578 22.894C15.7578 25.0287 14.0273 26.7592 11.8926 26.7592C9.75786 26.7592 8.02734 25.0287 8.02734 22.894C8.02734 20.7593 9.75786 19.0287 11.8926 19.0287C14.0273 19.0287 15.7578 20.7593 15.7578 22.894Z" fill="#4865FF"/>
                <path d="M26.7587 11.8929C26.7587 14.0276 25.0282 15.7581 22.8935 15.7581C20.7588 15.7581 19.0283 14.0276 19.0283 11.8929C19.0283 9.75822 20.7588 8.02771 22.8935 8.02771C25.0282 8.02771 26.7587 9.75822 26.7587 11.8929Z" fill="#4865FF"/>
                <path d="M4.75679 11.893C4.75679 14.0277 3.02628 15.7582 0.89158 15.7582C-1.24312 15.7582 -2.97363 14.0277 -2.97363 11.893C-2.97363 9.75829 -1.24312 8.02777 0.89158 8.02777C3.02628 8.02777 4.75679 9.75829 4.75679 11.893Z" fill="#4865FF"/>
                <path d="M23.5371 19.6719C23.5371 21.8066 21.8066 23.5371 19.6719 23.5371C17.5372 23.5371 15.8066 21.8066 15.8066 19.6719C15.8066 17.5372 17.5372 15.8066 19.6719 15.8066C21.8066 15.8066 23.5371 17.5372 23.5371 19.6719Z" fill="#4865FF"/>
                <path d="M7.97945 4.11411C7.97945 6.24881 6.24893 7.97933 4.11424 7.97933C1.97954 7.97933 0.249023 6.24881 0.249023 4.11411C0.249023 1.97942 1.97954 0.248901 4.11424 0.248901C6.24893 0.248901 7.97945 1.97942 7.97945 4.11411Z" fill="#4865FF"/>
                <path d="M23.5371 4.11411C23.5371 6.24881 21.8066 7.97933 19.6719 7.97933C17.5372 7.97933 15.8066 6.24881 15.8066 4.11411C15.8066 1.97942 17.5372 0.248901 19.6719 0.248901C21.8066 0.248901 23.5371 1.97942 23.5371 4.11411Z" fill="#4865FF"/>
                <path d="M7.97945 19.6719C7.97945 21.8066 6.24893 23.5371 4.11424 23.5371C1.97954 23.5371 0.249023 21.8066 0.249023 19.6719C0.249023 17.5372 1.97954 15.8066 4.11424 15.8066C6.24893 15.8066 7.97945 17.5372 7.97945 19.6719Z" fill="#4865FF"/>
              </g>
            </svg>
            <span className="font-serif text-[23px] sm:text-[25px] tracking-tight text-[#080331] font-normal leading-none select-none">
              MediChain <span className="text-[#4865FF] font-sans font-bold text-xl sm:text-2xl">AI</span>
            </span>
          </a>

          {/* Center Navigation Links (Matching August Health layout) */}
          <div className="hidden xl:flex items-center gap-3.5 lg:gap-4 2xl:gap-7 text-xs lg:text-[13px] 2xl:text-[14px] font-normal text-[#080331] whitespace-nowrap">
            <a href="#platform" className="inline-flex items-center gap-1 hover:text-[#4865FF] transition-colors group">
              <span>{t('nav.platform', 'Platform')}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="8" height="5" viewBox="0 0 9 6" fill="none" className="dropdown-chevron inline-block shrink-0 text-[#080331]/60 group-hover:text-[#4865FF] transition-colors">
                <path fillRule="evenodd" clipRule="evenodd" d="M0.146447 0.646202C0.341709 0.45094 0.658291 0.45094 0.853553 0.646202L4.49995 4.2926H4.50005L8.14645 0.646202C8.34171 0.45094 8.65829 0.45094 8.85355 0.646202C9.04882 0.841465 9.04882 1.15805 8.85355 1.35331L5.20715 4.99971C4.81659 5.39027 4.18341 5.39027 3.79285 4.99971L0.146447 1.35331C-0.0488155 1.15805 -0.0488155 0.841465 0.146447 0.646202Z" fill="currentColor"/>
              </svg>
            </a>

            <a href="#inspiration" className="hover:text-[#4865FF] transition-colors font-semibold text-[#4865FF]">
              Architecture &amp; Inspiration
            </a>

            <a href="#clinical-engine" className="inline-flex items-center gap-1 hover:text-[#4865FF] transition-colors group">
              <span>{t('nav.about', 'About Us')}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="8" height="5" viewBox="0 0 9 6" fill="none" className="dropdown-chevron inline-block shrink-0 text-[#080331]/60 group-hover:text-[#4865FF] transition-colors">
                <path fillRule="evenodd" clipRule="evenodd" d="M0.146447 0.646202C0.341709 0.45094 0.658291 0.45094 0.853553 0.646202L4.49995 4.2926H4.50005L8.14645 0.646202C8.34171 0.45094 8.65829 0.45094 8.85355 0.646202C9.04882 0.841465 9.04882 1.15805 8.85355 1.35331L5.20715 4.99971C4.81659 5.39027 4.18341 5.39027 3.79285 4.99971L0.146447 1.35331C-0.0488155 1.15805 -0.0488155 0.841465 0.146447 0.646202Z" fill="currentColor"/>
              </svg>
            </a>

            <a href="#hospitals" className="hover:text-[#4865FF] transition-colors">
              {t('nav.customers', 'Customers')}
            </a>

            <a href="#abdm" className="inline-flex items-center gap-1 hover:text-[#4865FF] transition-colors group">
              <span>{t('nav.resources', 'Resources')}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="8" height="5" viewBox="0 0 9 6" fill="none" className="dropdown-chevron inline-block shrink-0 text-[#080331]/60 group-hover:text-[#4865FF] transition-colors">
                <path fillRule="evenodd" clipRule="evenodd" d="M0.146447 0.646202C0.341709 0.45094 0.658291 0.45094 0.853553 0.646202L4.49995 4.2926H4.50005L8.14645 0.646202C8.34171 0.45094 8.65829 0.45094 8.85355 0.646202C9.04882 0.841465 9.04882 1.15805 8.85355 1.35331L5.20715 4.99971C4.81659 5.39027 4.18341 5.39027 3.79285 4.99971L0.146447 1.35331C-0.0488155 1.15805 -0.0488155 0.841465 0.146447 0.646202Z" fill="currentColor"/>
              </svg>
            </a>

            {/* Ayush Intelligence is intentionally not exposed in the homepage navbar. */}
            {false && (
            <a href="#intelligence" className="hidden">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="15" 
                height="15" 
                fill="none" 
                viewBox="0 0 19 19"
                className="w-3.5 h-3.5 shrink-0 group-hover:rotate-45 transition-transform duration-300"
              >
                <g strokeWidth=".7">
                  <path d="M6.501 1.53a4.03 4.03 0 0 1 5.697 0l.058.059.21.237.399-.02a4.03 4.03 0 0 1 4.028 4.029l-.001.083-.019.316.296.268a4.03 4.03 0 0 1 0 5.697l-.059.058-.237.21.02.399a4.03 4.03 0 0 1-4.028 4.028l-.083-.001-.316-.019-.268.296a4.03 4.03 0 0 1-5.697 0l-.058-.059-.21-.237-.399.02a4.03 4.03 0 0 1-4.028-4.029l.001-.083.019-.316-.296-.268a4.03 4.03 0 0 1 0-5.697l.059-.058.237-.21-.02-.399a4.03 4.03 0 0 1 4.029-4.028l.083.001.316.019.268-.296zm5.557 9.649a12.45 12.45 0 0 0-.879.88l-.476.559c-.375.467-.717.963-1.022 1.482l-.331.733c-.515.918-1.377 1.614-2.41 1.908 1.333 1.328 3.489 1.328 4.822-.001l.432-.526a3.42 3.42 0 0 0 .281-3.271l-.218-.685-.199-1.078zm-9.639 1.692c.003 1.882 1.528 3.406 3.41 3.409-.523-.938-.641-2.041-.356-3.054-1.013.285-2.115.167-3.053-.355zm13.861-.001c-.938.523-2.041.642-3.054.357.285 1.013.167 2.115-.355 3.053 1.882-.003 3.406-1.528 3.409-3.41zm-8.284-.253a12.4 12.4 0 0 0-1.771.325 3.42 3.42 0 0 0 .282 3.272 3.42 3.42 0 0 0 2.511-2.112c-.305-.52-.647-1.016-1.022-1.485zM9.348 5.24A13.05 13.05 0 0 1 5.24 9.349a13.05 13.05 0 0 1 4.104 4.107 13.05 13.05 0 0 1 4.112-4.112A13.05 13.05 0 0 1 9.348 5.24zM1.959 6.939c-1.328 1.333-1.328 3.489 0 4.822l.526.432a3.42 3.42 0 0 0 3.272.282l.685-.217 1.078-.199-.052-.056-.828-.823-.559-.476c-.467-.375-.962-.717-1.482-1.022l-.733-.331c-.918-.515-1.614-1.377-1.908-2.41zm12.14 2.741c-.519.305-1.015.647-1.482 1.022a12.41 12.41 0 0 0 .325 1.772 3.42 3.42 0 0 0 3.272-.282 3.42 3.42 0 0 0-2.114-2.512zm2.114-3.174a3.42 3.42 0 0 0-3.271-.282l-.685.217-1.078.198.526.547.353.332.559.475a12.41 12.41 0 0 0 1.485 1.023l.73.332c.918.515 1.614 1.377 1.908 2.41 1.328-1.333 1.328-3.489 0-4.822l-.526-.432zM5.757 6.225a3.42 3.42 0 0 0-3.272.282A3.42 3.42 0 0 0 4.59 9.015a12.4 12.4 0 0 0 1.491-1.029 12.4 12.4 0 0 0-.324-1.761zm6.003-4.266C10.427.631 8.271.631 6.938 1.96l-.432.526a3.42 3.42 0 0 0-.281 3.272l.217.685.197 1.067.633-.616h.03v-.031l.207-.223.477-.559c.378-.47.722-.968 1.029-1.491l.335-.723c.515-.918 1.377-1.614 2.41-1.908zm.433.526A3.42 3.42 0 0 0 9.68 4.6a12.4 12.4 0 0 0 1.022 1.482c.596-.065 1.189-.173 1.772-.324a3.42 3.42 0 0 0-.282-3.272zM5.828 2.42c-1.882.003-3.406 1.528-3.409 3.41.938-.523 2.041-.641 3.054-.356-.285-1.013-.167-2.115.355-3.054zm7.042 0c.523.938.641 2.041.356 3.054 1.013-.285 2.115-.167 3.054.355-.003-1.882-1.528-3.406-3.41-3.409z" stroke="#4865ff"/>
                  <path d="M6.50125 1.52991C8.07451 -0.0432944 10.6251 -0.0431154 12.1984 1.53011L12.2563 1.58902C12.33 1.66575 12.3999 1.74476 12.4664 1.82566C12.5975 1.81278 12.7306 1.80609 12.8652 1.80609C15.09 1.80618 16.8936 3.60985 16.8936 5.83469L16.8928 5.91737C16.8906 6.02368 16.884 6.12897 16.8738 6.2331C16.9757 6.31676 17.0746 6.40611 17.1697 6.5013C18.7429 8.07454 18.7429 10.6254 17.1697 12.1986L17.1106 12.2565C17.0339 12.3302 16.9547 12.4002 16.8738 12.4666C16.8867 12.5978 16.8936 12.7308 16.8936 12.8654C16.8935 15.0902 15.0899 16.8937 12.8652 16.8938L12.7823 16.893C12.6759 16.8909 12.5705 16.8845 12.4664 16.8742C12.3827 16.9761 12.2933 17.075 12.1982 17.1702C10.6249 18.7434 8.07426 18.7432 6.50105 17.17L6.44313 17.1111C6.36937 17.0343 6.29933 16.9552 6.23285 16.8742C6.10172 16.8871 5.96876 16.894 5.83424 16.894C3.60939 16.894 1.80589 15.0902 1.80584 12.8654L1.80664 12.7827C1.80879 12.6763 1.81497 12.5709 1.82522 12.4666C1.72339 12.383 1.62458 12.2937 1.52946 12.1986C-0.0436906 10.6254 -0.0436554 8.07472 1.52946 6.5015L1.58857 6.44358C1.66538 6.36981 1.74442 6.29959 1.82542 6.2331C1.81254 6.10198 1.80584 5.96901 1.80584 5.83449C1.80593 3.60965 3.6096 1.8061 5.83444 1.80609L5.91712 1.80689C6.02349 1.80904 6.12886 1.81523 6.23305 1.82547C6.31666 1.72364 6.40613 1.62503 6.50125 1.52991ZM12.0582 11.1793C11.7506 11.4576 11.4572 11.7512 11.1789 12.0588L10.7024 12.6174C10.3272 13.0848 9.98526 13.5802 9.68011 14.0998L9.3494 14.8325C8.83481 15.7502 7.97197 16.4464 6.939 16.7404C8.27181 18.0687 10.4283 18.0685 11.7608 16.7398L12.1928 16.2138C12.8449 15.2361 12.9391 13.996 12.4743 12.9423L12.2567 12.2573C12.1751 11.9004 12.1093 11.5407 12.0582 11.1793ZM2.41933 12.8712C2.4225 14.7529 3.94732 16.2775 5.82905 16.2803C5.30634 15.3419 5.18763 14.2394 5.47278 13.2265C4.45998 13.5115 3.35764 13.3937 2.41933 12.8712ZM16.2799 12.8704C15.3415 13.3932 14.2392 13.512 13.2262 13.2269C13.5113 14.2396 13.3934 15.3419 12.871 16.2801C14.7526 16.2769 16.2771 14.7521 16.2799 12.8704ZM7.99562 12.6176C7.39984 12.6828 6.80774 12.7907 6.22466 12.9423C5.7599 13.9961 5.8543 15.2362 6.50664 16.214C7.65825 15.9839 8.60096 15.1747 9.0179 14.1022C8.71286 13.5818 8.37094 13.0858 7.99562 12.6176ZM9.34841 5.23998C8.30625 6.89967 6.89923 8.30652 5.23953 9.34866C6.89715 10.3908 8.30228 11.7971 9.34321 13.4555C10.3859 11.7942 11.7942 10.386 13.4555 9.34326C11.7971 8.30237 10.3906 6.89756 9.34841 5.23998ZM1.95922 6.93945C0.63104 8.27221 0.631137 10.4285 1.95962 11.7611L2.48563 12.1932C3.46336 12.8454 4.7034 12.9396 5.75716 12.4748L6.44214 12.2573C6.79902 12.1757 7.15873 12.1098 7.52013 12.0586C7.50304 12.0397 7.48581 12.0209 7.46861 12.0021C7.20567 11.715 6.92933 11.4405 6.64064 11.1793L6.08167 10.7028C5.61432 10.3277 5.1193 9.98563 4.59988 9.68056L3.86717 9.34965C2.9495 8.83507 2.25323 7.97236 1.95922 6.93945ZM14.0993 9.68056C13.5798 9.98572 13.0844 10.3278 12.6169 10.703C12.6822 11.2992 12.7902 11.8916 12.9419 12.475C13.9957 12.9398 15.2358 12.8452 16.2136 12.1928C15.9833 11.0404 15.173 10.097 14.0993 9.68056ZM16.2134 6.50669C15.2356 5.85457 13.9955 5.76036 12.9419 6.22511L12.2569 6.44259C11.8999 6.52411 11.5401 6.58983 11.1787 6.64089C11.3486 6.82868 11.5241 7.01123 11.7051 7.18827C11.8207 7.30117 11.9382 7.41205 12.0582 7.52038L12.6171 7.99567C13.0855 8.37112 13.5818 8.7132 14.1023 9.01835L14.832 9.35005C15.7497 9.86462 16.4458 10.7275 16.7398 11.7605C18.0681 10.4277 18.0681 8.2714 16.7394 6.93885L16.2134 6.50669ZM5.75716 6.22511C4.70336 5.76039 3.46318 5.85453 2.48543 6.50689C2.71494 7.65579 3.5213 8.59672 4.5901 9.01515C5.11277 8.70841 5.61072 8.36412 6.08067 7.98648C6.01534 7.39392 5.90794 6.80507 5.75716 6.22511ZM11.76 1.95947C10.4272 0.631394 8.27086 0.631413 6.9384 1.96006L6.50624 2.48588C5.85409 3.46366 5.76025 4.70406 6.22506 5.75781L6.44214 6.44239C6.52289 6.79579 6.58835 7.15196 6.63924 7.5098C6.85754 7.31208 7.06861 7.10656 7.2723 6.89391H7.30245V6.86256C7.37238 6.78905 7.44143 6.71471 7.50954 6.63949L7.98623 6.08073C8.3639 5.61069 8.70833 5.1127 9.0151 4.58995L9.3496 3.86742C9.86416 2.94974 10.7271 2.2535 11.76 1.95947ZM12.1926 2.48588C11.0401 2.71613 10.0968 3.52659 9.68031 4.60033C9.98536 5.11972 10.3273 5.6148 10.7024 6.08212C11.2986 6.01696 11.8912 5.90951 12.4747 5.75781C12.9396 4.70395 12.845 3.4637 12.1926 2.48588ZM5.82825 2.41958C3.94668 2.42288 2.42211 3.94783 2.41933 5.8295C3.35779 5.30676 4.46019 5.18808 5.47318 5.47323C5.1881 4.46044 5.30576 3.3579 5.82825 2.41958ZM12.8702 2.41958C13.3929 3.358 13.5115 4.46026 13.2264 5.47323C14.2392 5.18822 15.3416 5.30621 16.2799 5.8287C16.2766 3.94707 14.7519 2.42236 12.8702 2.41958Z" stroke="url(#nav-ai-grad)"/>
                </g>
                <defs>
                  <linearGradient id="nav-ai-grad" x1="-1.483" y1="-1.835" x2="25.095" y2="14.495" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#cc7ab5"/>
                    <stop offset=".539" stopColor="#4865ff"/>
                  </linearGradient>
                </defs>
              </svg>
              <span 
                style={{
                  background: 'linear-gradient(121deg, #CC7AB5 -80.58%, #4865FF 36.36%, #1B1463 102.7%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }} 
                className="font-medium text-xs lg:text-[13px] 2xl:text-[14px]"
              >
                Ayush Intelligence
              </span>
            </a>
            )}

            {/* 3D Human Anatomy Viewer is intentionally not exposed in the homepage navbar. */}
            {false && (
            <button
              onClick={() => setIs3DViewerOpen(true)}
              className="hidden"
            >
              <span>3D Human</span>
              <span className="text-[10px] bg-[#4865ff]/10 group-hover:bg-[#4865ff] group-hover:text-white text-[#4865ff] font-bold px-1.5 py-0.5 rounded-full transition-colors">
                WebGL
              </span>
            </button>
            )}
          </div>

          {/* Right Actions: Language Selector, Doctor Login/Patient Portal, Try Kiosk */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Multilingual Selector (11 Indic Languages) - Placed FIRST so it's always visible! */}
            <LanguageSelector />

            {user ? (
              user.role === 'patient' ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link
                    to="/patient"
                    className="inline-flex items-center gap-1.5 bg-[#4865ff] hover:bg-[#3852e6] text-white text-xs sm:text-[13px] font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    <span>Patient Portal</span>
                    <ArrowRight size={12} className="text-white/70" />
                  </Link>
                  <button
                    onClick={() => signOut()}
                    title="Sign out of Patient Portal"
                    className="text-stone/60 hover:text-red-600 text-xs font-medium px-1.5 py-1 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 bg-[#080331] hover:bg-[#1b1463] text-white text-xs sm:text-[13px] font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Doctor Bay</span>
                    <ArrowRight size={12} className="text-white/70" />
                  </Link>
                  <button
                    onClick={() => signOut()}
                    title="Sign out of Vaidya Portal"
                    className="text-stone/60 hover:text-red-600 text-xs font-medium px-1.5 py-1 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Sign Out
                  </button>
                </div>
              )
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <button 
                  onClick={() => {
                    setAuthRole('vaidya');
                    setIsAuthModalOpen(true);
                  }}
                  className="text-[#080331] hover:text-[#4865FF] font-medium text-xs sm:text-[13px] whitespace-nowrap cursor-pointer transition-colors px-1"
                >
                  Doctor Login
                </button>
                <span className="text-[#080331]/20">|</span>
                <button 
                  onClick={() => {
                    setAuthRole('patient');
                    setIsAuthModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 bg-[#f8f3eb] hover:bg-[#ede6da] text-[#080331] border border-[#4d4439]/15 text-xs sm:text-[13px] font-medium px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full transition-all cursor-pointer whitespace-nowrap"
                >
                  <UploadCloud size={12} className="text-[#4865ff]" />
                  <span>Patient Login</span>
                </button>
              </div>
            )}

            <button 
              onClick={() => setIsKioskModalOpen(true)}
              className="bg-[#4865FF] hover:bg-[#3852e6] text-white text-xs sm:text-[13px] font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-[0_4px_14px_rgba(72,101,255,0.25)] transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer flex items-center gap-1"
            >
              <Touchpad size={13} />
              <span>{t('nav.tryKiosk', 'Try Kiosk')}</span>
            </button>
          </div>
        </nav>
      </div>

      {/* ──────────────────────────────────────────────────────────
          2. HERO SECTION WITH CIRCLING ORBIT & FLATTENING CURVE
          ────────────────────────────────────────────────────────── */}
      <header className="home-hero relative overflow-hidden bg-[#f8f3eb] min-h-[720px] sm:min-h-[780px] flex flex-col justify-between pt-36 sm:pt-44">
        
        {/* ── Exact August Health Hero Orbit Wheel & Spiral Animation ── */}
        <div className="home-hero_background-image-wrapper">
          <div className="home-hero_background">
            
            {/* Slot 1: Indian Doctor reviewing digital clinical intake on tablet */}
            <div className="home-hero_background-image">
              <div className="home-hero_counter-rotate relative w-full h-full rounded-full overflow-hidden border-[10px] sm:border-[14px] border-[#328a3b] shadow-[0_20px_50px_rgba(50,138,59,0.35)] bg-[#328a3b]">
                <img 
                  src="/indian-doctor-tablet-opd.webp" 
                  alt="Indian Doctor reviewing digital clinical intake on tablet" 
                  className="w-full h-full object-cover object-center scale-105" 
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-full"></div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-[11px] font-bold text-[#080331] shadow border border-[#328a3b]/20 whitespace-nowrap">
                  OPD Clinical Intake Tablet
                </div>
              </div>
            </div>

            {/* Slot 2: Multilingual intake, shown as a photographic orbit card */}
            <div className="home-hero_background-image">
              <div className="home-hero_counter-rotate relative w-full h-full rounded-full overflow-hidden border-[10px] sm:border-[14px] border-[#c9a15a] shadow-[0_20px_50px_rgba(142,108,45,0.3)] bg-[#c9a15a]">
                <img
                  src="/portrait-female-pediatrician-work-optimized.jpg"
                  alt="Clinician listening to a patient during a multilingual intake"
                  className="w-full h-full object-cover object-[58%_42%] scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#251f18]/55 via-transparent to-transparent"></div>
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-full"></div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#fffaf2]/95 backdrop-blur px-3 py-1 rounded-full text-[11px] font-bold text-[#332c24] shadow border border-[#c9a15a]/30 whitespace-nowrap">
                  Multilingual Patient Intake
                </div>
              </div>
            </div>

            {/* Slot 3: Indian Doctor Caring for Elderly Patient in Saree */}
            <div className="home-hero_background-image">
              <div className="home-hero_counter-rotate relative w-full h-full rounded-full overflow-hidden border-[10px] sm:border-[14px] border-[#ff6d39] shadow-[0_20px_50px_rgba(255,109,57,0.35)] bg-[#ff6d39]">
                <img 
                  src="/indian-doctor-patient-care.jpg" 
                  alt="Indian doctor caring for elderly patient in saree" 
                  className="w-full h-full object-cover object-center scale-105" 
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-full"></div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-[11px] font-bold text-[#080331] shadow border border-[#ff6d39]/20 whitespace-nowrap">
                  Vaidya Bedside Care
                </div>
              </div>
            </div>

            {/* Slot 4: Female Doctor & Pediatrician at Work (Blossom Pink #f098d7) */}
            <div className="home-hero_background-image">
              <div className="home-hero_counter-rotate relative w-full h-full rounded-full overflow-hidden border-[10px] sm:border-[14px] border-[#f098d7] shadow-[0_20px_50px_rgba(240,152,215,0.35)] bg-[#f098d7]">
                <img 
                  src="/portrait-female-pediatrician-work.webp" 
                  alt="Female pediatrician examining young patient" 
                  className="w-full h-full object-cover object-center scale-105" 
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-full"></div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-[11px] font-bold text-[#080331] shadow border border-[#f098d7]/20 whitespace-nowrap">
                  Pediatric &amp; Clinical Care
                </div>
              </div>
            </div>

            {/* Slot 5: Indian Doctor reviewing digital clinical intake on tablet (Repeating for smooth continuous orbit) */}
            <div className="home-hero_background-image">
              <div className="home-hero_counter-rotate relative w-full h-full rounded-full overflow-hidden border-[10px] sm:border-[14px] border-[#328a3b] shadow-[0_20px_50px_rgba(50,138,59,0.35)] bg-[#328a3b]">
                <img 
                  src="/indian-doctor-tablet-opd.webp" 
                  alt="Indian Doctor reviewing digital clinical intake on tablet" 
                  className="w-full h-full object-cover object-center scale-105" 
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-full"></div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-[11px] font-bold text-[#080331] shadow border border-[#328a3b]/20 whitespace-nowrap">
                  OPD Clinical Intake Tablet
                </div>
              </div>
            </div>

            {/* Slot 6: Multilingual intake repeat for the continuous orbit */}
            <div className="home-hero_background-image">
              <div className="home-hero_counter-rotate relative w-full h-full rounded-full overflow-hidden border-[10px] sm:border-[14px] border-[#8da38b] shadow-[0_20px_50px_rgba(88,112,87,0.3)] bg-[#8da38b]">
                <img
                  src="/indian-doctor-patient-care.jpg"
                  alt="Doctor and patient sharing a calm bedside consultation"
                  className="w-full h-full object-cover object-[48%_45%] scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#251f18]/55 via-transparent to-transparent"></div>
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-full"></div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#fffaf2]/95 backdrop-blur px-3 py-1 rounded-full text-[11px] font-bold text-[#332c24] shadow border border-[#8da38b]/30 whitespace-nowrap">
                  Speak in Your Language
                </div>
              </div>
            </div>

            {/* Slot 7: Indian Doctor Caring for Elderly Patient in Saree (Repeating for smooth continuous orbit) */}
            <div className="home-hero_background-image">
              <div className="home-hero_counter-rotate relative w-full h-full rounded-full overflow-hidden border-[10px] sm:border-[14px] border-[#ff6d39] shadow-[0_20px_50px_rgba(255,109,57,0.35)] bg-[#ff6d39]">
                <img 
                  src="/indian-doctor-patient-care.jpg" 
                  alt="Indian doctor caring for elderly patient in saree" 
                  className="w-full h-full object-cover object-center scale-105" 
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-full"></div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-[11px] font-bold text-[#080331] shadow border border-[#ff6d39]/20 whitespace-nowrap">
                  Vaidya Bedside Care
                </div>
              </div>
            </div>

            {/* Slot 8: Female Doctor & Pediatrician at Work (Blossom Pink #f098d7, Repeating for smooth continuous orbit) */}
            <div className="home-hero_background-image">
              <div className="home-hero_counter-rotate relative w-full h-full rounded-full overflow-hidden border-[10px] sm:border-[14px] border-[#f098d7] shadow-[0_20px_50px_rgba(240,152,215,0.35)] bg-[#f098d7]">
                <img 
                  src="/portrait-female-pediatrician-work.webp" 
                  alt="Female pediatrician examining young patient" 
                  className="w-full h-full object-cover object-center scale-105" 
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-full"></div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-[11px] font-bold text-[#080331] shadow border border-[#f098d7]/20 whitespace-nowrap">
                  Pediatric &amp; Clinical Care
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Center Hero Content (Immediate Clinical Purpose for Evaluators & Doctors) */}
        <div className="relative z-10 max-w-[560px] sm:max-w-[620px] lg:max-w-[660px] mx-auto px-4 sm:px-6 text-center my-auto">
          
          {/* Top Pill Announcement with Live Indicator */}
          <div className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 sm:px-4 py-1.5 rounded-full border border-[#4d4439]/15 text-[#080331] text-[11px] sm:text-xs font-medium mb-5 shadow-[0_4px_12px_rgba(75,68,57,0.06)]">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#328a3b] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#328a3b]"></span>
            </span>
            <span className="font-semibold tracking-wide">{t('hero.badge', 'MEDICHAIN AI · MINEARENA 1.0')}</span>
            <span className="text-stone/30">|</span>
            <span className="text-[#4865ff] font-semibold">Dual-Mode Voice &amp; Touch Kiosk</span>
          </div>

          {/* Unmistakable Editorial Headline */}
          <h1 className="font-serif text-[38px] sm:text-[50px] md:text-[56px] lg:text-[64px] leading-[1.06] text-[#080331] font-normal tracking-[-0.015em] mb-5 max-w-[640px] mx-auto">
            {t('hero.title', 'Patient-Owned Health Records & Autonomous Clinical Intake')}
          </h1>

          {/* Subtitle: Plain, human, universally understandable */}
          <p className="font-sans text-[15px] sm:text-[17px] md:text-[18px] text-[#333333] font-normal leading-relaxed max-w-[520px] mx-auto mb-8">
            {t('hero.subtitle', 'Patients speak in their mother tongue or tap through adaptive AI MCQs while waiting. Doctors receive a complete, structured clinical summary before the patient walks in.')}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-10">
            <button 
              onClick={() => setIsKioskModalOpen(true)}
              className="home-hero-primary bg-[#4865ff] hover:bg-[#3855eb] text-white font-medium text-[15px] sm:text-[16px] px-7 sm:px-8 py-3 sm:py-3.5 rounded-full shadow-[0_12px_24px_rgba(72,101,255,0.28)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
            >
              <Touchpad size={18} />
              <span>{t('hero.btnTouch', 'Start Touch & Voice Kiosk')}</span>
              <ArrowRight size={16} />
            </button>
            <button 
              onClick={() => setIsVoiceModalOpen(true)}
              className="bg-white hover:bg-[#f8f3eb] text-[#080331] border border-[#4d4439]/20 font-medium text-[15px] sm:text-[16px] px-6 sm:px-7 py-3 sm:py-3.5 rounded-full shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2"
            >
              <Mic size={16} className="text-[#4865ff]" />
              <span>{t('hero.btnVoice', 'Voice Assistant Call')}</span>
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="home-hero-secondary bg-[#080331] hover:bg-[#1b1463] text-white font-medium text-[15px] sm:text-[16px] px-6 sm:px-7 py-3 sm:py-3.5 rounded-full shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {t('nav.doctorDashboard', 'Doctor Dashboard')}
            </button>
          </div>

        </div>

        {/* ── Scroll-Driven Flattening Curve: Curved at top, becomes straight as you scroll down ── */}
        <div className="relative z-10 w-full overflow-hidden transition-all duration-75">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="100%" 
            viewBox="0 0 1440 96" 
            fill="none" 
            preserveAspectRatio="none" 
            style={{ 
              height: `${heroCurveHeight}px`, 
              display: heroCurveHeight > 0.5 ? 'block' : 'none' 
            }}
            className="w-full text-white transition-all duration-75"
          >
            <path 
              d="M1440 95.9998V-0.000244141C1210.89 62.9522 967.639 95.9998 720 95.9998C472.361 95.9998 229.107 62.9522 0 -0.000244141V95.9998H720H1440Z" 
              fill="#ffffff"
            />
          </svg>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────
          3. LOGO TRUST STRIP (Apex Indian Healthcare Institutions)
          ────────────────────────────────────────────────────────── */}
      <section id="hospitals" className="bg-white py-12 px-6 border-b border-[#f0ece5]">
        <div className="max-w-[1140px] mx-auto text-center">
          <h2 className="font-serif text-[22px] sm:text-[26px] text-[#080331] font-normal mb-8">
            Engineered for apex hospital networks &amp; Ayush institutions
          </h2>
          
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70 grayscale hover:grayscale-0 transition-all">
            <div className="font-serif text-base sm:text-lg tracking-wider text-stone font-bold">AIIMS NEW DELHI</div>
            <div className="font-serif text-base sm:text-lg tracking-wider text-stone font-bold">MINISTRY OF AYUSH</div>
            <div className="font-serif text-base sm:text-lg tracking-wider text-stone font-bold">NATIONAL HEALTH AUTHORITY (ABDM)</div>
            <div className="font-serif text-base sm:text-lg tracking-wider text-stone font-bold">NATIONAL INSTITUTE OF AYURVEDA</div>
            <div className="font-serif text-base sm:text-lg tracking-wider text-stone font-bold">C-DAC HEALTH INFORMATICS</div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          4. THE PLATFORM — 2x2 FEATURE CARDS (100% PS 26047 Terms)
          ────────────────────────────────────────────────────────── */}
      <section id="platform" className="home-platform bg-white py-24 sm:py-32 px-6">
        <div className="max-w-[1140px] mx-auto">
          
          {/* Section Pill Header */}
          <div className="text-center mb-16 sm:mb-20">
            <span className="text-xs font-semibold tracking-widest text-[#080331] uppercase bg-[#f8f3eb] px-4 py-1.5 rounded-full border border-[#4d4439]/10 shadow-sm">
              THE PLATFORM
            </span>
            <h2 className="font-serif text-[38px] sm:text-[48px] text-[#080331] font-normal mt-4">
              Get to know us
            </h2>
          </div>

          {/* 2x2 Feature Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* ──── CARD 1: Autonomous Case-Taking (Sage Tint #eef5ee) ──── */}
            <div className="bg-[#eef5ee] rounded-[24px] p-8 sm:p-10 flex flex-col justify-between border border-[#328a3b]/15 shadow-warm-sm hover:shadow-warm-md transition-all">
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                    <img 
                      src="https://cdn.prod.website-files.com/66edc8605d3cdc1787681a9b/66f081010f9164245eb640dd_House%2BCheck.avif" 
                      alt="House Check" 
                      className="w-10 h-10 object-contain"
                    />
                  </div>

                  <button 
                    onClick={() => navigate('/dashboard')}
                    title="Open Doctor OPD Queue"
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[#080331] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 32 32" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M18.3131 7.31319C18.5084 7.11793 18.825 7.11793 19.0202 7.31319L27.3536 15.6465C27.5488 15.8418 27.5488 16.1584 27.3536 16.3536L19.0202 24.687C18.825 24.8822 18.5084 24.8822 18.3131 24.687C18.1179 24.4917 18.1179 24.1751 18.3131 23.9799L25.7929 16.5001H5C4.72386 16.5001 4.5 16.2762 4.5 16.0001C4.5 15.7239 4.72386 15.5001 5 15.5001H25.7929L18.3131 8.0203C18.1179 7.82504 18.1179 7.50846 18.3131 7.31319Z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>

                <h3 className="font-serif text-[30px] sm:text-[32px] text-[#080331] font-normal mb-3">
                  Autonomous Case-Taking
                </h3>

                <p className="font-sans text-[15px] sm:text-[16px] text-[#333333] leading-relaxed mb-8">
                  Patients speak or tap in 12 Indian languages. The kiosk gathers structured symptom history so doctors don't start from scratch.
                </p>
              </div>

              {/* Embedded White Card (Live OPD Queue) */}
              <div 
                onClick={() => navigate('/dashboard')}
                className="bg-white rounded-2xl p-5 shadow-[0_12px_24px_rgba(75,68,57,0.06)] border border-[#4d4439]/10 cursor-pointer hover:border-[#4865ff]/40 hover:shadow-warm-md transition-all group"
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#f0ece5]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#080331] group-hover:text-[#4865ff] transition-colors">Live OPD Queue</span>
                    <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">InsForge Live DB</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-stone/70 bg-[#f8f3eb] px-2.5 py-1 rounded-full group-hover:bg-[#4865ff]/10 group-hover:text-[#4865ff] transition-colors">
                    <span>View Portal &rarr;</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-[#f6f2ec]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#ff6d39]/20 text-[#ff6d39] font-bold flex items-center justify-center text-[10px]">
                        RP
                      </div>
                      <div>
                        <div className="font-medium text-[#080331]">Rameshwar Prasad</div>
                        <div className="text-[10px] text-stone/60">ABHA: 91-8291-3829 (Age 68)</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-semibold text-[10px]">
                      Chest Pain (Triage)
                    </span>
                    <span className="text-[11px] text-stone/70">Just now</span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[#f6f2ec]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#4865ff]/20 text-[#4865ff] font-bold flex items-center justify-center text-[10px]">
                        SD
                      </div>
                      <div>
                        <div className="font-medium text-[#080331]">Sunita Devi</div>
                        <div className="text-[10px] text-stone/60">Guest Mode (Token #43)</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#328a3b]/10 text-[#328a3b] font-medium text-[10px]">
                      Ahara Intake Done
                    </span>
                    <span className="text-[11px] text-stone/70">4m ago</span>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#f098d7]/40 text-[#1b1463] font-bold flex items-center justify-center text-[10px]">
                        RK
                      </div>
                      <div>
                        <div className="font-medium text-[#080331]">Rajesh Kumar</div>
                        <div className="text-[10px] text-stone/60">Aadhaar-OTP Verified</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#dce4fb] text-[#1b1463] font-medium text-[10px]">
                      SOCRATES 6/10
                    </span>
                    <span className="text-[11px] text-stone/70">12m ago</span>
                  </div>
                </div>
              </div>

            </div>

            {/* ──── CARD 2: Sarvam Vision OCR (Peach Tint #fbf1ec) ──── */}
            <div className="bg-[#fbf1ec] rounded-[24px] p-8 sm:p-10 flex flex-col justify-between border border-[#ff6d39]/15 shadow-warm-sm hover:shadow-warm-md transition-all">
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                    <img 
                      src="https://cdn.prod.website-files.com/66edc8605d3cdc1787681a9b/6847eb6786e6bd76a1d0647a_pill.svg" 
                      alt="Pill" 
                      className="w-10 h-10 object-contain"
                    />
                  </div>

                  <button 
                    onClick={() => navigate('/patient')}
                    title="Open Patient Prescription & Record Upload Portal"
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[#080331] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 32 32" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M18.3131 7.31319C18.5084 7.11793 18.825 7.11793 19.0202 7.31319L27.3536 15.6465C27.5488 15.8418 27.5488 16.1584 27.3536 16.3536L19.0202 24.687C18.825 24.8822 18.5084 24.8822 18.3131 24.687C18.1179 24.4917 18.1179 24.1751 18.3131 23.9799L25.7929 16.5001H5C4.72386 16.5001 4.5 16.2762 4.5 16.0001C4.5 15.7239 4.72386 15.5001 5 15.5001H25.7929L18.3131 8.0203C18.1179 7.82504 18.1179 7.50846 18.3131 7.31319Z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>

                <h3 className="font-serif text-[30px] sm:text-[32px] text-[#080331] font-normal mb-3">
                  Prescription &amp; Lab OCR
                </h3>

                <p className="font-sans text-[15px] sm:text-[16px] text-[#333333] leading-relaxed mb-8">
                  Instantly scans crumpled handwritten prescriptions and lab slips. Extracts past medications, dosages, and active allergies in seconds.
                </p>
              </div>

              {/* Embedded White Card (Extracted Indian Prescription) */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_12px_24px_rgba(75,68,57,0.06)] border border-[#4d4439]/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-[#080331] tracking-wide">
                    PANTOCID-D (PANTOPRAZOLE + DOMPERIDONE)
                  </span>
                  <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                    <AlertTriangle size={11} />
                    <span>Sulfa Allergy Alert</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-[#080331] text-white text-xs font-semibold px-2.5 py-0.5 rounded">1 Cap</span>
                  <span className="bg-[#080331] text-white text-xs font-semibold px-2.5 py-0.5 rounded">Morning (Empty Stomach)</span>
                </div>

                <div className="text-xs space-y-1.5 text-[#333333]">
                  <div className="font-semibold text-[#080331]">TAKE 1 CAPSULE DAILY BEFORE BREAKFAST</div>
                  <div className="flex justify-between text-stone/70">
                    <span>Diagnosis:</span>
                    <span className="font-medium text-[#080331]">Gastroesophageal Reflux (GERD)</span>
                  </div>
                  <div className="flex justify-between text-stone/70">
                    <span>Extracted from Rx:</span>
                    <span className="font-medium text-[#080331]">Dr. A. K. Sen, MD (AIIMS New Delhi)</span>
                  </div>
                  <div className="flex justify-between text-stone/70">
                    <span>Lab Flag:</span>
                    <span className="font-medium text-red-600 font-semibold">HbA1c: 8.4% (Diabetic Risk Detected)</span>
                  </div>
                </div>
              </div>

            </div>

            {/* ──── CARD 3: Ahara-Vihara Pariksha (Pink Wash #fdf2f7) ──── */}
            <div className="bg-[#fdf2f7] rounded-[24px] p-8 sm:p-10 flex flex-col justify-between border border-[#f098d7]/25 shadow-warm-sm hover:shadow-warm-md transition-all">
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                    <img 
                      src="https://cdn.prod.website-files.com/66edc8605d3cdc1787681a9b/6847eb672d1dd6f6d02427da_Vector.svg" 
                      alt="Care Track" 
                      className="w-10 h-10 object-contain"
                    />
                  </div>

                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[#080331] hover:scale-110 transition-all cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 32 32" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M18.3131 7.31319C18.5084 7.11793 18.825 7.11793 19.0202 7.31319L27.3536 15.6465C27.5488 15.8418 27.5488 16.1584 27.3536 16.3536L19.0202 24.687C18.825 24.8822 18.5084 24.8822 18.3131 24.687C18.1179 24.4917 18.1179 24.1751 18.3131 23.9799L25.7929 16.5001H5C4.72386 16.5001 4.5 16.2762 4.5 16.0001C4.5 15.7239 4.72386 15.5001 5 15.5001H25.7929L18.3131 8.0203C18.1179 7.82504 18.1179 7.50846 18.3131 7.31319Z" fill="currentColor"/>
                    </svg>
                  </div>
                </div>

                <h3 className="font-serif text-[30px] sm:text-[32px] text-[#080331] font-normal mb-3">
                  Ayush Dosha &amp; Lifestyle Track
                </h3>

                <p className="font-sans text-[15px] sm:text-[16px] text-[#333333] leading-relaxed mb-8">
                  Captures diet (Ahara), lifestyle (Vihara), and Prakriti symptoms. Vaidyas receive an Ayush-ready clinical summary upon patient arrival.
                </p>
              </div>

              {/* Embedded White Card (Ahara-Vihara Task) */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_12px_24px_rgba(75,68,57,0.06)] border border-[#4d4439]/10">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#f0ece5]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#f098d7]/40 flex items-center justify-center font-bold text-xs text-[#080331]">
                      SD
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-[#080331]">Sunita Devi</div>
                      <div className="text-[10px] text-stone/60">Token #43 · OPD Ayush Bay</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#328a3b] flex items-center gap-1">
                    <Check size={12} />
                    <span>Dashavidha Ready</span>
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#fdf2f7] border border-[#f098d7]/30 text-[#080331]">
                    <span className="font-semibold text-[11px] text-[#1b1463] block mb-0.5">Ahara Intake (Diet)</span>
                    <span>Dominant Rasa: Katu (Pungent) &amp; Lavana (Salty). Irregular timings (Vishamashana).</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#fdf2f7] border border-[#f098d7]/30 text-[#080331]">
                    <span className="font-semibold text-[11px] text-[#1b1463] block mb-0.5">Vihara (Lifestyle &amp; Sleep)</span>
                    <span>Ratri Jagarana (Late night waking). Prepared for Vaidya physical examination.</span>
                  </div>
                </div>
              </div>

            </div>

            {/* ──── CARD 4: Insights & Triage (Soft Blue Tint #f0f4fd) ──── */}
            <div className="bg-[#f0f4fd] rounded-[24px] p-8 sm:p-10 flex flex-col justify-between border border-[#4865ff]/15 shadow-warm-sm hover:shadow-warm-md transition-all">
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                    <img 
                      src="https://cdn.prod.website-files.com/66edc8605d3cdc1787681a9b/66f184d07fe2242cd8c9a3a5_Eye.avif" 
                      alt="Eye" 
                      className="w-10 h-10 object-contain"
                    />
                  </div>

                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[#080331] hover:scale-110 transition-all cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 32 32" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M18.3131 7.31319C18.5084 7.11793 18.825 7.11793 19.0202 7.31319L27.3536 15.6465C27.5488 15.8418 27.5488 16.1584 27.3536 16.3536L19.0202 24.687C18.825 24.8822 18.5084 24.8822 18.3131 24.687C18.1179 24.4917 18.1179 24.1751 18.3131 23.9799L25.7929 16.5001H5C4.72386 16.5001 4.5 16.2762 4.5 16.0001C4.5 15.7239 4.72386 15.5001 5 15.5001H25.7929L18.3131 8.0203C18.1179 7.82504 18.1179 7.50846 18.3131 7.31319Z" fill="currentColor"/>
                    </svg>
                  </div>
                </div>

                <h3 className="font-serif text-[30px] sm:text-[32px] text-[#080331] font-normal mb-3">
                  Real-Time Triage &amp; Alerts
                </h3>

                <p className="font-sans text-[15px] sm:text-[16px] text-[#333333] leading-relaxed mb-8">
                  Monitors waiting patients in real time. Acute red-flag signs like sudden chest pain or high fever immediately alert the nurse station.
                </p>
              </div>

              {/* Embedded White Card (Acuity Chart) */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_12px_24px_rgba(75,68,57,0.06)] border border-[#4d4439]/10">
                <div className="flex items-center justify-between pb-2 mb-3">
                  <span className="font-semibold text-xs text-[#080331]">OPD Acuity &amp; Red-Flags Over Time</span>
                  <span className="text-[10px] text-[#4865ff] font-medium bg-[#dce4fb] px-2 py-0.5 rounded-full">Live WebSocket</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-end gap-1.5 h-20 pt-2 border-b border-stone/15 pb-1">
                    {[45, 60, 52, 70, 65, 82, 78, 90, 85, 95, 88, 92, 98, 86, 94].map((height, i) => (
                      <div key={i} className="flex-1 flex flex-col justify-end h-full gap-0.5">
                        <div style={{ height: `${height * 0.25}%` }} className="bg-[#ff6d39] rounded-t-sm"></div>
                        <div style={{ height: `${height * 0.35}%` }} className="bg-[#f098d7]"></div>
                        <div style={{ height: `${height * 0.4}%` }} className="bg-[#4865ff] rounded-b-sm"></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-stone/50 font-mono pt-1">
                    <span>8:00 AM</span>
                    <span>10:00 AM (Peak)</span>
                    <span>12:00 PM</span>
                    <span>2:00 PM</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          4B. MEDICHAIN AI — INSPIRATION, ARCHITECTURE & ROADMAP
          ────────────────────────────────────────────────────────── */}
      <MediChainOverviewSection />

      {/* ──────────────────────────────────────────────────────────
          5. OUR VALUES SECTION (Exact August Health Multi-Colored Border)
          ────────────────────────────────────────────────────────── */}
      <section id="clinical-engine" className="home-values values_section text-white pt-24 sm:pt-32 pb-0 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-[1140px] mx-auto">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/20 bg-white/5 text-white/90 text-[11px] font-semibold tracking-widest uppercase mb-6 backdrop-blur">
              OUR VALUES
            </div>

            <h2 className="font-serif text-[38px] sm:text-[54px] lg:text-[62px] leading-[1.08] font-normal text-white mb-6">
              Designed for forward-thinking, <br className="hidden sm:inline" />
              care-obsessed operators
            </h2>

            <p className="font-sans text-[17px] sm:text-[19px] text-white/80 font-normal leading-relaxed max-w-[680px] mx-auto">
              We believe government hospital OPDs and Ayush institutions deserve exceptional technology that enables them to provide exceptional care.
            </p>
          </div>

          {/* Values Row Container with Exact August Health SVG Border & Dots */}
          <div className="values_row max-w-[880px] mx-auto p-5 sm:p-7 md:p-8 flex flex-col gap-6 relative">
            
            {/* Multi-Colored Animated SVG Border Overlay */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="100%" 
              viewBox="0 0 834 590" 
              fill="none" 
              preserveAspectRatio="none" 
              className="animated-border"
            >
              {/* Static Colored Path Segments (Visible at all times matching screenshot) */}
              <path 
                d="M1 109V49C1 22.4903 22.4903 1 49 1H785C811.51 1 833 22.4903 833 49V294.5" 
                stroke="#328A3B" 
                strokeWidth="2" 
                strokeOpacity="0.45"
                vectorEffect="non-scaling-stroke" 
              />
              <path 
                d="M833 295V540.5C833 567.01 811.51 588.5 785 588.5H49C22.4904 588.5 1 569.01 1 542.5V480.5" 
                stroke="#FF6D39" 
                strokeWidth="2" 
                strokeOpacity="0.45"
                vectorEffect="non-scaling-stroke" 
              />
              <path 
                d="M1 480.5V109" 
                stroke="#F098D7" 
                strokeWidth="2" 
                strokeOpacity="0.45"
                vectorEffect="non-scaling-stroke" 
              />

              {/* Animated Drawing Path Segments (Flowing neon pulse) */}
              <path 
                d="M1 109V49C1 22.4903 22.4903 1 49 1H785C811.51 1 833 22.4903 833 49V294.5" 
                stroke="#328A3B" 
                strokeWidth="2.5" 
                vectorEffect="non-scaling-stroke" 
                className="animated-path-green"
              />
              <path 
                d="M833 295V540.5C833 567.01 811.51 588.5 785 588.5H49C22.4904 588.5 1 569.01 1 542.5V480.5" 
                stroke="#FF6D39" 
                strokeWidth="2.5" 
                vectorEffect="non-scaling-stroke" 
                className="animated-path-orange"
              />
              <path 
                d="M1 480.5V109" 
                stroke="#F098D7" 
                strokeWidth="2.5" 
                vectorEffect="non-scaling-stroke" 
                className="animated-path-pink"
              />
            </svg>

            {/* Indicator Dots on the Border (y = 18.5%, y = 50.0%, y = 81.4%) */}
            {/* Green Dot (Left Border, y = 18.5%) */}
            <div className="absolute left-[-5px] top-[18.5%] -translate-y-1/2 z-20 pointer-events-none">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-[#328A3B] shadow-[0_0_8px_#328A3B]"></div>
                <div className="absolute -inset-1 rounded-full bg-[#328A3B]/50 animate-ping"></div>
              </div>
            </div>

            {/* Orange Dot (Right Border, y = 50.0%) */}
            <div className="absolute right-[-5px] top-[50%] -translate-y-1/2 z-20 pointer-events-none">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF6D39] shadow-[0_0_8px_#FF6D39]"></div>
                <div className="absolute -inset-1 rounded-full bg-[#FF6D39]/50 animate-ping"></div>
              </div>
            </div>

            {/* Pink Dot (Left Border, y = 81.4%) */}
            <div className="absolute left-[-5px] top-[81.4%] -translate-y-1/2 z-20 pointer-events-none">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-[#F098D7] shadow-[0_0_8px_#F098D7]"></div>
                <div className="absolute -inset-1 rounded-full bg-[#F098D7]/50 animate-ping"></div>
              </div>
            </div>

            {/* ──── CARD 1: Accessible Data, Actionable Insights (Vibrant Green #328A3B) ──── */}
            <div className="bg-[#328A3B] rounded-2xl p-6 sm:p-8 md:p-9 text-white grid grid-cols-1 md:grid-cols-12 gap-6 items-center shadow-lg relative z-10">
              <div className="md:col-span-5">
                <h3 className="font-serif text-[28px] sm:text-[34px] leading-[1.15] font-normal text-white">
                  Accessible data, <br className="hidden sm:inline" />actionable insights
                </h3>
              </div>
              <div className="md:col-span-7">
                <p className="font-sans text-[15px] sm:text-[16px] text-white/95 leading-relaxed font-normal">
                  An operating strategy is only as good as the clinical data driving it. Our embedded BI dashboard delivers unmatched visibility and predictive capabilities for patient care, triage red flags, and performance oversight at your OPDs.
                </p>
              </div>
            </div>

            {/* Floating Updates Pill (Matching media_1788539072329.png) */}
            <div className="flex justify-center -my-2 relative z-20">
              <div className="inline-flex items-center gap-2.5 bg-[#f8f3eb] text-[#080331] text-xs sm:text-sm font-semibold px-5 py-1.5 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.25)] hover:scale-105 transition-all cursor-pointer border border-[#080331]/10">
                <span>Explore MineArena 1.0 &amp; MediChain Architecture</span>
                <span className="w-5 h-5 rounded-full border border-[#080331]/25 flex items-center justify-center text-xs">→</span>
              </div>
            </div>

            {/* ──── CARD 2: Unquestionably Caregiver-Friendly (Vibrant Orange #FF6D39) ──── */}
            <div className="bg-[#FF6D39] rounded-2xl p-6 sm:p-8 md:p-9 text-[#080331] grid grid-cols-1 md:grid-cols-12 gap-6 items-center shadow-lg relative z-10">
              <div className="md:col-span-5">
                <h3 className="font-serif text-[28px] sm:text-[34px] leading-[1.15] font-normal text-[#080331]">
                  Unquestionably caregiver-friendly
                </h3>
              </div>
              <div className="md:col-span-7">
                <p className="font-sans text-[15px] sm:text-[16px] text-[#080331]/95 leading-relaxed font-normal">
                  AyushKiosk is easy to learn and easy to use. Hospital OPDs rapidly adopt our platform because every interface and interaction is designed to be efficient, intuitive, and helpful — allowing clinicians to focus on patient healing.
                </p>
              </div>
            </div>

            {/* ──── CARD 3: Purpose-Built for Proactive Care (Blossom Pink #F098D7) ──── */}
            <div className="bg-[#F098D7] rounded-2xl p-6 sm:p-8 md:p-9 text-[#080331] grid grid-cols-1 md:grid-cols-12 gap-6 items-center shadow-lg relative z-10">
              <div className="md:col-span-5">
                <h3 className="font-serif text-[28px] sm:text-[34px] leading-[1.15] font-normal text-[#080331]">
                  Purpose-built for proactive care
                </h3>
              </div>
              <div className="md:col-span-7">
                <p className="font-sans text-[15px] sm:text-[16px] text-[#080331]/95 leading-relaxed font-normal">
                  We help OPD operators shift from reactive queues to proactive care strategies. Built-in intelligence and smarter intake workflows help you spot trends, address risks earlier, and stay a step ahead of everything from increasing patient load to compliance deadlines.
                </p>
              </div>
            </div>

          </div>

          {/* Bottom Curved Section Break (Curving smoothly into the cream canvas below, flattens to straight as user scrolls down) */}
          <div 
            ref={valuesCurveRef}
            className="w-full overflow-hidden text-[#f8f3eb] -mb-1 mt-16 sm:mt-24 pointer-events-none"
          >
            <div 
              style={{ 
                height: `${valuesCurveHeight}px`,
                overflow: 'hidden',
                transition: 'height 0.04s ease-out'
              }}
              className="w-full flex items-end"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="100%" 
                viewBox="0 0 1440 96" 
                fill="none" 
                preserveAspectRatio="none" 
                className="w-full h-full block text-[#f8f3eb]"
              >
                <path 
                  d="M1440 95.9998V-0.000244141C1210.89 62.9522 967.639 95.9998 720 95.9998C472.361 95.9998 229.107 62.9522 0 -0.000244141V95.9998H720H1440Z" 
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          6. CASE STUDIES & IMPACT SWIPER CAROUSEL (Matching media_1788539321397.png & media_1788541599921.png)
          ────────────────────────────────────────────────────────── */}
      <section id="abdm" className="home-impact py-24 sm:py-32 px-4 sm:px-6 overflow-hidden bg-[#f8f3eb] relative">
        
        {/* Subtle Background Dot Grid Pattern Behind Cards (Matching media_1788541599921.png) */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(75, 68, 57, 0.22) 1.5px, transparent 1.5px)',
            backgroundSize: '22px 22px',
            backgroundPosition: 'center',
          }}
        />

        {/* Authentic August Health Case-Study Background Texture */}
        <div className="layout364_bg-image pointer-events-none absolute inset-0 z-0 opacity-40 flex justify-center overflow-hidden">
          <img 
            src="https://cdn.prod.website-files.com/66edc8605d3cdc1787681a9b/670833b7ec7327f9bcd6a658_Frame%201597883881.avif" 
            alt="" 
            className="w-full max-w-[1440px] h-full object-cover object-top mix-blend-multiply"
          />
        </div>

        <div className="relative z-10 max-w-[1140px] mx-auto text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#4d4439]/10 bg-white text-[#080331] text-[11px] font-semibold tracking-widest uppercase mb-4 shadow-sm">
            CASE STUDIES &amp; CLINICAL IMPACT
          </div>
          <h2 className="font-serif text-[36px] sm:text-[50px] leading-[1.1] font-normal text-[#080331] max-w-[840px] mx-auto mb-4">
            Clinicians &amp; hospital networks rely on AyushKiosk to eliminate OPD documentation bottlenecks
          </h2>
          <p className="font-sans text-[17px] sm:text-[19px] text-[#333333] font-normal leading-relaxed max-w-[620px] mx-auto">
            Apex healthcare institutions run faster and triage smarter with AyushKiosk.
          </p>
        </div>

        {/* Horizontal Swiper Track */}
        <div 
          ref={carouselRef}
          className="relative z-10 flex gap-6 sm:gap-8 overflow-x-auto pb-8 pt-2 px-4 sm:px-8 max-w-[1360px] mx-auto hide-scrollbar snap-x snap-mandatory scroll-smooth"
        >
          
          {/* ──── SLIDE 1: Orange Card (Koelsch equivalent with dotted up arrow) ──── */}
          <div className="w-[320px] sm:w-[380px] md:w-[400px] shrink-0 h-[490px] sm:h-[520px] bg-[#FF6D39] rounded-[28px] p-7 sm:p-9 flex flex-col justify-between snap-center shadow-[0_12px_24px_rgba(75,68,57,0.1),0_48px_48px_rgba(75,68,57,0.1)] hover:-translate-y-2.5 hover:shadow-[0_24px_36px_rgba(75,68,57,0.18)] transition-all duration-300 group text-[#080331]">
            <div>
              <img 
                src="https://cdn.prod.website-files.com/66eee3543901a7715c75d59d/670242d76b703da05336b53d_6701bea971ef993ea9be5fcf_arrow-up.png" 
                alt="Transform" 
                className="w-14 h-14 object-contain mb-6"
              />
              <h3 className="font-serif text-[28px] sm:text-[34px] leading-[1.18] font-normal text-[#080331]">
                Transform your OPD waiting rooms within weeks
              </h3>
            </div>

            <div>
              <div className="w-full h-px bg-[#080331]/20 my-5"></div>
              <div className="text-[11px] font-bold tracking-wider text-[#080331]/75 uppercase mb-2">
                AIIMS &amp; CENTRAL AYUSH NETWORK
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-[13px] sm:text-[14px] text-[#080331]/90 leading-snug font-normal">
                  How apex hospital networks deployed AyushKiosk across 40 outpatient bays, eliminating 70% of doctor documentation time in under 30 days.
                </p>
                <div className="w-12 h-12 rounded-full border border-[#080331]/40 flex items-center justify-center text-[#080331] group-hover:scale-110 group-hover:bg-[#080331] group-hover:text-white transition-all shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 48 48" fill="none">
                    <path d="M0.5 24C0.5 11.0213 11.0213 0.5 24 0.5C36.9787 0.5 47.5 11.0213 47.5 24C47.5 36.9787 36.9787 47.5 24 47.5C11.0213 47.5 0.5 36.9787 0.5 24Z" stroke="currentColor"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M26.3131 15.3132C26.5084 15.1179 26.825 15.1179 27.0202 15.3132L35.3536 23.6465C35.5488 23.8418 35.5488 24.1584 35.3536 24.3536L27.0202 32.687C26.825 32.8822 26.5084 32.8822 26.3131 32.687C26.1179 32.4917 26.1179 32.1751 26.3131 31.9799L33.7929 24.5001H13C12.7239 24.5001 12.5 24.2762 12.5 24.0001C12.5 23.7239 12.7239 23.5001 13 23.5001H33.7929L26.3131 16.0203C26.1179 15.825 26.1179 15.5085 26.3131 15.3132Z" fill="currentColor"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* ──── SLIDE 2: Forest Green Card (Claiborne equivalent with dotted fast-forward) ──── */}
          <div className="w-[320px] sm:w-[380px] md:w-[400px] shrink-0 h-[490px] sm:h-[520px] bg-[#114e0b] rounded-[28px] p-7 sm:p-9 flex flex-col justify-between snap-center shadow-[0_12px_24px_rgba(75,68,57,0.1),0_48px_48px_rgba(75,68,57,0.1)] hover:-translate-y-2.5 hover:shadow-[0_24px_36px_rgba(75,68,57,0.18)] transition-all duration-300 group text-white">
            <div>
              <img 
                src="https://cdn.prod.website-files.com/66eee3543901a7715c75d59d/670242d76b703da05336b537_6701bf55fbc81888e469909e_fast-forward.png" 
                alt="Simplify" 
                className="w-14 h-14 object-contain mb-6"
              />
              <h3 className="font-serif text-[28px] sm:text-[34px] leading-[1.18] font-normal text-white">
                Simplify clinical workflows and improve efficiency
              </h3>
            </div>

            <div>
              <div className="w-full h-px bg-white/20 my-5"></div>
              <div className="text-[11px] font-bold tracking-wider text-white/80 uppercase mb-2">
                NATIONAL HEALTH AUTHORITY · ABDM
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-[13px] sm:text-[14px] text-white/90 leading-snug font-normal">
                  How central hospital OPDs radically simplified clinical case-taking with NRCeS FHIR R4 transaction bundles pushed directly to Bahmni HIS.
                </p>
                <div className="w-12 h-12 rounded-full border border-white/40 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-white group-hover:text-[#114e0b] transition-all shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 48 48" fill="none">
                    <path d="M0.5 24C0.5 11.0213 11.0213 0.5 24 0.5C36.9787 0.5 47.5 11.0213 47.5 24C47.5 36.9787 36.9787 47.5 24 47.5C11.0213 47.5 0.5 36.9787 0.5 24Z" stroke="currentColor"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M26.3131 15.3132C26.5084 15.1179 26.825 15.1179 27.0202 15.3132L35.3536 23.6465C35.5488 23.8418 35.5488 24.1584 35.3536 24.3536L27.0202 32.687C26.825 32.8822 26.5084 32.8822 26.3131 32.687C26.1179 32.4917 26.1179 32.1751 26.3131 31.9799L33.7929 24.5001H13C12.7239 24.5001 12.5 24.2762 12.5 24.0001C12.5 23.7239 12.7239 23.5001 13 23.5001H33.7929L26.3131 16.0203C26.1179 15.825 26.1179 15.5085 26.3131 15.3132Z" fill="currentColor"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* ──── SLIDE 3: Midnight Royal Navy Card (Exact 93% stat card) ──── */}
          <div className="w-[320px] sm:w-[380px] md:w-[400px] shrink-0 h-[490px] sm:h-[520px] bg-[#1b1463] rounded-[28px] p-7 sm:p-9 flex flex-col justify-between snap-center shadow-[0_12px_24px_rgba(75,68,57,0.1),0_48px_48px_rgba(75,68,57,0.1)] hover:-translate-y-2.5 hover:shadow-[0_24px_36px_rgba(75,68,57,0.18)] transition-all duration-300 group text-white">
            <div>
              <div className="font-serif text-[72px] sm:text-[88px] leading-none mb-3 font-normal text-white">
                93%
              </div>
              <h3 className="font-serif text-[28px] sm:text-[34px] leading-[1.18] font-normal text-white">
                of physicians save time every day with AyushKiosk
              </h3>
            </div>

            <div>
              <div className="w-full h-px bg-white/20 my-5"></div>
              <div className="text-[11px] font-bold tracking-wider text-white/80 uppercase mb-2">
                CLINICAL TIME-SAVINGS BENCHMARK
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-[13px] sm:text-[14px] text-white/90 leading-snug font-normal">
                  93% of medical officers report zero chart backlog when pre-consultation SOCRATES and Ahara-Vihara summaries are ready upon patient entry.
                </p>
                <div className="w-12 h-12 rounded-full border border-white/40 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-white group-hover:text-[#1b1463] transition-all shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 48 48" fill="none">
                    <path d="M0.5 24C0.5 11.0213 11.0213 0.5 24 0.5C36.9787 0.5 47.5 11.0213 47.5 24C47.5 36.9787 36.9787 47.5 24 47.5C11.0213 47.5 0.5 36.9787 0.5 24Z" stroke="currentColor"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M26.3131 15.3132C26.5084 15.1179 26.825 15.1179 27.0202 15.3132L35.3536 23.6465C35.5488 23.8418 35.5488 24.1584 35.3536 24.3536L27.0202 32.687C26.825 32.8822 26.5084 32.8822 26.3131 32.687C26.1179 32.4917 26.1179 32.1751 26.3131 31.9799L33.7929 24.5001H13C12.7239 24.5001 12.5 24.2762 12.5 24.0001C12.5 23.7239 12.7239 23.5001 13 23.5001H33.7929L26.3131 16.0203C26.1179 15.825 26.1179 15.5085 26.3131 15.3132Z" fill="currentColor"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* ──── SLIDE 4: Royal Blue Card (Dotted House-Check icon) ──── */}
          <div className="w-[320px] sm:w-[380px] md:w-[400px] shrink-0 h-[490px] sm:h-[520px] bg-[#4865ff] rounded-[28px] p-7 sm:p-9 flex flex-col justify-between snap-center shadow-[0_12px_24px_rgba(75,68,57,0.1),0_48px_48px_rgba(75,68,57,0.1)] hover:-translate-y-2.5 hover:shadow-[0_24px_36px_rgba(75,68,57,0.18)] transition-all duration-300 group text-white">
            <div>
              <img 
                src="https://cdn.prod.website-files.com/66eee3543901a7715c75d59d/670242d82c114bb2bea003e8_6701bc55a5e5ee34de955fbc_house-check.png" 
                alt="Proactive Triage" 
                className="w-14 h-14 object-contain mb-6"
              />
              <h3 className="font-serif text-[28px] sm:text-[34px] leading-[1.18] font-normal text-white">
                Enable proactive triage across your hospital
              </h3>
            </div>

            <div>
              <div className="w-full h-px bg-white/20 my-5"></div>
              <div className="text-[11px] font-bold tracking-wider text-white/80 uppercase mb-2">
                C-DAC HEALTH INFORMATICS
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-[13px] sm:text-[14px] text-white/90 leading-snug font-normal">
                  Pre-LLM regex engines scan for emergency chest pain and stroke symptoms in &lt;200ms, sounding alarms before patients enter doctor rooms.
                </p>
                <div className="w-12 h-12 rounded-full border border-white/40 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-white group-hover:text-[#4865ff] transition-all shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 48 48" fill="none">
                    <path d="M0.5 24C0.5 11.0213 11.0213 0.5 24 0.5C36.9787 0.5 47.5 11.0213 47.5 24C47.5 36.9787 36.9787 47.5 24 47.5C11.0213 47.5 0.5 36.9787 0.5 24Z" stroke="currentColor"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M26.3131 15.3132C26.5084 15.1179 26.825 15.1179 27.0202 15.3132L35.3536 23.6465C35.5488 23.8418 35.5488 24.1584 35.3536 24.3536L27.0202 32.687C26.825 32.8822 26.5084 32.8822 26.3131 32.687C26.1179 32.4917 26.1179 32.1751 26.3131 31.9799L33.7929 24.5001H13C12.7239 24.5001 12.5 24.2762 12.5 24.0001C12.5 23.7239 12.7239 23.5001 13 23.5001H33.7929L26.3131 16.0203C26.1179 15.825 26.1179 15.5085 26.3131 15.3132Z" fill="currentColor"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* ──── SLIDE 5: Blossom Orchid Pink Card (Dotted Eye icon) ──── */}
          <div className="w-[320px] sm:w-[380px] md:w-[400px] shrink-0 h-[490px] sm:h-[520px] bg-[#f098d7] rounded-[28px] p-7 sm:p-9 flex flex-col justify-between snap-center shadow-[0_12px_24px_rgba(75,68,57,0.1),0_48px_48px_rgba(75,68,57,0.1)] hover:-translate-y-2.5 hover:shadow-[0_24px_36px_rgba(75,68,57,0.18)] transition-all duration-300 group text-[#080331]">
            <div>
              <img 
                src="https://cdn.prod.website-files.com/66eee3543901a7715c75d59d/670242d82c114bb2bea003e2_6701bd46e2172761378aec31_eye.png" 
                alt="Optimize" 
                className="w-14 h-14 object-contain mb-6"
              />
              <h3 className="font-serif text-[28px] sm:text-[34px] leading-[1.18] font-normal text-[#080331]">
                Optimize intake throughput &amp; diagnostic capture
              </h3>
            </div>

            <div>
              <div className="w-full h-px bg-[#080331]/20 my-5"></div>
              <div className="text-[11px] font-bold tracking-wider text-[#080331]/75 uppercase mb-2">
                BHASHINI &amp; DIGITAL HEALTH
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-[13px] sm:text-[14px] text-[#080331]/90 leading-snug font-normal">
                  Sarvam Saaras v3 ASR and CommCare medical pictograms allow rural first-visit patients to record complete case histories independently.
                </p>
                <div className="w-12 h-12 rounded-full border border-[#080331]/40 flex items-center justify-center text-[#080331] group-hover:scale-110 group-hover:bg-[#080331] group-hover:text-white transition-all shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 48 48" fill="none">
                    <path d="M0.5 24C0.5 11.0213 11.0213 0.5 24 0.5C36.9787 0.5 47.5 11.0213 47.5 24C47.5 36.9787 36.9787 47.5 24 47.5C11.0213 47.5 0.5 36.9787 0.5 24Z" stroke="currentColor"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M26.3131 15.3132C26.5084 15.1179 26.825 15.1179 27.0202 15.3132L35.3536 23.6465C35.5488 23.8418 35.5488 24.1584 35.3536 24.3536L27.0202 32.687C26.825 32.8822 26.5084 32.8822 26.3131 32.687C26.1179 32.4917 26.1179 32.1751 26.3131 31.9799L33.7929 24.5001H13C12.7239 24.5001 12.5 24.2762 12.5 24.0001C12.5 23.7239 12.7239 23.5001 13 23.5001H33.7929L26.3131 16.0203C26.1179 15.825 26.1179 15.5085 26.3131 15.3132Z" fill="currentColor"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Swiper Pagination Arrow Buttons */}
        <div className="flex items-center justify-center gap-4 mt-10">
          <button 
            onClick={handleScrollLeft}
            aria-label="Previous case studies"
            className="w-14 h-14 rounded-full border border-[#080331]/20 hover:border-[#080331] bg-white flex items-center justify-center text-[#080331] shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 48 48" fill="none" className="rotate-180">
              <path fillRule="evenodd" clipRule="evenodd" d="M26.3131 15.3132C26.5084 15.1179 26.825 15.1179 27.0202 15.3132L35.3536 23.6465C35.5488 23.8418 35.5488 24.1584 35.3536 24.3536L27.0202 32.687C26.825 32.8822 26.5084 32.8822 26.3131 32.687C26.1179 32.4917 26.1179 32.1751 26.3131 31.9799L33.7929 24.5001H13C12.7239 24.5001 12.5 24.2762 12.5 24.0001C12.5 23.7239 12.7239 23.5001 13 23.5001H33.7929L26.3131 16.0203C26.1179 15.825 26.1179 15.5085 26.3131 15.3132Z" fill="currentColor"/>
            </svg>
          </button>
          <button 
            onClick={handleScrollRight}
            aria-label="Next case studies"
            className="w-14 h-14 rounded-full border border-[#080331]/20 hover:border-[#080331] bg-white flex items-center justify-center text-[#080331] shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 48 48" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M26.3131 15.3132C26.5084 15.1179 26.825 15.1179 27.0202 15.3132L35.3536 23.6465C35.5488 23.8418 35.5488 24.1584 35.3536 24.3536L27.0202 32.687C26.825 32.8822 26.5084 32.8822 26.3131 32.687C26.1179 32.4917 26.1179 32.1751 26.3131 31.9799L33.7929 24.5001H13C12.7239 24.5001 12.5 24.2762 12.5 24.0001C12.5 23.7239 12.7239 23.5001 13 23.5001H33.7929L26.3131 16.0203C26.1179 15.825 26.1179 15.5085 26.3131 15.3132Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          7. FOOTER
          ────────────────────────────────────────────────────────── */}
      <footer className="max-w-[1140px] mx-auto px-6 pt-10 pb-16 border-t border-[#4d4439]/10 text-xs text-[#333333]/70 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          © 2026 MediChain AI. Built for MineArena 1.0 Hackathon.
        </div>
        <div className="flex items-center gap-6">
          <a href="#dpdp" className="hover:text-[#080331] transition-colors">DPDP Act 2023</a>
          <a href="#abdm" className="hover:text-[#080331] transition-colors">ABDM M1 Gateway</a>
          <a href="#bhashini" className="hover:text-[#080331] transition-colors">NHA-Bhashini Sovereign AI</a>
        </div>
      </footer>

      {/* ──────────────────────────────────────────────────────────
          8. INSFORGE & CLINICAL MODALS (Google OAuth, Kiosk Intake, Doctor Console)
          ────────────────────────────────────────────────────────── */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        defaultRole={authRole}
        onSuccess={() => {
          if (authRole === 'patient') navigate('/patient');
          else navigate('/dashboard');
        }} 
      />

      <KioskIntakeModal 
        isOpen={isKioskModalOpen} 
        onClose={() => setIsKioskModalOpen(false)} 
        onIntakeComplete={() => setIsDashboardModalOpen(true)} 
      />

      <DoctorDashboardModal 
        isOpen={isDashboardModalOpen} 
        onClose={() => setIsDashboardModalOpen(false)} 
      />

      {/* ──────────────────────────────────────────────────────────
          9. FLOATING DUAL-MODE KIOSK & VOICE AI ASSISTANT TRIGGERS
          ────────────────────────────────────────────────────────── */}
      <div className="home-floating-actions home-quick-dock fixed bottom-6 right-6 z-40 flex items-center gap-2.5">
        {/* Touch MCQ Case-Taking Trigger */}
        <button
          onClick={() => setIsKioskModalOpen(true)}
          className="home-quick-action home-quick-action--touch group flex items-center gap-2.5 bg-white text-[#080331] pl-3.5 pr-4.5 py-3 rounded-full border border-slate-200 shadow-[0_12px_36px_rgba(0,0,0,0.15)] hover:shadow-[0_16px_48px_rgba(72,101,255,0.3)] hover:border-[#4865ff]/50 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
        >
          <div className="home-quick-action__icon relative flex items-center justify-center w-8 h-8 rounded-full bg-[#4865ff] text-white shadow-md shadow-[#4865ff]/30">
            <Touchpad size={16} />
          </div>
          <div className="home-quick-action__copy text-left">
            <div className="text-xs font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              {t('nav.touchCaseTaking', 'Touch Case-Taking')}
              <span className="home-quick-action__status w-1.5 h-1.5 rounded-full bg-[#4865ff] animate-ping" />
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Adaptive MCQ + Type</div>
          </div>
        </button>

        {/* LiveKit Voice Assistant Trigger */}
        <button
          onClick={() => setIsVoiceModalOpen(true)}
          className="home-quick-action home-quick-action--voice group flex items-center gap-3 bg-[#0d0f17] text-white pl-4 pr-5 py-3 rounded-full border border-white/20 shadow-[0_12px_36px_rgba(0,0,0,0.3)] hover:shadow-[0_16px_48px_rgba(72,101,255,0.4)] hover:border-indigo-400/50 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
        >
          <div className="home-quick-action__icon relative flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 group-hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/40">
            <span className="absolute inset-0 rounded-full bg-indigo-400/30 animate-ping" />
            <Mic size={16} />
          </div>
          <div className="home-quick-action__copy text-left">
            <div className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
              AI Voice Guide
              <span className="home-quick-action__status w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-white/50 font-medium">LiveKit • Groq GPT-OSS 20B</div>
          </div>
        </button>
      </div>

      <VoiceAgentModal 
        isOpen={isVoiceModalOpen} 
        onClose={() => setIsVoiceModalOpen(false)} 
      />

      <Human3DViewerModal
        isOpen={is3DViewerOpen}
        onClose={() => setIs3DViewerOpen(false)}
        initialFocus="foot"
      />

    </div>
  );
}
