import React, { useState, useRef, useEffect } from 'react';
import {
  Pill,
  UploadCloud,
  FileText,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Trash2,
  LogOut,
  Stethoscope,
  Search,
  Calendar,
  MessageSquare,
  Bot,
  Plus,
  Layers,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Activity,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  processPrescriptionWithSarvamAndInsForge,
  fetchOpdQueue,
  fetchPatientPrescriptionScans,
  cleanDocumentName,
  deletePrescriptionScan,
  type OpdSession
} from '../lib/insforge';
import AuthModal from '../components/AuthModal';
import DigitalTwin from '../components/DigitalTwin';
import KioskIntakeModal from '../components/KioskIntakeModal';
import VoiceAgentModal from '../components/VoiceAgentModal';
import IntakeModeModal from '../components/IntakeModeModal';
import OcrComparisonViewer from '../components/OcrComparisonViewer';
import LanguageSelector from '../components/LanguageSelector';
import { useLanguage } from '../context/LanguageContext';

// Patient Sub-Views (Only relevant modules: Overview, Records/OCR, Appointments, AI Prognosis, Chat, Bot)
import SummaryDashboardView from '../components/patient/SummaryDashboardView';
import AnalysisView, { type Analysis } from '../components/patient/AnalysisView';
import AppointmentsView from '../components/patient/AppointmentsView';
import AIInsightsView from '../components/patient/AIInsightsView';
import MessagesView from '../components/patient/MessagesView';
import ChatBotView from '../components/patient/ChatBotView';
import XrayAnalysisPanel from '../components/patient/XrayAnalysisPanel';

