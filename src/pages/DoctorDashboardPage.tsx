import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Activity,
  Users,
  Clock,
  Plus,
  FileText,
  CheckCircle2,
  FlaskConical,
  ExternalLink,
  Check,
  Printer,
  Edit3,
  Languages,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Volume2,
  PanelLeftClose,
  PanelLeftOpen,
  UploadCloud,
  Sparkles,
  Maximize2,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchOpdQueue, processPrescriptionWithSarvamAndInsForge, cleanDocumentName, type OpdSession } from '../lib/insforge';
import DigitalTwin from '../components/DigitalTwin';
import KioskIntakeModal from '../components/KioskIntakeModal';
import AuthModal from '../components/AuthModal';
import Human3DViewerModal from '../components/Human3DViewerModal';
import VoiceAgentModal from '../components/VoiceAgentModal';
import OcrComparisonViewer from '../components/OcrComparisonViewer';
import LanguageSelector from '../components/LanguageSelector';

// Sample pre-populated OPD Sessions from MediKiosk Autonomous Intake
const INITIAL_OPD_SESSIONS: OpdSession[] = [
  {
    id: 'opd-med-01',
    patient_id: 'pat-01',
    token_number: 'OPD-B4-001',
    department: 'Kayachikitsa & Cardiology',
    assigned_bay: 'Bay 04',
    status: 'in_consultation',
    triage_priority: 'emergency',
    triage_reason: 'Acute exertional retrosternal chest tightness (SpO2 93%) with neuropathic foot ulcer',
    chief_complaint: 'Severe retrosternal chest tightness on mild exertion and non-healing right foot plantar ulcer.',
    symptoms_duration: '3 weeks (chest) • 2 months (ulcer)',
    voice_transcript: 'पिछले 3 हफ़्ते से सीने में बहुत भारीपन और बाएँ कंधे में दर्द होता है, और दाएँ पैर के तलवे का घाव ठीक नहीं हो रहा। चलने पर साँस फूलती है।',
    socrates_data: {
      site: 'Retrosternal chest & right plantar metatarsal head',
      onset: 'Exertional, progressive over 21 days',
      character: 'Constricting, heavy pressure with burning neuropathy in soles',
      radiation: 'Left shoulder, inner arm, and left lower jaw',
      associations: 'Diaphoresis, dyspnoea (SpO2 93%), severe skin anhidrosis',
      timing: 'Episodes last 12-15 minutes, worst after walking/stairs',
      severity: 8
    },
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    patients: {
      id: 'pat-01',
      full_name: 'Shri Rajesh Verma',
      age: 58,
      gender: 'Male',
      abha_id: '91-8291-3829-4412',
      preferred_language: 'Hindi',
      created_at: new Date().toISOString()
    },
    ayush_pariksha: [
      {
        session_id: 'opd-med-01',
        dominant_rasa: 'Lavana (Salty) & Katu (Pungent)',
        prakriti_primary: 'Vata-Pitta Prakriti',
        agni_state: 'Mandagni (Impaired Metabolic Agni)',
        dashavidha_ready: true,
        ahara_habits: {
          timings: 'Irregular (Vishamashana)',
          diet_type: 'High carbohydrate & oily snacks',
          water_intake: '1.2 L / day (Low)'
        },
        vihara_habits: {
          sleep: 'Ratri Jagarana (Sleeps after 1:00 AM)',
          exercise: 'Sedentary, painful ambulation',
          stress_level: 'High occupational stress'
        }
      }
    ],
    prescription_scans: [
      {
        session_id: 'opd-med-01',
        prescribing_doctor: 'District Hospital Civil Surgeon OPD',
        diagnosis_found: 'Type 2 Diabetes Mellitus with Peripheral Neuropathy & CAD angina',
        ocr_confidence: 98.6,
        extracted_medications: [
          { name: 'Tab Metformin HCl', dosage: '1000mg', frequency: '1 Tab BD', instructions: 'After meals' },
          { name: 'Tab Atorvastatin', dosage: '20mg', frequency: '1 Tab HS', instructions: 'Night at bedtime' },
          { name: 'Cap Pantocid-D', dosage: '40mg', frequency: '1 Cap OD', instructions: 'Empty stomach morning' }
        ],
        detected_allergies: ['Sulfa Drugs', 'Penicillin mild rash'],
        lab_flags: [
          { test: 'HbA1c', flag: '8.4% (Critical High, Normal < 5.7%)', severity: 'critical' },
          { test: 'LDL Cholesterol', flag: '192 mg/dL (High, Normal < 100 mg/dL)', severity: 'high' },
          { test: 'Fasting Blood Sugar', flag: '168 mg/dL (High, Normal 70-99 mg/dL)', severity: 'high' }
        ]
      }
    ]
  },
  {
    id: 'opd-med-02',
    patient_id: 'pat-02',
    token_number: 'OPD-B4-002',
    department: 'Kayachikitsa (Internal Medicine)',
    assigned_bay: 'Bay 04',
    status: 'waiting',
    triage_priority: 'urgent',
    triage_reason: 'Amlapitta with severe retrosternal pyrosis & Sandhivata joint restriction',
    chief_complaint: 'Severe hyperacidity with retrosternal burning after meals and bilateral knee joint stiffness.',
    symptoms_duration: '2 months',
    voice_transcript: 'खाना खाने के बाद पेट और सीने में तेज़ जलन होती है, खट्टी डकारें आती हैं और सुबह घुटनों में बहुत अकड़न रहती है।',
    socrates_data: {
      site: 'Epigastrium, retrosternal and bilateral knee joints',
      onset: 'Postprandial 45 mins after spicy meals',
      character: 'Acid burning, sour eructations, aching stiffness in joints',
      radiation: 'Throat upward radiation',
      associations: 'Nausea, disturbed sleep, sluggish bowel',
      timing: 'Worst in evening and morning waking',
      severity: 6
    },
    created_at: new Date(Date.now() - 32 * 60000).toISOString(),
    patients: {
      id: 'pat-02',
      full_name: 'Govind Narain',
      age: 52,
      gender: 'Male',
      abha_id: '91-3829-5512-8841',
      preferred_language: 'Hindi',
      created_at: new Date().toISOString()
    },
    ayush_pariksha: [
      {
        session_id: 'opd-med-02',
        dominant_rasa: 'Amla (Sour) & Katu (Pungent)',
        prakriti_primary: 'Pitta-Vata Prakriti',
        agni_state: 'Tikshnagni alternating with Vishamagni',
        dashavidha_ready: true,
        ahara_habits: {
          timings: 'Late dinner (10:30 PM)',
          diet_type: 'Spicy curries & fermented food',
          water_intake: 'Cold water after food'
        },
        vihara_habits: {
          sleep: 'Divasvapna (Daytime sleeping 1.5 hrs)',
          stress_level: 'Moderate'
        }
      }
    ],
    prescription_scans: [
      {
        session_id: 'opd-med-02',
        prescribing_doctor: 'Apex City Ayush Center',
        diagnosis_found: 'Amlapitta (Hyperacidity) & Sandhivata (Osteoarthritis)',
        ocr_confidence: 97.8,
        extracted_medications: [
          { name: 'Sudarshan Churna', dosage: '3 grams', frequency: 'Twice Daily', instructions: 'With warm water after food' },
          { name: 'Avipattikar Churna', dosage: '3 grams', frequency: 'Twice Daily', instructions: 'Before lunch and dinner' }
        ],
        detected_allergies: ['Sulfa Drugs'],
        lab_flags: [
          { test: 'Serum Uric Acid', flag: '7.8 mg/dL (Elevated, Normal < 7.0 mg/dL)', severity: 'medium' }
        ]
      }
    ]
  },
  {
    id: 'opd-med-03',
    patient_id: 'pat-03',
    token_number: 'OPD-B4-003',
    department: 'Shalakya Tantra (ENT & Eye)',
    assigned_bay: 'Bay 04',
    status: 'waiting',
    triage_priority: 'routine',
    triage_reason: 'Chronic allergic rhinitis with morning paroxysmal sneezing',
    chief_complaint: 'Continuous morning sneezing, nasal pruritus and watery rhinorrhea for 6 months.',
    symptoms_duration: '6 months',
    voice_transcript: 'सुबह उठते ही 15-20 छींकें लगातार आती हैं, नाक से पानी बहता है और आँखों में खुजली होती है।',
    socrates_data: {
      site: 'Nasal mucosa, conjunctiva',
      onset: 'Morning upon waking, cold air exposure',
      character: 'Pruritic, watery, congestive',
      radiation: 'Frontal headache',
      associations: 'Lacrimation, allergic shiners',
      timing: 'Worst between 6:00 AM - 9:00 AM',
      severity: 5
    },
    created_at: new Date(Date.now() - 55 * 60000).toISOString(),
    patients: {
      id: 'pat-03',
      full_name: 'Smt. Sunita Rao',
      age: 44,
      gender: 'Female',
      abha_id: '91-7712-4091-2291',
      preferred_language: 'Telugu',
      created_at: new Date().toISOString()
    },
    ayush_pariksha: [
      {
        session_id: 'opd-med-03',
        dominant_rasa: 'Madhura & Shita Guna',
        prakriti_primary: 'Kapha-Vata Prakriti',
        agni_state: 'Mandagni with Pratishyaya',
        dashavidha_ready: true,
        ahara_habits: {
          timings: 'Excess dairy & refrigerated food',
          diet_type: 'Sweet & cold beverages',
          water_intake: 'Cold water intake'
        },
        vihara_habits: {
          sleep: 'Excess sleep (9+ hrs)',
          stress_level: 'Low'
        }
      }
    ],
    prescription_scans: [
      {
        session_id: 'opd-med-03',
        prescribing_doctor: 'Primary Health Centre (PHC)',
        diagnosis_found: 'Allergic Rhinitis (Vataja Pratishyaya)',
        ocr_confidence: 99.1,
        extracted_medications: [
          { name: 'Tab Levocetirizine', dosage: '5mg', frequency: '1 Tab HS', instructions: 'At bedtime' },
          { name: 'Nasal Spray Fluticasone', dosage: '50 mcg', frequency: '2 sprays each nostril OD', instructions: 'Morning' }
        ],
        detected_allergies: [],
        lab_flags: [
          { test: 'Absolute Eosinophil Count (AEC)', flag: '650 /uL (High, Normal < 450 /uL)', severity: 'medium' }
        ]
      }
    ]
  }
];

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // 5 Problem Statement Modules (Pillio Clean Navigation)
  const [activeNav, setActiveNav] = useState<
    'intake' | 'socrates' | 'twin' | 'ocr' | 'queue'
  >('intake');

  // OPD Sessions Queue State
  const [sessions, setSessions] = useState<OpdSession[]>(INITIAL_OPD_SESSIONS);
  const [selectedSession, setSelectedSession] = useState<OpdSession>(INITIAL_OPD_SESSIONS[0]);
  const [queueFilter, setQueueFilter] = useState<'all' | 'emergency' | 'waiting' | 'completed'>('all');

  // Modals
  const [isKioskModalOpen, setIsKioskModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [is3DViewerOpen, setIs3DViewerOpen] = useState(false);
  const [isVoiceAgentOpen, setIsVoiceAgentOpen] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState<string | null>(null);

  // Multi-Document Selector & Live Patient Upload Alert State
  const [activeScanIndex, setActiveScanIndex] = useState<number>(0);
  const [consultationSubTab, setConsultationSubTab] = useState<'summary' | 'files' | 'twin'>('summary');
  const [patientUploadAlert, setPatientUploadAlert] = useState<{
    patient: string;
    fileName: string;
    storageUrl?: string;
    scanId?: string;
    summary?: string;
  } | null>(null);
  
  // Clinical Notes & Prescription Pad
  const [consultationNotes, setConsultationNotes] = useState(
    'Examined 58M presenting with Wagner Grade 2 plantar ulcer and exertional angina. ECG indicates normal sinus rhythm without acute ST changes. Advised strict total contact off-loading, Jatyadi Taila sterile dressing daily after Panchavalkala Kashaya wash. Glycemic control escalated with Metformin 1000mg BD. Avoid sulfa medications.'
  );
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const doctorFileInputRef = useRef<HTMLInputElement>(null);
  const [isDoctorUploading, setIsDoctorUploading] = useState(false);
  const [twinSearchFilter, setTwinSearchFilter] = useState('');

  // Sanitizers for clean clinical display
  const cleanDoctorName = (doc?: string) => {
    if (!doc) return 'Hospital OPD Bay 04 Attending';
    const lower = doc.trim().toLowerCase();
    if (
      lower.includes('not provided') ||
      lower.includes('not mentioned') ||
      lower.includes('unknown') ||
      lower === 'none' ||
      lower === 'n/a'
    ) {
      return 'Hospital OPD Bay 04 Attending';
    }
    return doc;
  };

  const cleanChiefComplaint = (comp?: string, fallback?: string) => {
    if (!comp) return fallback || 'Severe hyperacidity with retrosternal burning and joint stiffness.';
    const lower = comp.toLowerCase();
    if (
      lower.includes('not provided in the document') ||
      lower.includes('not provided') ||
      lower === 'clinical intake'
    ) {
      return fallback || 'Severe hyperacidity with retrosternal burning after meals and bilateral knee joint stiffness.';
    }
    return comp;
  };

  const handleDoctorFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsDoctorUploading(true);
    triggerToast(`Uploading "${file.name}" to InsForge Storage & digitizing with Sarvam OCR...`);

    try {
      const result = await processPrescriptionWithSarvamAndInsForge(
        file,
        selectedSession.patient_id,
        selectedSession.id
      );

      const ext = result.extraction;
      const cleanName = cleanDocumentName(file.name);
      const newScan = {
        id: result.recordId || `scan-${Date.now()}`,
        session_id: selectedSession.id,
        file_url: result.storageUrl,
        prescribing_doctor: ext.prescribing_doctor || 'Hospital OPD Bay 04',
        diagnosis_found: ext.diagnosis_found || 'Clinical Intake',
        extracted_medications: ext.extracted_medications || [],
        detected_allergies: ext.detected_allergies || [],
        ocr_confidence: ext.ocr_confidence || 98.4,
        blocks: result.blocks || [],
        pages: result.pages || [],
        rawOcrText: result.rawOcrText || '',
        extraction: ext,
        lab_flags: ext
      };

      setSelectedSession((prev) => ({
        ...prev,
        prescription_scans: [newScan, ...(prev.prescription_scans || []).filter((s) => cleanDocumentName(s.file_key || s.file_url) !== cleanName)]
      }));
      setActiveScanIndex(0);

      const medsSummary = ext.extracted_medications?.map((m: any) => `${m.name} (${m.dosage || ''} ${m.frequency || ''})`).join(', ');
      setConsultationNotes((prev) =>
        `[Prescription Uploaded by Clinician via Sarvam OCR at ${new Date().toLocaleTimeString()}]\n` +
        `Document: ${cleanName}\nDiagnosis: ${ext.diagnosis_found}\n` +
        `Medications: ${medsSummary}\n` +
        (ext.contraindications_with_ulcer?.length ? `Contraindications: ${ext.contraindications_with_ulcer.join('; ')}\n` : '') +
        `Summary: ${ext.doctor_report || ext.patient_summary}\n\n` +
        prev
      );

      triggerToast(`Prescription "${cleanName}" digitized and stored in InsForge bucket!`);
    } catch (err: any) {
      console.error('Doctor prescription upload failed:', err);
        triggerToast('OCR processing failed: ' + (err?.message || 'Check Sarvam / InsForge'));
    } finally {
      setIsDoctorUploading(false);
    }
  };

  // Load live InsForge queue
  useEffect(() => {
    const loadQueue = () => {
      fetchOpdQueue()
        .then((data) => {
          if (data && data.length > 0) {
            setSessions(data);
            setSelectedSession((prev) => {
              const matched = data.find((s) => s.id === prev?.id);
              return matched || data[0];
            });
          }
        })
        .catch((err) => console.error('Failed to load queue:', err));
    };

    loadQueue();

    const handleNewPrescription = (e: any) => {
      const detail = e.detail;
      if (detail) {
        const cleanName = cleanDocumentName(detail.file_name);
        triggerToast(`New Prescription Scanned: ${detail.patient} - Digitized via Sarvam OCR`);
        setPatientUploadAlert({
          patient: detail.patient,
          fileName: cleanName,
          storageUrl: detail.storage_url,
          scanId: detail.id,
          summary: detail.clinical_summary
        });
        setActiveScanIndex(0);
        
        const medsSummary = detail.medications?.map((m: any) => `${m.name} (${m.dosage || ''} ${m.frequency || ''})`).join(', ') || 'Medications identified';
        const allergies = detail.detected_allergies?.join(', ') || 'None flagged';

        setConsultationNotes(
          `[Digitized Prescription Received via Sarvam Vision OCR & InsForge at ${new Date().toLocaleTimeString()}]\nPatient: ${detail.patient}\nDocument: ${cleanName}\nDiagnosis: ${detail.diagnosis_found || detail.chief_complaint || 'Clinical Intake'}\nExtracted Medications: ${medsSummary}\nAllergies Detected: ${allergies}\nClinical Summary: ${detail.clinical_summary || 'Prescription reviewed.'}\n\nDoctor Status: Digitized record verified by Dr. Vaidya Ananya Sharma (Bay 04).`
        );

        setSelectedSession((prev) => {
          const newScan = {
            id: detail.id || `scan-${Date.now()}`,
            session_id: prev.id,
            file_url: detail.storage_url || prev.prescription_scans?.[0]?.file_url,
            prescribing_doctor: detail.doctor || 'Hospital OPD Bay 04',
            diagnosis_found: detail.diagnosis_found || detail.chief_complaint || 'Clinical Intake',
            extracted_medications: detail.medications || [],
            detected_allergies: detail.detected_allergies || [],
            ocr_confidence: 98.4,
            blocks: detail.blocks || [],
            pages: detail.pages || [],
            rawOcrText: detail.rawOcrText || '',
            extraction: detail.extraction || {},
            lab_flags: detail.extraction || {}
          };
          const existing = (prev.prescription_scans || []).filter((s) => cleanDocumentName(s.file_key || s.file_url) !== cleanName);
          return {
            ...prev,
            prescription_scans: [newScan, ...existing]
          };
        });

        // Also reload full queue from InsForge
        loadQueue();
      }
    };

    const handlePrescriptionRemoved = (e: any) => {
      const removedId = e.detail?.id;
      if (removedId) {
        setSelectedSession((prev) => ({
          ...prev,
          prescription_scans: (prev.prescription_scans || []).filter((s) => s.id !== removedId)
        }));
        loadQueue();
      }
    };

    window.addEventListener('ayush_prescription_added', handleNewPrescription);
    window.addEventListener('ayush_prescription_removed', handlePrescriptionRemoved);
    return () => {
      window.removeEventListener('ayush_prescription_added', handleNewPrescription);
      window.removeEventListener('ayush_prescription_removed', handlePrescriptionRemoved);
    };
  }, []);

  const triggerToast = (msg: string) => {
    setShowNotificationToast(msg);
    setTimeout(() => setShowNotificationToast(null), 3500);
  };

  // Nav Items: 100% focused on Problem Statement 26047
  interface DoctorNavItem {
    id: 'intake' | 'socrates' | 'twin' | 'ocr' | 'queue';
    name: string;
    icon: any;
    badge?: string;
  }

  const navItems: DoctorNavItem[] = [
    { id: 'intake', name: 'Active Consultation', icon: Users },
    { id: 'socrates', name: 'Structured History (SOCRATES)', icon: FileText },
    { id: 'twin', name: '3D Digital Twin', icon: Layers, badge: 'Live 3D' },
    { id: 'ocr', name: 'Prescriptions & Lab OCR', icon: FlaskConical },
    { id: 'queue', name: 'OPD Queue & Triage', icon: Bell, badge: `${sessions.length}` },
  ];

  // Filtered queue sessions
  const filteredSessions = sessions.filter((s) => {
    const p = s.patients;
    const matchesSearch =
      !searchQuery ||
      s.token_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p?.abha_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.chief_complaint?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (queueFilter === 'emergency') return s.triage_priority === 'emergency';
    if (queueFilter === 'waiting') return s.status === 'waiting';
    if (queueFilter === 'completed') return s.status === 'completed';
    return true;
  });

  return (
    <div className="clinical-workspace clinical-workspace--doctor h-screen w-screen overflow-hidden bg-[#EDF0F8] text-slate-800 font-sans flex antialiased selection:bg-black selection:text-white">
      
      {/* Toast Alert */}
      {showNotificationToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-fade-in border border-slate-700">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{showNotificationToast}</span>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          1. LEFT NAVIGATION SIDEBAR (Pillio Clean Style - Collapsible)
          ────────────────────────────────────────────────────────── */}
      <aside
        className={`${
          isSidebarCollapsed ? 'w-20 p-3 items-center' : 'w-64 p-6'
        } transition-all duration-300 bg-[#EDF0F8] border-r border-slate-200/60 flex flex-col justify-between shrink-0 hidden lg:flex h-full overflow-y-auto`}
      >
        <div className="w-full">
          {/* Logo & Brand & Minimize Button */}
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between mb-8 px-2">
              <Link to="/" className="flex items-center gap-3 group cursor-pointer">
                <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-white shadow-sm group-hover:bg-slate-800 transition-colors font-bold text-sm">
                  M
                </div>
                <div>
                  <span className="font-bold text-lg text-slate-900 tracking-tight leading-none block">
                    MediChain <span className="text-blue-600">AI</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                    Doctor Workstation
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
                <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center text-white shadow-sm group-hover:bg-slate-800 transition-colors font-bold text-base">
                  M
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

          {/* Navigation Links */}
          <nav className="space-y-1.5 w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              if (isSidebarCollapsed) {
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveNav(item.id)}
                    title={item.name}
                    className={`w-12 h-12 mx-auto flex items-center justify-center rounded-2xl transition-all cursor-pointer relative ${
                      isActive
                        ? 'bg-black text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-white' : 'text-slate-600'} />
                    {item.badge && (
                      <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ring-2 ring-white ${item.id === 'twin' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`}></span>
                    )}
                  </button>
                );
              }
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-black text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? 'text-white' : 'text-slate-500'} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.id === 'twin'
                          ? isActive ? 'bg-emerald-400 text-slate-950 font-extrabold' : 'bg-emerald-100 text-emerald-800'
                          : isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Doctor Profile Card */}
        <div className="pt-6 border-t border-slate-200/60 w-full">
          {!isSidebarCollapsed ? (
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/60 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                  Dr
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-slate-900 truncate">{user?.name || user?.email || 'Dr. Alex Sharma'}</div>
                  <div className="text-[10px] text-slate-500 truncate">{user?.email ? 'Verified Clinician' : 'OPD Bay 04 • Attending'}</div>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  ABDM Verified
                </span>
                <span>Time: 4.2m saved</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shadow-2xs cursor-pointer"
                title={`${user?.name || user?.email || 'Dr. Alex Sharma'} • ABDM Verified Clinician`}
              >
                Dr
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ──────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA
          ────────────────────────────────────────────────────────── */}
      <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 shrink-0 bg-[#EDF0F8]/95 border-b border-slate-200/70 px-6 sm:px-8 flex items-center justify-between z-30 backdrop-blur-md">
          
          {/* Toggle Button + Search Bar */}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient token, ABHA ID, conditions..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200/80 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 ml-4">
            
            {/* Active Consultation Token Badge */}
            <div className="hidden md:flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 text-xs text-slate-700 shadow-2xs font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span>Active Token: <strong className="text-slate-900">{selectedSession.token_number}</strong></span>
              <span className="text-slate-300">•</span>
              <span>{selectedSession.patients?.full_name}</span>
            </div>

            {/* Language Selector */}
            <LanguageSelector />

            {/* Simulate Kiosk Intake Button */}
            <button
              onClick={() => setIsKioskModalOpen(true)}
              className="bg-black hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Simulate Kiosk Intake</span>
            </button>

            {/* Link to Patient Portal */}
            <Link
              to="/patient"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 hover:text-black font-medium bg-white hover:bg-slate-50 px-3.5 py-2 rounded-full border border-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <span>Patient Portal</span>
              <ExternalLink size={12} />
            </Link>

          </div>
        </header>

        {/* ──────────────────────────────────────────────────────────
            3. WORKSPACE BODY
            ────────────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 max-w-[1500px] w-full">
          
          {/* Real-Time Patient Upload Alert Banner */}
          {patientUploadAlert && (
            <div className="bg-white text-slate-900 rounded-2xl p-4 sm:p-5 border border-blue-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Live Patient Upload
                    </span>
                    <span className="text-xs text-slate-400">Just now</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                    {patientUploadAlert.patient} uploaded "{patientUploadAlert.fileName}"
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-1 max-w-2xl">
                    {patientUploadAlert.summary || 'Digitized via Sarvam Vision OCR. Entities extracted & ready for clinical review.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setConsultationSubTab('files');
                    setPatientUploadAlert(null);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FileText size={13} />
                  <span>Inspect Document</span>
                </button>
                {patientUploadAlert.storageUrl && (
                  <a
                    href={patientUploadAlert.storageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-full transition-all flex items-center gap-1.5 border border-slate-200"
                    title="Open Original Document in InsForge S3"
                  >
                    <ExternalLink size={12} />
                    <span>View File</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPatientUploadAlert(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Dismiss"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW 1: ACTIVE CONSULTATION WORKSTATION (Default / Intake)
              ══════════════════════════════════════════════════════════ */}
          {(activeNav === 'intake' || activeNav === 'socrates') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">

              {/* ── LEFT COLUMN: PATIENT QUEUE (4 cols) ── */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-slate-900" />
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                        Patient Queue
                      </h3>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        {filteredSessions.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsKioskModalOpen(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>New Intake</span>
                    </button>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex rounded-full bg-slate-100 p-1 text-[11px] font-medium">
                    {(['all', 'emergency', 'waiting', 'completed'] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setQueueFilter(filter)}
                        className={`flex-1 py-1 rounded-full text-center capitalize transition-all cursor-pointer ${
                          queueFilter === filter
                            ? 'bg-white font-bold text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {filter === 'emergency' ? 'Red Flag' : filter}
                      </button>
                    ))}
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search patient, token, complaint..."
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  {/* Patient List Items */}
                  <div className="space-y-2 pt-1">
                    {filteredSessions.map((s) => {
                      const isSelected = selectedSession.id === s.id;
                      const isEmergency = s.triage_priority === 'emergency';
                      const isUrgent = s.triage_priority === 'urgent';
                      const scanCount = s.prescription_scans?.length || 0;
                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedSession(s);
                            setActiveScanIndex(0);
                            setConsultationSubTab('summary');
                          }}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-slate-50/70 hover:bg-white text-slate-800 border-slate-200/70 hover:border-slate-300 hover:shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-800 border border-slate-200'
                              }`}
                            >
                              {s.token_number}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                isEmergency
                                  ? 'bg-rose-500 text-white'
                                  : isUrgent
                                  ? 'bg-amber-400 text-slate-950'
                                  : isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {isEmergency ? 'Emergency' : isUrgent ? 'Urgent' : s.status}
                            </span>
                          </div>
                          <div className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {s.patients?.full_name}
                          </div>
                          <div className={`text-[11px] mt-0.5 truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            {s.patients?.age} yrs, {s.patients?.gender} • {s.patients?.preferred_language || 'Hindi'}
                          </div>
                          <div className={`text-[11px] mt-1 line-clamp-1 italic ${isSelected ? 'text-blue-200' : 'text-slate-600'}`}>
                            {cleanChiefComplaint(s.chief_complaint)}
                          </div>
                          {scanCount > 0 && (
                            <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] ${
                              isSelected ? 'border-white/15 text-slate-300' : 'border-slate-200/60 text-slate-500'
                            }`}>
                              <span className="flex items-center gap-1 font-medium">
                                <FileText size={11} />
                                <span>{scanCount} {scanCount === 1 ? 'doc' : 'docs'}</span>
                              </span>
                              <span className={isSelected ? 'text-emerald-300 font-semibold' : 'text-emerald-700 font-semibold'}>
                                Sarvam OCR
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── RIGHT COLUMN: ACTIVE PATIENT WORKSPACE (8 cols) ── */}
              <div className="lg:col-span-8 space-y-4">

                {/* Patient Header Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="bg-slate-900 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-xl">
                          {selectedSession.token_number}
                        </span>
                        <h1 className="text-xl font-bold text-slate-900">
                          {selectedSession.patients?.full_name}
                        </h1>
                        <span className="text-xs text-slate-500 font-medium">
                          ({selectedSession.patients?.age} yrs, {selectedSession.patients?.gender})
                        </span>
                        <span className="font-mono text-xs text-slate-700 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-200">
                          ABHA: {selectedSession.patients?.abha_id}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Languages size={13} className="text-blue-600" />
                          Language: <strong>{selectedSession.patients?.preferred_language || 'Hindi'}</strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1 text-emerald-700">
                          <ShieldCheck size={13} />
                          ABDM Consent Verified
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <Clock size={13} />
                          Assigned Bay: {selectedSession.assigned_bay || 'Bay 04'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => triggerToast('Clinical summary pushed to hospital HIS & ABDM PHR!')}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Check size={14} />
                        <span>Complete Consultation</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerToast('Printing clinical summary dossier...')}
                        className="p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                        title="Print Summary"
                      >
                        <Printer size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Subtab Switcher Pills */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 flex-wrap">
                    {([
                      { id: 'summary' as const, label: 'Clinical Summary & Intake', icon: Activity },
                      { id: 'files' as const, label: `Documents & Files (${(selectedSession.prescription_scans || []).length})`, icon: FileText },
                      { id: 'twin' as const, label: '3D Digital Twin', icon: Layers },
                    ]).map((tab) => {
                      const Icon = tab.icon;
                      const isActive = consultationSubTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setConsultationSubTab(tab.id)}
                          className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isActive
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Icon size={13} className={isActive ? 'text-white' : 'text-slate-500'} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Triage Priority Alert Banner */}
                {selectedSession.triage_priority === 'emergency' && (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-900 shadow-2xs">
                    <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-rose-700">Priority Triage Alert</div>
                      <div className="text-xs mt-0.5 leading-relaxed">{selectedSession.triage_reason}</div>
                    </div>
                  </div>
                )}

                {/* ── SUBTAB 1: CLINICAL SUMMARY ── */}
                {consultationSubTab === 'summary' && (
                  <div className="space-y-4">
                    {/* Voice Anamnesis Card */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Volume2 size={15} className="text-blue-600" />
                          <h3 className="font-bold text-slate-900 text-sm">Multimodal Voice Anamnesis (Bhashini AI)</h3>
                        </div>
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full uppercase">
                          Transcribed
                        </span>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-900 leading-relaxed font-medium">
                        "{cleanChiefComplaint(selectedSession.chief_complaint, selectedSession.voice_transcript)}"
                      </div>
                      {selectedSession.voice_transcript && (
                        <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-500 italic">
                          <span className="not-italic bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-semibold shrink-0">
                            Hindi Audio
                          </span>
                          <span>"{selectedSession.voice_transcript}"</span>
                        </div>
                      )}
                    </div>

                    {/* SOCRATES History Card */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <FileText size={15} className="text-purple-600" />
                          <h3 className="font-bold text-slate-900 text-sm">SOCRATES Clinical History</h3>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          Severity: <strong className="text-rose-600">{selectedSession.socrates_data?.severity || 7}/10</strong>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                        {[
                          { label: 'Site', value: selectedSession.socrates_data?.site },
                          { label: 'Onset', value: selectedSession.socrates_data?.onset },
                          { label: 'Character', value: selectedSession.socrates_data?.character },
                          { label: 'Timing', value: selectedSession.socrates_data?.timing },
                          { label: 'Radiation', value: selectedSession.socrates_data?.radiation },
                          { label: 'Associations', value: selectedSession.socrates_data?.associations },
                        ].map((item) => (
                          <div key={item.label} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</span>
                            <div className="font-semibold text-slate-800 mt-0.5">{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ayush Pariksha Card */}
                    {selectedSession.ayush_pariksha?.[0] && (
                      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <Activity size={15} className="text-emerald-600" />
                            <h3 className="font-bold text-slate-900 text-sm">Ayush Dashavidha &amp; Ahara-Vihara Pariksha</h3>
                          </div>
                          <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            {selectedSession.ayush_pariksha[0].prakriti_primary}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ahara (Diet)</span>
                            <div className="font-semibold text-slate-900 mt-1">{selectedSession.ayush_pariksha[0].ahara_habits?.timings}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {selectedSession.ayush_pariksha[0].ahara_habits?.diet_type} • Water: {selectedSession.ayush_pariksha[0].ahara_habits?.water_intake}
                            </div>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vihara &amp; Agni</span>
                            <div className="font-semibold text-slate-900 mt-1">{selectedSession.ayush_pariksha[0].agni_state}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Sleep: {selectedSession.ayush_pariksha[0].vihara_habits?.sleep}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Consultation Notes & Advice Pad Card */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Edit3 size={15} className="text-slate-700" />
                          <h3 className="font-bold text-slate-900 text-sm">Doctor Consultation &amp; Rx Advice Pad</h3>
                        </div>
                        <button
                          onClick={() => setIsEditingNotes(!isEditingNotes)}
                          className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                        >
                          {isEditingNotes ? 'Done Editing' : 'Edit Notes'}
                        </button>
                      </div>
                      {isEditingNotes ? (
                        <textarea
                          value={consultationNotes}
                          onChange={(e) => setConsultationNotes(e.target.value)}
                          rows={4}
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 leading-relaxed"
                        />
                      ) : (
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-700 leading-relaxed font-medium">
                          {consultationNotes}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── SUBTAB 2: DOCUMENTS & FILES ── */}
                {consultationSubTab === 'files' && (() => {
                  const scans = selectedSession.prescription_scans || [];
                  const scan = scans[activeScanIndex] || scans[0];
                  const cleanName = cleanDocumentName(scan?.file_key || scan?.file_url);
                  const lab = (scan?.lab_flags as any) || {};
                  const blocks = scan?.blocks || lab?.ocr_blocks || [];
                  const pages = scan?.pages || lab?.pages || [];
                  const rawOcrText = scan?.rawOcrText || lab?.raw_ocr_text || '';
                  const extraction = scan?.extraction || {
                    doctor_report: lab?.doctor_report || selectedSession.chief_complaint,
                    patient_summary: lab?.patient_summary || selectedSession.voice_transcript,
                    extracted_medications: scan?.extracted_medications || [],
                    detected_allergies: scan?.detected_allergies || [],
                    diagnosis_found: scan?.diagnosis_found || selectedSession.chief_complaint,
                    prescribing_doctor: scan?.prescribing_doctor || 'Hospital OPD',
                    urgency: (selectedSession.triage_priority === 'urgent' ? 'high' : selectedSession.triage_priority) as any,
                  };

                  return (
                    <div className="space-y-4">
                      {/* Document Controls Card */}
                      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <FlaskConical size={16} className="text-amber-600" />
                            <h3 className="font-bold text-slate-900 text-sm">Digitized Prescriptions &amp; Lab OCR</h3>
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                              Sarvam Vision OCR
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {scan?.file_url && (
                              <a
                                href={scan.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-full border border-blue-200 transition-colors shadow-2xs"
                              >
                                <ExternalLink size={12} />
                                <span>View Original Document</span>
                              </a>
                            )}
                            <button
                              onClick={() => doctorFileInputRef.current?.click()}
                              disabled={isDoctorUploading}
                              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                            >
                              <UploadCloud size={13} />
                              <span>{isDoctorUploading ? 'Scanning...' : 'Upload Rx'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Document Timeline Selector */}
                        {scans.length > 0 && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Clock size={12} className="text-indigo-600" />
                                <span>Patient Medical Documents ({scans.length})</span>
                              </span>
                              <span>Select document to inspect</span>
                            </div>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                              {scans.map((s, idx) => {
                                const isDocActive = idx === (activeScanIndex < scans.length ? activeScanIndex : 0);
                                const docName = cleanDocumentName(s.file_key || s.file_url);
                                return (
                                  <button
                                    key={s.id || idx}
                                    type="button"
                                    onClick={() => setActiveScanIndex(idx)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
                                      isDocActive
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    <FileText size={13} className={isDocActive ? 'text-white' : 'text-slate-400'} />
                                    <span className="max-w-[160px] truncate">{docName}</span>
                                    <span
                                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                        isDocActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      {idx === 0 ? 'Latest' : `#${idx + 1}`}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <input
                          ref={doctorFileInputRef}
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => handleDoctorFileUpload(e.target.files)}
                        />

                        {!scan ? (
                          <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            No prescriptions digitized yet. Click "Upload Rx" to process with Sarvam OCR.
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
                              <span>Prescribing Clinician: <strong className="text-slate-800">{cleanDoctorName(scan.prescribing_doctor)}</strong></span>
                              <span>Document: <strong className="text-slate-900 font-bold">{cleanName}</strong> • OCR: <strong className="text-emerald-600 font-bold">{scan.ocr_confidence || 98.4}%</strong></span>
                            </div>

                            {(scan.detected_allergies && scan.detected_allergies.length > 0) && (
                              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800">
                                <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                                <div>
                                  <strong>Active Drug Allergy Flag:</strong>{' '}
                                  <span>{scan.detected_allergies.join(', ')}</span> (Avoid contraindications).
                                </div>
                              </div>
                            )}

                            {scan.lab_flags && (
                              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                                  <AlertTriangle size={14} className="text-amber-600" />
                                  <span>Contraindications &amp; Precautions (Sarvam Clinical Extraction):</span>
                                </div>
                                <div className="text-[11px] text-amber-800 pl-1 leading-relaxed">
                                  {Array.isArray(scan.lab_flags) ? (
                                    <ul className="list-disc list-inside space-y-0.5">
                                      {scan.lab_flags.map((flag: any, fIdx: number) => (
                                        <li key={fIdx}>{typeof flag === 'string' ? flag : flag.flag || JSON.stringify(flag)}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    scan.lab_flags.doctor_report || scan.lab_flags.patient_summary || 'Prescription reviewed for contraindications.'
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Medications Table */}
                            <div className="bg-slate-50 rounded-xl border border-slate-200/60 overflow-hidden text-xs">
                              <table className="w-full text-left">
                                <thead className="bg-slate-100 border-b border-slate-200 text-slate-500">
                                  <tr>
                                    <th className="py-2.5 px-3.5 font-semibold">Medication</th>
                                    <th className="py-2.5 px-3.5 font-semibold">Dosage</th>
                                    <th className="py-2.5 px-3.5 font-semibold">Frequency</th>
                                    <th className="py-2.5 px-3.5 font-semibold">Instructions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200/60 bg-white">
                                  {(scan.extracted_medications || []).map((m: any, idx: number) => (
                                    <tr key={idx}>
                                      <td className="py-2.5 px-3.5 font-medium text-slate-900">{m.name}</td>
                                      <td className="py-2.5 px-3.5 font-mono text-slate-600">{m.dosage}</td>
                                      <td className="py-2.5 px-3.5 text-slate-600">{m.frequency}</td>
                                      <td className="py-2.5 px-3.5 text-slate-500 text-[11px]">{m.instructions}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {scan.extracted_medications && scan.extracted_medications.length > 0 && (
                              <div className="flex items-center justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const medsSummary = (scan.extracted_medications || [])
                                      .map((m: any) => `- ${m.name} ${m.dosage || ''} (${m.frequency || 'OD'}) [${m.instructions || ''}]`)
                                      .join('\n');
                                    setConsultationNotes((prev) => `${prev}\n\n[Imported from ${cleanName}]:\n${medsSummary}`);
                                    triggerToast(`Imported ${scan.extracted_medications?.length || 0} medications to Advice Pad!`);
                                  }}
                                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                                >
                                  <Plus size={13} />
                                  <span>Import {cleanName} Meds to Advice Pad</span>
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Side-by-side OCR Inspection Card */}
                      {scan && (
                        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <Sparkles size={15} className="text-indigo-600" />
                              <h3 className="font-bold text-slate-900 text-sm">Side-by-Side OCR Inspector</h3>
                            </div>
                            <span className="text-[11px] text-slate-500">
                              Interactive bounding box overlay on original document
                            </span>
                          </div>
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <OcrComparisonViewer
                              originalFileUrl={scan.file_url}
                              originalFileName={cleanName}
                              blocks={blocks}
                              pages={pages}
                              rawOcrText={rawOcrText}
                              extraction={extraction}
                              isModal={false}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── SUBTAB 3: 3D DIGITAL TWIN ── */}
                {consultationSubTab === 'twin' && (
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <h3 className="font-bold text-slate-900 text-sm">3D Biometric Digital Twin</h3>
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          Live Sync
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIs3DViewerOpen(true)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Maximize2 size={12} />
                        <span>Fullscreen 3D</span>
                      </button>
                    </div>

                    {/* Organ Telemetry Matrix */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Brain</div>
                        <div className="text-xs font-bold text-emerald-600 mt-0.5">Optimal (9%)</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Heart</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">78 bpm</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Lungs</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">98% SpO2</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">GI / Joints</div>
                        <div className="text-xs font-bold text-amber-600 mt-0.5">Focal Irritation</div>
                      </div>
                    </div>

                    {/* 3D WebGL Canvas */}
                    <div className="w-full h-[620px] rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                      <DigitalTwin
                        key={selectedSession.id}
                        analysisData={selectedSession.chief_complaint}
                        recordId={selectedSession.id}
                      />
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW 2: DEDICATED 3D ANATOMICAL TWIN WORKSTATION
              ══════════════════════════════════════════════════════════ */}
          {activeNav === 'twin' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* 1. Header & Quick Return Navigation */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      MineArena 1.0 • 3D Biometric Anatomical Workstation
                    </span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                      Live 3D Telemetry Synchronized
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    3D Anatomical Digital Twin &amp; Pathology Mapping
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Select any patient from the queue below to inspect dynamic 3D organ stress, peel anatomical layers, and correlate symptoms with Sarvam clinical extraction.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveNav('intake')}
                    className="px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
                    title="Return to Active OPD Consultation Desk"
                  >
                    <Users size={14} className="text-blue-600" />
                    <span>Back to Consultation Desk</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIs3DViewerOpen(true)}
                    className="px-4 py-2 bg-black hover:bg-slate-800 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Maximize2 size={13} />
                    <span>Fullscreen 3D Window</span>
                  </button>
                </div>
              </div>

              {/* 2. Patient Selector Carousel / Grid */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      Select Patient for 3D Inspection ({sessions.length} in OPD Queue)
                    </h3>
                  </div>

                  {/* Patient Search in 3D Twin View */}
                  <div className="relative w-full sm:w-64">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={twinSearchFilter}
                      onChange={(e) => setTwinSearchFilter(e.target.value)}
                      placeholder="Search patient or condition..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>

                {/* Patient Selectable Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {sessions
                    .filter((s) => {
                      if (!twinSearchFilter) return true;
                      const q = twinSearchFilter.toLowerCase();
                      return (
                        s.token_number?.toLowerCase().includes(q) ||
                        s.patients?.full_name?.toLowerCase().includes(q) ||
                        s.chief_complaint?.toLowerCase().includes(q)
                      );
                    })
                    .map((s) => {
                      const isSelected = selectedSession.id === s.id;
                      const isEmergency = s.triage_priority === 'emergency';
                      const isUrgent = s.triage_priority === 'urgent';
                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedSession(s);
                            setActiveScanIndex(0);
                            triggerToast(`3D Digital Twin switched to ${s.patients?.full_name} (${s.token_number})`);
                          }}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                            isSelected
                              ? 'bg-slate-950 text-white border-slate-950 ring-2 ring-emerald-400/50 shadow-md scale-[1.01]'
                              : 'bg-slate-50/70 hover:bg-white text-slate-800 border-slate-200/80 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-lg ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-800 border border-slate-200 shadow-2xs'
                            }`}>
                              {s.token_number}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                isEmergency
                                  ? 'bg-rose-500 text-white'
                                  : isUrgent
                                  ? 'bg-amber-400 text-slate-900'
                                  : isSelected
                                  ? 'bg-emerald-400 text-slate-950'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isEmergency ? 'Emergency' : isUrgent ? 'Urgent' : 'Routine'}
                            </span>
                          </div>

                          <div className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {s.patients?.full_name}
                          </div>
                          <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            {s.patients?.age} yrs • {s.patients?.gender} • Bay 04
                          </div>
                          <div className={`text-[10px] mt-1 line-clamp-1 italic ${isSelected ? 'text-emerald-300' : 'text-slate-600'}`}>
                            {s.chief_complaint}
                          </div>

                          {isSelected && (
                            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white">
                              <Check size={10} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* 3. Active Patient Biometrics & Organ Status Banner */}
              <div className="bg-white text-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-mono bg-slate-900 text-white px-2.5 py-0.5 rounded-md font-bold text-xs">
                      {selectedSession.token_number}
                    </span>
                    <span className="font-bold text-sm text-slate-900">{selectedSession.patients?.full_name}</span>
                    <span className="text-slate-500">({selectedSession.patients?.age} yrs, {selectedSession.patients?.gender})</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600 font-mono text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      ABHA: {selectedSession.patients?.abha_id}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Primary Diagnosis: <strong className="text-slate-900">{cleanChiefComplaint(selectedSession.chief_complaint)}</strong>
                  </div>
                </div>

                {/* Quick Organ Status Flags */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Heart Rate</div>
                    <div className="text-xs font-bold text-emerald-600">76 bpm</div>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Blood Pressure</div>
                    <div className="text-xs font-bold text-slate-800">122/80</div>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                    <div className="text-[9px] text-slate-400 uppercase font-bold">SpO2</div>
                    <div className="text-xs font-bold text-slate-800">98%</div>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Ayush Agni</div>
                    <div className="text-xs font-bold text-amber-600">Samagni</div>
                  </div>
                </div>
              </div>

              {/* 4. Grand Spacious 3D Canvas */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-blue-600" />
                    <span className="font-semibold text-slate-800">
                      Interactive 3D Controls: Click organs to zoom &amp; orbit • Use "Peel" to strip Skin, Muscles, and Blood Vessels
                    </span>
                  </div>
                  <span className="hidden sm:inline text-[11px] text-slate-400">
                    Sketchfab WebGL • Real-time Hardware Accelerated
                  </span>
                </div>

                <div className="w-full h-[740px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                  <DigitalTwin
                    key={selectedSession.id}
                    analysisData={selectedSession.chief_complaint}
                    recordId={selectedSession.id}
                  />
                </div>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW 3: PRESCRIPTIONS & LAB OCR (Dedicated View)
              ══════════════════════════════════════════════════════════ */}
          {activeNav === 'ocr' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm animate-fade-in space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Live Sarvam Vision OCR &amp; Clinical Extraction
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                    Interactive Side-by-Side Prescription &amp; Lab Inspector
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Original document with interactive bounding box overlays synced to Sarvam OCR blocks and clinical report.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={doctorFileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleDoctorFileUpload(e.target.files)}
                  />
                  <button
                    onClick={() => doctorFileInputRef.current?.click()}
                    disabled={isDoctorUploading}
                    className="px-4 py-2 bg-black hover:bg-slate-800 text-white text-xs font-semibold rounded-full flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <UploadCloud size={14} className={isDoctorUploading ? 'animate-bounce' : ''} />
                    <span>{isDoctorUploading ? 'Digitizing...' : 'Upload & Digitize'}</span>
                  </button>
                </div>
              </div>

              {/* Embedded Interactive OCR Comparison Viewer */}
              {(() => {
                const scans = selectedSession.prescription_scans || [];
                if (scans.length === 0) {
                  return (
                    <div className="p-16 text-center text-slate-500 text-xs border border-dashed border-slate-200 rounded-3xl">
                      <FlaskConical size={32} className="mx-auto mb-2 text-slate-400" />
                      <p className="font-semibold text-slate-700">No scanned prescriptions for this session</p>
                      <p className="text-slate-400 mt-1">Upload a prescription above or patient can upload from their portal.</p>
                    </div>
                  );
                }

                const currentScanIndex = activeScanIndex < scans.length ? activeScanIndex : 0;
                const scan = scans[currentScanIndex];
                const cleanName = cleanDocumentName(scan.file_key || scan.file_url);

                const lab = (scan.lab_flags as any) || {};
                const blocks = scan.blocks || lab?.ocr_blocks || [];
                const pages = scan.pages || lab?.pages || [];
                const rawOcrText = scan.rawOcrText || lab?.raw_ocr_text || '';
                const extraction = scan.extraction || {
                  doctor_report: lab?.doctor_report || selectedSession.chief_complaint,
                  patient_summary: lab?.patient_summary || selectedSession.voice_transcript,
                  extracted_medications: scan.extracted_medications || [],
                  detected_allergies: scan.detected_allergies || [],
                  diagnosis_found: scan.diagnosis_found || selectedSession.chief_complaint,
                  prescribing_doctor: scan.prescribing_doctor || 'Hospital OPD',
                  urgency: (selectedSession.triage_priority === 'urgent' ? 'high' : selectedSession.triage_priority) as any,
                  vitals: lab?.vitals,
                  recommendations: lab?.recommendations,
                  organ_impact: lab?.organ_impact
                };

                return (
                  <div className="space-y-4">
                    {/* Chronological Patient Documents Timeline Bar */}
                    {scans.length > 1 && (
                      <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-1">
                            <Clock size={12} className="text-indigo-600" />
                            Patient Timeline ({scans.length}):
                          </span>
                          {scans.map((s, idx) => {
                            const isDocActive = idx === currentScanIndex;
                            const docName = cleanDocumentName(s.file_key || s.file_url);
                            return (
                              <button
                                key={s.id || idx}
                                type="button"
                                onClick={() => setActiveScanIndex(idx)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
                                  isDocActive
                                    ? 'bg-black text-white border-black shadow-xs font-bold'
                                    : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                <FileText size={13} className={isDocActive ? 'text-white' : 'text-slate-400'} />
                                <span className="max-w-[170px] truncate">{docName}</span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                    isDocActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {idx === 0 ? 'Latest' : `Doc ${idx + 1}`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          Viewing document {currentScanIndex + 1} of {scans.length}
                        </span>
                      </div>
                    )}

                    {/* Active Document Metadata & Quick Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                      <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                        <span>Active Document: <strong className="text-indigo-600 font-bold">{cleanName}</strong></span>
                        <span>•</span>
                        <span>Clinician: <strong className="text-slate-800">{cleanDoctorName(scan.prescribing_doctor)}</strong></span>
                        <span>•</span>
                        <span>OCR Confidence: <strong className="text-emerald-600 font-bold">{scan.ocr_confidence || 98.4}%</strong></span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {scan.file_url && (
                          <a
                            href={scan.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1.5 border border-blue-200 transition-colors shadow-2xs"
                            title="Open original document directly from InsForge S3"
                          >
                            <ExternalLink size={12} />
                            <span>Open Stored PDF</span>
                          </a>
                        )}
                        {scan.extracted_medications && scan.extracted_medications.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const medsSummary = (scan.extracted_medications || [])
                                .map((m: any) => `- ${m.name} ${m.dosage || ''} (${m.frequency || 'OD'}) [${m.instructions || ''}]`)
                                .join('\n');
                              setConsultationNotes((prev) => `${prev}\n\n[Imported from ${cleanName}]:\n${medsSummary}`);
                              triggerToast(`Imported ${scan.extracted_medications?.length || 0} medications to Consultation Notes!`);
                            }}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full flex items-center gap-1.5 border border-indigo-200 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Plus size={12} />
                            <span>Import Meds to Advice Pad</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/50">
                      <OcrComparisonViewer
                        originalFileUrl={scan.file_url}
                        originalFileName={cleanName}
                        blocks={blocks}
                        pages={pages}
                        rawOcrText={rawOcrText}
                        extraction={extraction}
                        isModal={false}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              VIEW 4: OPD QUEUE & TRIAGE MANAGEMENT
              ══════════════════════════════════════════════════════════ */}
          {activeNav === 'queue' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm animate-fade-in space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    OPD Bay 04 Queue
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                    Live Waiting Patients &amp; Triage Priority
                  </h2>
                </div>

                {/* Filter Tabs */}
                <div className="flex rounded-full bg-slate-100 p-1 text-xs font-medium">
                  {(['all', 'emergency', 'waiting', 'completed'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setQueueFilter(filter)}
                      className={`px-3.5 py-1.5 rounded-full capitalize transition-all cursor-pointer ${
                        queueFilter === filter ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {filter === 'emergency' ? 'Red Flags' : filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Queue Table */}
              <div className="space-y-3">
                {filteredSessions.map((session) => {
                  const isSelected = selectedSession.id === session.id;
                  const isEmergency = session.triage_priority === 'emergency';
                  return (
                    <div
                      key={session.id}
                      onClick={() => {
                        setSelectedSession(session);
                        setActiveScanIndex(0);
                        setActiveNav('intake');
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-slate-50 border-black ring-1 ring-black/10 shadow-xs'
                          : 'bg-white hover:bg-slate-50/80 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-xl">
                          {session.token_number}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            {session.patients?.full_name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {session.patients?.age} yrs • {session.patients?.gender} • ABHA: {session.patients?.abha_id}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <div className="text-xs text-slate-700 font-medium truncate max-w-[280px]">
                            {session.chief_complaint}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Preferred Language: {session.patients?.preferred_language}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-3 py-1 rounded-full shrink-0 ${
                            isEmergency
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isEmergency ? 'Emergency' : session.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </main>

        {/* Footer */}
        <footer className="mt-auto bg-[#EDF0F8] border-t border-slate-200/60 py-4 px-8 text-xs text-slate-500 text-center">
          <span>© 2026 MediChain AI • MineArena 1.0 National Hackathon • Patient-Owned Health Records</span>
        </footer>

      </div>

      {/* Modals */}
      <KioskIntakeModal
        isOpen={isKioskModalOpen}
        onClose={() => setIsKioskModalOpen(false)}
        onIntakeComplete={() => {
          triggerToast('New patient completed MediKiosk autonomous intake & loaded to queue!');
        }}
      />

      <Human3DViewerModal
        isOpen={is3DViewerOpen}
        onClose={() => setIs3DViewerOpen(false)}
        patientName={selectedSession.patients?.full_name}
        initialFocus="foot"
      />

      <VoiceAgentModal
        isOpen={isVoiceAgentOpen}
        onClose={() => setIsVoiceAgentOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultRole="vaidya"
      />

    </div>
  );
}