export default function PatientPortalPage() {
  const { user, signOut, loginAsDemoPatient } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dedicated patient session gate for kiosk intake
  const [isPatientSessionActive, setIsPatientSessionActive] = useState<boolean>(() => {
    return sessionStorage.getItem('medikiosk_patient_session_active') === 'true';
  });

  // Active Tab: Focused on core patient needs (Left Sidebar) - Voice-First Summary is default
  const [activeTab, setActiveTab] = useState<
    'overview' | 'records' | 'twin' | 'appointments' | 'ai-prognosis' | 'messages' | 'bot'
  >('overview');

  // Autonomous Kiosk Intake Modal state
  const [isKioskModalOpen, setIsKioskModalOpen] = useState(false);
  const [kioskInitialStep, setKioskInitialStep] = useState<1 | 2>(1);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Intake mode selection popup - automatically open if patient is logged in and hasn't dismissed yet
  const [isIntakeModeModalOpen, setIsIntakeModeModalOpen] = useState<boolean>(() => {
    const sessionActive = sessionStorage.getItem('medikiosk_patient_session_active') === 'true';
    const dismissed = sessionStorage.getItem('medikiosk_intake_modal_dismissed') === 'true';
    return sessionActive && !dismissed;
  });

  // Direct ABHA input state for manual login
  const [abhaInput, setAbhaInput] = useState('91-2847-1092-3841');

  // Clinical records state (Live from InsForge, zero mock data)
  const [records, setRecords] = useState<Analysis[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<Analysis | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  // OPD Session & Upload states
  const [mySession, setMySession] = useState<OpdSession | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Check if session signaled to show intake mode modal after login
  useEffect(() => {
    if (user && isPatientSessionActive) {
      const shouldShow = sessionStorage.getItem('medikiosk_show_intake_modal');
      if (shouldShow === 'true') {
        sessionStorage.removeItem('medikiosk_show_intake_modal');
        setIsIntakeModeModalOpen(true);
      }
    }
  }, [user, isPatientSessionActive]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePatientSignIn = () => {
    loginAsDemoPatient();
    sessionStorage.setItem('medikiosk_patient_session_active', 'true');
    sessionStorage.removeItem('medikiosk_intake_modal_dismissed');
    setIsPatientSessionActive(true);
    setIsIntakeModeModalOpen(true);
    showToast('Signed in successfully! Please choose consultation mode.');
  };

  const handlePatientSignOut = () => {
    sessionStorage.removeItem('medikiosk_patient_session_active');
    sessionStorage.removeItem('medikiosk_intake_modal_dismissed');
    sessionStorage.removeItem('medikiosk_show_intake_modal');
    signOut();
    setIsPatientSessionActive(false);
    setIsIntakeModeModalOpen(false);
    showToast('Signed out from patient session.');
  };

  // Load session & live scanned records from InsForge
  useEffect(() => {
    fetchOpdQueue()
      .then((sessions) => {
        if (sessions && sessions.length > 0) {
          setMySession(sessions[0]);
        }
      })
      .catch((err) => console.error('Failed to load patient session:', err));

    const loadLiveRecords = async () => {
      try {
        const scans = await fetchPatientPrescriptionScans();
        if (scans && scans.length > 0) {
          const mapped: Analysis[] = scans.map((s) => {
            const lab = s.lab_flags || {};
            const extMeds = s.extracted_medications || [];
            const cleanName = cleanDocumentName(s.file_key || s.file_url);
            return {
              id: s.id || `scan-${Date.now()}`,
              file_name: cleanName,
              file_url: s.file_url || '',
              summary:
                lab.patient_summary ||
                lab.doctor_report ||
                `Prescription digitized via Sarvam OCR. Primary condition: ${s.diagnosis_found || 'Clinical Intake'}.`,
               risk_score: lab.risk_score ?? s.ocr_confidence ?? 0,
              conditions: [
                ...(s.diagnosis_found &&
                !s.diagnosis_found.toLowerCase().includes('not provided') &&
                !s.diagnosis_found.toLowerCase().includes('unknown') &&
                s.diagnosis_found.toLowerCase() !== 'none'
                  ? [s.diagnosis_found]
                  : ['Clinical Intake']),
                'InsForge Stored',
                'Sarvam OCR Analyzed'
              ],
              specialist:
                s.prescribing_doctor &&
                !s.prescribing_doctor.toLowerCase().includes('not provided') &&
                !s.prescribing_doctor.toLowerCase().includes('unknown') &&
                s.prescribing_doctor.toLowerCase() !== 'none'
                  ? s.prescribing_doctor
                   : 'Prescribing clinician not provided',
              urgency: (lab.urgency as any) || 'medium',
              record_hash: `0x${(s.id || '').replace(/[^a-f0-9]/gi, '').substring(0, 8) || 'verified'}`,
              created_at: s.created_at
                ? new Date(s.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                : 'Recent',
              medications: extMeds.map((m: any) => ({
                name: m.name,
                 dosage: m.dosage || 'Not provided',
                 frequency: m.frequency || 'Not provided',
                 instructions: m.instructions || 'Not provided'
              })),
              allergies: s.detected_allergies || [],
              blocks: lab.ocr_blocks || [],
              pages: lab.pages || [],
              rawOcrText: lab.raw_ocr_text || '',
              extraction: {
                doctor_report: lab.doctor_report,
                patient_summary: lab.patient_summary,
                prescribing_doctor: s.prescribing_doctor,
                diagnosis_found: s.diagnosis_found,
                extracted_medications: s.extracted_medications,
                detected_allergies: s.detected_allergies,
                contraindications: lab.contraindications,
                vitals_extracted: lab.vitals,
                recommendations: lab.recommendations,
                organ_impact: lab.organ_impact,
                ocr_confidence: s.ocr_confidence
              }
            };
          });

          // Deduplicate by clean filename
          const seen = new Set<string>();
          const dedup: Analysis[] = [];
          for (const item of mapped) {
            const key = item.file_name.toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              dedup.push(item);
            }
          }

          // Sort records that have valid file_url to the top so original document displays immediately
          const sorted = dedup.sort((a, b) => (b.file_url ? 1 : 0) - (a.file_url ? 1 : 0));
          setRecords(sorted);
          setSelectedRecord((prev) => {
            if (prev) {
              const matched = sorted.find((r) => r.id === prev.id || r.file_name.toLowerCase() === prev.file_name.toLowerCase());
              if (matched) return matched;
            }
            return sorted.find((r) => r.file_url) || sorted[0];
          });
        } else {
          setRecords([]);
          setSelectedRecord(null);
        }
      } catch (e) {
        console.error('Failed to load InsForge records:', e);
      }
    };

    loadLiveRecords();
    window.addEventListener('ayush_prescription_added', loadLiveRecords);
    return () => window.removeEventListener('ayush_prescription_added', loadLiveRecords);
  }, []);

  // Handle File Upload & OCR Extraction via Sarvam + InsForge Backend
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const localBlobUrl = URL.createObjectURL(file);
    setIsUploading(true);
    setUploadStage('Uploading document to InsForge Storage...');
    showToast(`Uploading "${file.name}" to InsForge Storage...`);

    const stageTimer1 = setTimeout(() => setUploadStage('Digitizing with Sarvam Vision OCR...'), 1200);
    const stageTimer2 = setTimeout(() => setUploadStage('Generating report with Sarvam Clinical Extraction...'), 7000);

    try {
      // 1. Process through Sarvam Doc-AI + Sarvam clinical extraction + InsForge Storage
      const result = await processPrescriptionWithSarvamAndInsForge(
        file,
        user?.id || 'patient-demo',
        mySession?.id
      );

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);

      const ext = result.extraction;
      const cleanFileName = cleanDocumentName(file.name);
      const newRecord: Analysis = {
        id: result.recordId || `rec-${Date.now()}`,
        file_name: cleanFileName,
        file_url: localBlobUrl || result.storageUrl || '',
        summary:
          ext.patient_summary ||
          ext.doctor_report ||
          `Prescription digitized from ${file.name} via Sarvam OCR.`,
         risk_score: ext.risk_score ?? 0,
        conditions: [
          ...(ext.diagnosis_found &&
          !ext.diagnosis_found.toLowerCase().includes('not provided') &&
          !ext.diagnosis_found.toLowerCase().includes('unknown') &&
          ext.diagnosis_found.toLowerCase() !== 'none'
            ? [ext.diagnosis_found]
            : ['Clinical Intake']),
          'InsForge Stored',
          'Sarvam OCR Analyzed'
        ],
        specialist:
          ext.prescribing_doctor &&
          !ext.prescribing_doctor.toLowerCase().includes('not provided') &&
          !ext.prescribing_doctor.toLowerCase().includes('unknown') &&
          ext.prescribing_doctor.toLowerCase() !== 'none'
            ? ext.prescribing_doctor
             : 'Prescribing clinician not provided',
        urgency:
          ext.urgency === 'emergency'
            ? 'critical'
            : ext.urgency === 'routine'
            ? 'low'
            : (ext.urgency as any) || 'medium',
        record_hash: `0x${Math.random().toString(16).substring(2, 10)}`,
        created_at: 'Just now',
        medications:
          ext.extracted_medications?.map((m: any) => ({
            name: m.name,
             dosage: m.dosage || 'Not provided',
             frequency: m.frequency || 'Not provided',
             instructions: m.instructions || 'Not provided'
          })) || [],
        allergies: ext.detected_allergies || [],
        blocks: result.blocks || [],
        pages: result.pages || [],
        rawOcrText: result.rawOcrText || '',
        extraction: ext
      };

      setRecords((prev) => {
        const key = cleanFileName.toLowerCase();
        const filtered = prev.filter(
          (r) => r.file_name.toLowerCase() !== key && r.id !== (result.recordId || '')
        );
        return [newRecord, ...filtered];
      });
      setSelectedRecord(newRecord);
      setIsComparisonModalOpen(true); // Automatically open the side-by-side comparison!

      // 2. Dispatch real-time alert to Doctor Dashboard
      window.dispatchEvent(
        new CustomEvent('ayush_prescription_added', {
          detail: {
            id: newRecord.id,
            patient: user?.name || 'Govind Kumar',
            doctor: newRecord.specialist,
            file_name: cleanFileName,
            storage_url: result.storageUrl || localBlobUrl,
            clinical_summary: ext.doctor_report || ext.patient_summary,
            diagnosis_found: ext.diagnosis_found,
            medications: newRecord.medications,
            detected_allergies: ext.detected_allergies,
            blocks: result.blocks,
            pages: result.pages,
            rawOcrText: result.rawOcrText,
            extraction: ext
          }
        })
      );

      showToast(`Prescription "${cleanFileName}" digitized via Sarvam OCR! Inspecting original & scanned...`);
    } catch (err: any) {
      console.error('File upload & OCR error:', err);
      showToast(`OCR processing error: ${err?.message || 'Failed to digitize file'}`);
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setIsUploading(false);
      setUploadStage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    if (selectedRecord && selectedRecord.id === id) {
      setSelectedRecord(updated[0] || null);
    }
    showToast('Deleting prescription from database...');
    const ok = await deletePrescriptionScan(id);
    if (ok) {
      window.dispatchEvent(new CustomEvent('ayush_prescription_removed', { detail: { id } }));
      showToast('Prescription record permanently removed.');
    } else {
      showToast('Removed from view.');
    }
  };

  // Filtered records
  const filteredRecords = records.filter(
    (r) =>
      r.file_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.summary.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.conditions.some((c) => c.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  // Left Sidebar Nav Items (Clean Pillio style without emojis)
  interface PatientNavItem {
    id: 'overview' | 'records' | 'twin' | 'appointments' | 'ai-prognosis' | 'messages' | 'bot';
    label: string;
    icon: any;
    count?: number;
  }

  const navItems: PatientNavItem[] = [
    { id: 'overview', label: t('patient.summaryOverview', 'Summary Overview'), icon: Activity },
    { id: 'records', label: t('patient.myPrescriptions', 'My Prescriptions & OCR'), icon: FileText, count: records.length },
    { id: 'twin', label: t('patient.digitalTwin', '3D Digital Twin'), icon: Layers },
    { id: 'appointments', label: t('patient.appointments', 'Appointments'), icon: Calendar },
    { id: 'ai-prognosis', label: t('patient.aiPrognosis', 'AI Prognosis'), icon: Sparkles },
    { id: 'messages', label: t('patient.doctorChat', 'Doctor Chat'), icon: MessageSquare },
    { id: 'bot', label: t('patient.ayushBot', 'Ayush AI Assistant'), icon: Bot },
  ];

  // ── Patient Login Gate: Patient must first login to access portal and trigger intake mode ──
  if (!user || !isPatientSessionActive) {
    return (
      <div className="patient-entry min-h-screen bg-[#EDF0F8] text-slate-800 font-sans flex flex-col justify-between p-4 sm:p-8">
        {/* Top Branding Bar */}
        <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-2">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-[#080331] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Pill size={20} />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight block leading-none">
                MediChain <span className="text-[#4865ff]">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                National Institute of Ayurveda
              </span>
            </div>
          </Link>
          <LanguageSelector />
        </header>

        {/* Center Login Card */}
        <div className="max-w-md w-full mx-auto my-auto bg-white rounded-3xl p-6 sm:p-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)] border border-slate-200/90 text-center space-y-4 animate-in fade-in">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-[#4865ff] flex items-center justify-center mx-auto shadow-sm">
            <UserCheck size={28} />
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200/60">
              {t('patient.portalAccess', 'Patient Portal Access')}
            </span>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
              {t('patient.signInTitle', 'Sign In to Patient Account')}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              {t('patient.signInSubtitle', 'Sign in with your account or enter your ABHA ID to begin your clinical intake and choose your consultation mode.')}
            </p>
          </div>

          {/* 1-Click Fast-Track Demo Login */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-blue-700 tracking-wider">
                {t('patient.fastTrack', 'Fast Track · Demo Patient')}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {t('patient.activeBay', 'Active Bay 04')}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Govind Narain (58 M)</p>
              <p className="text-[11px] text-slate-500">UHID: NIA-2026-GK-8821 • Wagner Gr. 2 Ulcer</p>
            </div>
            <button
              onClick={handlePatientSignIn}
              className="w-full py-2.5 px-4 rounded-xl bg-[#4865ff] hover:bg-[#3852e6] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-[#4865ff]/25 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              <Sparkles size={14} />
              <span>{t('patient.instantSignIn', 'Instant Sign In & Choose Intake Mode')}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* ABHA ID Direct Entry Form */}
          <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-left space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase text-slate-700 tracking-wider">
                {t('patient.abhaLabel', 'Ayushman Bharat Health Account (ABHA)')}
              </label>
              <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold">
                ABDM
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={abhaInput}
                onChange={(e) => setAbhaInput(e.target.value)}
                placeholder="14-digit ABHA Number"
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#4865ff]"
              />
              <button
                type="button"
                onClick={handlePatientSignIn}
                className="py-2 px-3 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-all shrink-0 cursor-pointer shadow-xs"
              >
                {t('patient.abhaVerify', 'Verify & Enter')}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex-1 h-px bg-slate-200" />
            <span>{t('patient.orCredentials', 'Or standard credentials')}</span>
            <span className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Standard Auth Trigger */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 transition-all cursor-pointer"
          >
            <span>{t('patient.emailSignIn', 'Sign In with Email / Hospital Account')}</span>
          </button>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <Link to="/" className="hover:text-slate-700 transition-colors">
              ← {t('patient.returnHome', 'Return to Hospital Home')}
            </Link>
            <Link to="/dashboard" className="text-blue-600 hover:underline font-medium">
              {t('patient.doctorLogin', 'Doctor Login')} →
            </Link>
          </div>
        </div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          defaultRole="patient"
          onSuccess={() => {
            handlePatientSignIn();
          }}
        />

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 py-3">
          © 2026 MediChain AI • MineArena 1.0 National Hackathon
        </footer>
      </div>
    );
  }

  return (
    <div className="clinical-workspace clinical-workspace--patient h-screen w-screen overflow-hidden bg-[#EDF0F8] text-slate-800 font-sans antialiased flex selection:bg-black selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-fade-in border border-slate-700">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          1. PILLIO LEFT SIDEBAR (Collapsible / Minimizable)
          ────────────────────────────────────────────────────────── */}
      <aside
        className={`${
          isSidebarCollapsed ? 'w-20 p-3 items-center' : 'w-64 p-6'
        } transition-all duration-300 bg-[#EDF0F8] border-r border-slate-200/60 flex flex-col justify-between shrink-0 hidden lg:flex h-full overflow-y-auto`}
      >
        <div className="w-full">
          {/* Brand Logo & Minimize/Expand Toggle */}
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between mb-8 px-2">
              <Link to="/" className="flex items-center gap-3 group cursor-pointer">
                <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-white shadow-sm group-hover:bg-slate-800 transition-colors">
                  <Pill size={17} />
                </div>
                <div>
                  <span className="font-bold text-lg text-slate-900 tracking-tight leading-none block">
                    MediChain <span className="text-blue-600">AI</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                    Patient Portal
                  </span>
                </div>
              </Link>
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-1.5 rounded-xl hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Minimize sidebar to icons only"
              >
                <PanelLeftClose size={17} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center mb-8 gap-3">
              <Link to="/" className="group cursor-pointer" title="MediKiosk Home">
                <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center text-white shadow-sm group-hover:bg-slate-800 transition-colors">
                  <Pill size={20} />
                </div>
              </Link>
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer shadow-2xs"
                title="Expand sidebar"
              >
                <PanelLeftOpen size={16} />
              </button>
            </div>
          )}

          {/* Clean Pill Navigation List */}
          <nav className="space-y-1.5 w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              if (isSidebarCollapsed) {
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    title={item.label}
                    className={`w-12 h-12 mx-auto flex items-center justify-center rounded-2xl transition-all cursor-pointer relative ${
                      isActive
                        ? 'bg-black text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-white' : 'text-slate-600'} />
                    {item.count !== undefined && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white"></span>
                    )}
                  </button>
                );
              }
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-black text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? 'text-white' : 'text-slate-500'} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Card / OPD Token Status */}
        <div className="pt-6 border-t border-slate-200/60 w-full">
          {!isSidebarCollapsed ? (
            <div className="space-y-3">
              {/* OPD Token Card */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/60 shadow-xs">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-500 font-medium">{t('patient.opdConsult', 'OPD Consultation')}</span>
                  <span className="font-mono font-bold text-blue-600">{mySession?.token_number || 'AYUSH-44'}</span>
                </div>
                <div className="text-xs font-semibold text-slate-800 truncate">
                  Bay 04 (Dr. Vaidya Ananya Sharma)
                </div>
                <div className="text-[10px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{t('patient.patientsAhead', '2 Patients Ahead (~6 mins)')}</span>
                </div>
              </div>

              {/* Patient Profile / Sign In */}
              {user ? (
                <div className="flex items-center justify-between bg-white rounded-2xl p-2.5 border border-slate-200/60 shadow-xs">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'G'}
                    </div>
                    <div className="overflow-hidden text-left">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {user.name || 'Govind Narain'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        ABHA: 91-3829-5512
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handlePatientSignOut}
                    title={t('patient.signOut', 'Sign Out')}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handlePatientSignIn}
                  className="w-full bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-800 text-xs font-semibold py-2.5 px-3 rounded-2xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <User size={14} />
                  <span>{t('patient.loginAs', 'Login as Govind Narain')}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-bold text-[11px] shadow-2xs cursor-pointer"
                title={`OPD Consultation Token: ${mySession?.token_number || 'AYUSH-44'} (Bay 04)`}
              >
                #44
              </div>
              {user ? (
                <button
                  onClick={handlePatientSignOut}
                  className="w-10 h-10 rounded-2xl bg-white hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                  title={t('patient.signOut', 'Sign Out')}
                >
                  <LogOut size={15} />
                </button>
              ) : (
                <button
                  onClick={handlePatientSignIn}
                  className="w-10 h-10 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                  title={t('patient.loginAs', 'Login as Govind Narain')}
                >
                  <User size={15} />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ──────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA
          ────────────────────────────────────────────────────────── */}
      <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Bar with Appointment Button on Navbar */}
        <header className="h-16 shrink-0 bg-[#EDF0F8]/95 border-b border-slate-200/70 px-6 sm:px-8 flex items-center justify-between z-30 backdrop-blur-md">
          
          {/* Toggle Button + Centered Search */}
          <div className="flex items-center flex-1 max-w-md">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 mr-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer hidden lg:flex items-center justify-center shadow-2xs"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Minimize sidebar to icons'}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>

            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder={t('patient.searchPlaceholder', 'Search prescriptions, medications, advice...')}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200/80 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Right: Appointment Button on Navbar, Upload Button, Doctor Link */}
          <div className="flex items-center gap-2.5 ml-4">
            
            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />

            {/* Language Selector */}
            <LanguageSelector />

            {/* APPOINTMENT BUTTON ON NAVBAR (Directly accessible as requested) */}
            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs ${
                activeTab === 'appointments'
                  ? 'bg-black text-white'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
              }`}
            >
              <Calendar size={14} className="text-blue-600" />
              <span>{t('patient.appointments', 'Appointments')}</span>
            </button>

            {/* Upload Prescription Action Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-black hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Plus size={14} />
              <span>{isUploading ? t('patient.digitizing', 'Digitizing...') : t('patient.uploadRx', 'Upload Prescription')}</span>
            </button>

            {/* Intake Mode Chooser Button */}
            <button
              onClick={() => {
                sessionStorage.removeItem('medikiosk_intake_modal_dismissed');
                setIsIntakeModeModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80"
              title="Switch between LiveKit Voice Call and Adaptive Quiz"
            >
              <Sparkles size={13} className="text-indigo-600" />
              <span>{t('patient.intakeMode', 'Intake Mode')}</span>
            </button>

            {/* Switch to Doctor Consultation Dashboard */}
            <Link
              to="/dashboard"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 hover:text-blue-600 font-medium bg-white hover:bg-slate-50 px-3.5 py-2 rounded-full border border-slate-200 transition-all cursor-pointer"
            >
              <Stethoscope size={13} className="text-blue-600" />
              <span>{t('patient.doctorPortal', 'Doctor Portal')}</span>
            </Link>

          </div>
        </header>

        {/* ──────────────────────────────────────────────────────────
            4. MAIN WORKSPACE CONTENT
            ────────────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 max-w-[1400px] w-full">
          
          {/* ═══ TAB 0: SUMMARY OVERVIEW (VOICE-FIRST & SNAPSHOT METRICS) ═══ */}
          {activeTab === 'overview' && (
            <SummaryDashboardView
              onNavigateTab={setActiveTab}
              onOpenVoiceIntake={() => setIsVoiceModalOpen(true)}
              onOpenTouchIntake={() => {
                setKioskInitialStep(2);
                setIsKioskModalOpen(true);
              }}
              onOpenModeChooser={() => setIsIntakeModeModalOpen(true)}
              records={records}
              mySession={mySession}
            />
          )}

          {/* ═══ TAB 1: MY PRESCRIPTIONS & OCR ═══ */}
          {activeTab === 'records' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
              
              {/* Left Column: Streamlined Single Card with Slim Upload Strip & Archive (4 cols) */}
              <div className="lg:col-span-4">
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-4">
                  
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">
                        {t('patient.archive', 'Prescription Archive')}
                      </h3>
                      <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                        {records.length}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full uppercase">
                      {t('patient.medGemmaOcr', 'Sarvam OCR')}
                    </span>
                  </div>

                  {/* Slim, Compact Upload Strip (Replaced giant box) */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-slate-300 hover:border-black bg-slate-50/70 hover:bg-white rounded-2xl p-3 transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-white shadow-2xs group-hover:bg-black text-slate-700 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                        <UploadCloud size={16} className={isUploading ? 'animate-bounce' : ''} />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-800 group-hover:text-black whitespace-nowrap">
                          {isUploading ? 'Digitizing with Sarvam...' : 'Upload Prescription'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          PDF, JPG, PNG (Max 25MB)
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 group-hover:bg-black group-hover:text-white group-hover:border-black px-2.5 py-1 rounded-full transition-all shrink-0 shadow-2xs">
                      Browse
                    </span>
                  </div>

                  {/* Live Upload & OCR Multi-stage Progress Status */}
                  {isUploading && (
                    <div className="p-3 bg-blue-50/90 border border-blue-200/80 rounded-2xl flex items-center gap-2.5 animate-pulse text-left">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold text-blue-900 truncate">
                          {uploadStage || 'Digitizing with Sarvam AI...'}
                        </div>
                        <div className="text-[10px] text-blue-600">
                          InsForge Storage • Sarvam Vision OCR • Clinical Extraction
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Records List */}
                  <div className="space-y-2 pt-1">
                    {filteredRecords.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <FileText size={26} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-semibold text-slate-700">No Prescriptions Yet</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Upload a doctor slip or clinical report to inspect with live Sarvam OCR.
                        </p>
                      </div>
                    ) : (
                      filteredRecords.map((record) => {
                        const isSelected = selectedRecord?.id === record.id;
                        return (
                          <div
                            key={record.id}
                            onClick={() => setSelectedRecord(record)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer text-left flex items-center justify-between gap-2.5 ${
                              isSelected
                                ? 'bg-slate-50 border-black ring-1 ring-black/10 shadow-xs'
                                : 'bg-white hover:bg-slate-50/80 border-slate-200/70'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-bold">
                                <FileText size={15} className={isSelected ? 'text-black' : 'text-slate-500'} />
                              </div>
                              <div className="overflow-hidden">
                                <div className="font-semibold text-xs text-slate-900 truncate">
                                  {record.file_name}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <span>{record.created_at}</span>
                                  <span>•</span>
                                  <span className="font-semibold text-emerald-700">{record.urgency.toUpperCase()}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={(e) => removeRecord(record.id, e)}
                              title="Delete record"
                              className="p-1.5 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Trust Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={12} className="text-emerald-600" />
                      Encrypted S3 Storage
                    </span>
                    <span>DPDP Compliant</span>
                  </div>

                </div>
              </div>

              {/* Right Column: Selected Record Deep Analysis View (8 cols) */}
              <div className="lg:col-span-8">
                {selectedRecord ? (
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
                    <AnalysisView
                      record={selectedRecord}
                      onOpenComparison={() => setIsComparisonModalOpen(true)}
                    />
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-16 border border-slate-100 text-center flex flex-col items-center justify-center min-h-[400px]">
                    <FileText size={38} className="text-slate-300 mb-3" />
                    <h4 className="font-bold text-slate-800 text-sm">No record selected</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Select a record from the list or upload a prescription slip.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ═══ TAB 2: 3D DIGITAL TWIN (Sketchfab on Pure White Background) ═══ */}
          {activeTab === 'twin' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm animate-fade-in space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      3D Anatomical Digital Twin
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Biometric Organ Mapping &amp; Layer Peeling
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Synchronized with active clinical records: Wagner Grade 2 Ulcer, Plantar Neuropathy, Glycemic Stress.
                  </p>
                </div>
              </div>

              {/* Embedded Sketchfab Twin */}
              <div className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                <DigitalTwin
                  analysisData={selectedRecord?.summary}
                  recordId={selectedRecord?.id}
                />
              </div>
            </div>
          )}

          {/* ═══ TAB 3: APPOINTMENTS ═══ */}
          {activeTab === 'appointments' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm animate-fade-in">
              <AppointmentsView />
            </div>
          )}

          {/* ═══ TAB 4: AI PROGNOSIS ═══ */}
          {activeTab === 'ai-prognosis' && (
            <div className="space-y-6 animate-fade-in">
              <XrayAnalysisPanel patientName={user?.name || 'the patient'} />
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
                <AIInsightsView />
              </div>
            </div>
          )}

          {/* ═══ TAB 5: DOCTOR CONSULTATION CHAT ═══ */}
          {activeTab === 'messages' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm animate-fade-in">
              <MessagesView />
            </div>
          )}

          {/* ═══ TAB 6: AYUSH AI ASSISTANT BOT ═══ */}
          {activeTab === 'bot' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm animate-fade-in">
              <ChatBotView />
            </div>
          )}

        </main>

        {/* Footer */}
        <footer className="mt-auto bg-[#EDF0F8] border-t border-slate-200/60 py-4 px-8 text-xs text-slate-500 text-center">
          <span>© 2026 MediChain AI • MineArena 1.0 National Hackathon • Patient-Owned Health Records</span>
        </footer>

      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultRole="patient"
        onSuccess={() => {
          showToast('Signed in successfully! Your clinical records are now synchronized.');
        }}
      />

      {/* Autonomous Voice & Touch Kiosk Intake Modal */}
      <KioskIntakeModal
        isOpen={isKioskModalOpen}
        onClose={() => setIsKioskModalOpen(false)}
        initialStep={kioskInitialStep}
        defaultAnamnesisMode="touch"
        onIntakeComplete={() => {
          showToast('Clinical intake submitted! OPD token updated.');
          setIsKioskModalOpen(false);
        }}
      />

      {/* Real-time Conversational Voice Assistant (LiveKit + Sarvam AI) */}
      <VoiceAgentModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        title="MediKiosk Clinical Voice Intake"
        subtitle="LiveKit WebRTC + Sarvam AI 105B (Hindi, English & Indic Dialects)"
        roomNamePrefix="ayush-kiosk"
        participantName={user?.name || 'Govind Kumar'}
        suggestedPrompts={[
          "Pair ke ghav ka healing status check karein",
          "Jatyadi Taila sterile dressing protocol batayein",
          "Doctor Vaidya Ananya Sharma se tele-kiosk connect karein",
          "Mera fasting sugar aur vitals summary"
        ]}
      />

      {/* Intake Mode Chooser Modal (Voice Call vs Adaptive Quiz with Bhashini) */}
      <IntakeModeModal
        isOpen={isIntakeModeModalOpen}
        onClose={() => {
          sessionStorage.setItem('medikiosk_intake_modal_dismissed', 'true');
          setIsIntakeModeModalOpen(false);
        }}
        patientName={user?.name || 'Govind Narain'}
        onSelectVoice={() => {
          sessionStorage.setItem('medikiosk_intake_modal_dismissed', 'true');
          setIsIntakeModeModalOpen(false);
          setIsVoiceModalOpen(true);
        }}
        onSelectQuiz={() => {
          sessionStorage.setItem('medikiosk_intake_modal_dismissed', 'true');
          setIsIntakeModeModalOpen(false);
          setKioskInitialStep(2);
          setIsKioskModalOpen(true);
        }}
      />

      {/* Side-by-Side OCR Interactive Inspector Modal (Original vs Digitized Blocks + Sarvam 105B Report) */}
      {isComparisonModalOpen && selectedRecord && (
        <OcrComparisonViewer
          originalFileUrl={selectedRecord.file_url}
          originalFileName={selectedRecord.file_name}
          blocks={selectedRecord.blocks || []}
          pages={selectedRecord.pages || []}
          rawOcrText={selectedRecord.rawOcrText || ''}
          extraction={
            selectedRecord.extraction || {
              doctor_report: selectedRecord.summary,
              patient_summary: selectedRecord.summary,
              extracted_medications: selectedRecord.medications,
              detected_allergies: selectedRecord.allergies,
              diagnosis_found: selectedRecord.conditions[0],
              prescribing_doctor: selectedRecord.specialist,
              urgency: selectedRecord.urgency
            }
          }
          isModal={true}
          onClose={() => setIsComparisonModalOpen(false)}
        />
      )}

    </div>
  );
}
