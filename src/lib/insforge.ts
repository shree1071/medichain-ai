import { createClient } from '@insforge/sdk';

const baseUrl = import.meta.env.VITE_INSFORGE_URL || 'https://92jbtvy9.us-east.insforge.app';
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY || '';

export const insforge = createClient({
  baseUrl,
  anonKey,
});

// ── Types for MediChain AI Clinical Architecture ───────────────────
export interface Patient {
  id: string;
  abha_id?: string;
  full_name: string;
  age: number;
  gender: string;
  phone?: string;
  preferred_language?: string;
  created_at?: string;
}

export interface OpdSession {
  id: string;
  patient_id: string;
  token_number: string;
  department: string;
  status: 'waiting' | 'in_intake' | 'completed' | 'in_consultation' | 'discharged';
  triage_priority: 'emergency' | 'urgent' | 'routine';
  triage_reason?: string;
  chief_complaint?: string;
  symptoms_duration?: string;
  socrates_data?: {
    site?: string;
    onset?: string;
    character?: string;
    radiation?: string;
    associations?: string;
    timing?: string;
    severity?: number;
  };
  voice_transcript?: string;
  assigned_bay?: string;
  created_at: string;
  updated_at?: string;
  patients?: Patient;
  ayush_pariksha?: AyushPariksha[];
  prescription_scans?: PrescriptionScan[];
}

export interface AyushPariksha {
  id?: string;
  session_id: string;
  dominant_rasa?: string;
  ahara_habits?: {
    timings?: string;
    diet_type?: string;
    water_intake?: string;
  };
  vihara_habits?: {
    sleep?: string;
    exercise?: string;
    stress_level?: string;
  };
  agni_state?: string;
  prakriti_primary?: string;
  dashavidha_ready?: boolean;
}

export interface OcrBlock {
  block_id: string;
  text: string;
  layout_tag: string;
  reading_order?: number;
  coordinates?: { x1: number; y1: number; x2: number; y2: number };
  bbox_norm?: [number, number, number, number];
}

export interface SarvamExtraction {
  doctor_report?: string;
  patient_summary?: string;
  prescribing_doctor?: string;
  diagnosis_found?: string;
  extracted_medications?: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    instructions?: string;
    category?: string;
  }>;
  detected_allergies?: string[];
  contraindications?: string[];
  contraindications_with_ulcer?: string[];
  vitals?: Record<string, string>;
  vitals_extracted?: Record<string, string>;
  recommendations?: string[];
  organ_impact?: Record<string, 'safe' | 'warning' | 'risk'>;
  risk_score?: number;
  urgency?: 'routine' | 'medium' | 'high' | 'urgent' | 'emergency';
  ocr_confidence?: number;
}

export interface PrescriptionScan {
  id?: string;
  session_id: string;
  file_url?: string;
  file_key?: string;
  prescribing_doctor?: string;
  diagnosis_found?: string;
  extracted_medications?: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    instructions?: string;
    category?: string;
  }>;
  detected_allergies?: string[];
  ocr_confidence?: number;
  lab_flags?: any;
  blocks?: OcrBlock[];
  pages?: any[];
  rawOcrText?: string;
  extraction?: SarvamExtraction;
  created_at?: string;
}

export interface DoctorProfile {
  id: string;
  auth_user_id?: string;
  full_name: string;
  email: string;
  role: string;
  specialization?: string;
  hospital_name?: string;
  opd_bay?: string;
}

// ── Database Operations ─────────────────────────────────────────────

/**
 * Fetch all active OPD sessions with patient and clinical assessment details
 */
export async function fetchOpdQueue(): Promise<OpdSession[]> {
  try {
    const { data: sessions, error } = await insforge.database
      .from('opd_sessions')
      .select('*, patients(*), ayush_pariksha(*), prescription_scans(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching OPD queue from InsForge:', error);
      return [];
    }

    const rawSessions = (sessions as OpdSession[]) || [];
    return rawSessions.map((s) => {
      const validScans = (s.prescription_scans || []).filter((sc) => sc.file_url || sc.file_key);
      const seen = new Set<string>();
      const dedupScans: PrescriptionScan[] = [];
      for (const sc of validScans) {
        const clean = cleanDocumentName(sc.file_key || sc.file_url).toLowerCase();
        if (!seen.has(clean)) {
          seen.add(clean);
          dedupScans.push(sc);
        }
      }
      return {
        ...s,
        prescription_scans: dedupScans,
      };
    });
  } catch (err) {
    console.error('Failed to fetch OPD queue:', err);
    return [];
  }
}

/**
 * Create a complete patient intake from the autonomous Kiosk
 */
export async function createKioskIntake(params: {
  patient: {
    abha_id?: string;
    full_name: string;
    age: number;
    gender: string;
    phone?: string;
    preferred_language?: string;
  };
  session: {
    chief_complaint: string;
    symptoms_duration: string;
    department?: string;
    triage_priority: 'emergency' | 'urgent' | 'routine';
    triage_reason?: string;
    socrates_data?: Record<string, any>;
    voice_transcript?: string;
    assigned_bay?: string;
  };
  ayush?: {
    dominant_rasa?: string;
    ahara_habits?: Record<string, any>;
    vihara_habits?: Record<string, any>;
    agni_state?: string;
    prakriti_primary?: string;
  };
  prescription?: {
    prescribing_doctor?: string;
    diagnosis_found?: string;
    extracted_medications?: any[];
    detected_allergies?: string[];
    ocr_confidence?: number;
  };
}): Promise<{ success: boolean; token_number?: string; error?: string }> {
  try {
    // 1. Insert or reuse patient
    const { data: patientData, error: patientError } = await insforge.database
      .from('patients')
      .insert([params.patient])
      .select('id')
      .single();

    if (patientError || !patientData) {
      console.error('Error creating patient:', patientError);
      return { success: false, error: patientError?.message || 'Failed to save patient' };
    }

    const patientId = (patientData as { id: string }).id;
    const tokenNum = `TK-${Math.floor(10 + Math.random() * 90)}`;

    // 2. Insert OPD Session
    const { data: sessionData, error: sessionError } = await insforge.database
      .from('opd_sessions')
      .insert([
        {
          patient_id: patientId,
          token_number: tokenNum,
          department: params.session.department || 'General Ayush OPD',
          status: 'waiting',
          triage_priority: params.session.triage_priority,
          triage_reason: params.session.triage_reason,
          chief_complaint: params.session.chief_complaint,
          symptoms_duration: params.session.symptoms_duration,
          socrates_data: params.session.socrates_data || {},
          voice_transcript: params.session.voice_transcript,
          assigned_bay: params.session.assigned_bay || 'Bay 01',
        },
      ])
      .select('id')
      .single();

    if (sessionError || !sessionData) {
      console.error('Error creating OPD session:', sessionError);
      return { success: false, error: sessionError?.message || 'Failed to save session' };
    }

    const sessionId = (sessionData as { id: string }).id;

    // 3. Insert Ayush Pariksha if present
    if (params.ayush) {
      await insforge.database.from('ayush_pariksha').insert([
        {
          session_id: sessionId,
          dominant_rasa: params.ayush.dominant_rasa,
          ahara_habits: params.ayush.ahara_habits || {},
          vihara_habits: params.ayush.vihara_habits || {},
          agni_state: params.ayush.agni_state || 'Samagni',
          prakriti_primary: params.ayush.prakriti_primary || 'Vata-Pitta',
          dashavidha_ready: true,
        },
      ]);
    }

    // 4. Insert Prescription OCR if present
    if (params.prescription) {
      await insforge.database.from('prescription_scans').insert([
        {
          session_id: sessionId,
          prescribing_doctor: params.prescription.prescribing_doctor || 'Unknown Clinician',
          diagnosis_found: params.prescription.diagnosis_found,
          extracted_medications: params.prescription.extracted_medications || [],
          detected_allergies: params.prescription.detected_allergies || [],
          ocr_confidence: params.prescription.ocr_confidence || 98.2,
        },
      ]);
    }

    return { success: true, token_number: tokenNum };
  } catch (err: any) {
    console.error('Kiosk intake transaction error:', err);
    return { success: false, error: err?.message || 'Unexpected intake error' };
  }
}

/**
 * Update OPD Session status (e.g. mark in consultation or discharged)
 */
export async function updateOpdSessionStatus(
  sessionId: string,
  status: 'waiting' | 'in_consultation' | 'completed' | 'discharged'
): Promise<boolean> {
  try {
    const { error } = await insforge.database
      .from('opd_sessions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    return !error;
  } catch (err) {
    console.error('Failed to update session status:', err);
    return false;
  }
}

/**
 * Upload prescription or medical document to InsForge storage bucket
 */
export async function uploadPatientPrescriptionFile(file: File, patientId: string = 'patient'): Promise<{ url: string | null; key: string | null; error?: string }> {
  try {
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${patientId}/${Date.now()}_${cleanName}`;
    
    const { data, error } = await insforge.storage
      .from('patient-records')
      .upload(filePath, file);

    if (error) {
      console.warn('Storage upload error, using local object URL fallback:', error);
      const fallbackUrl = URL.createObjectURL(file);
      return { url: fallbackUrl, key: filePath };
    }

    const { data: urlData } = insforge.storage
      .from('patient-records')
      .getPublicUrl(data?.key || filePath);

    return { 
      url: urlData?.publicUrl || URL.createObjectURL(file), 
      key: data?.key || filePath 
    };
  } catch (err: any) {
    console.error('Prescription file upload exception:', err);
    return { url: URL.createObjectURL(file), key: `local_${Date.now()}` };
  }
}

/**
 * Send document through Sarvam Doc-AI OCR & 105B Reasoning,
 * upload to InsForge Storage, persist into InsForge Database, and notify doctor
 */
export async function processPrescriptionWithSarvamAndInsForge(
  file: File,
  patientId: string = 'patient-demo',
  sessionId?: string
): Promise<{
  success: boolean;
  recordId?: string;
  storageUrl?: string;
  storageKey?: string;
  rawOcrText?: string;
  pages?: any[];
  blocks?: OcrBlock[];
  extraction: SarvamExtraction;
}> {
  // 1. Convert file to Base64 data URL
  const fileDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // 2. Call backend endpoint which uses InsForge Admin SDK + Sarvam APIs
  const response = await fetch('/api/sarvam-ocr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileDataUrl,
      fileName: file.name,
      fileType: file.type,
      patientId,
      sessionId,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server OCR request failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Utility to strip storage paths and timestamp prefixes from filenames
 * e.g., "prescriptions/1788806399504_shree.pdf" -> "shree.pdf"
 */
export function cleanDocumentName(rawName?: string): string {
  if (!rawName) return 'Prescription_Document.pdf';
  let decoded = rawName;
  try {
    decoded = decodeURIComponent(rawName);
  } catch (e) {}
  const withoutQuery = decoded.split('?')[0];
  const base = withoutQuery.split('/').pop() || withoutQuery;
  const stripped = base.replace(/^\d{10,15}_/, '').replace(/^prescriptions[\\/]/, '');
  if (/^\d{10,15}\.pdf$/i.test(stripped)) {
    return `Prescription_Record_${stripped.slice(-6, -4)}.pdf`;
  }
  if (/^download/i.test(stripped)) {
    const ext = stripped.split('.').pop() || 'jpg';
    const numMatch = stripped.match(/\d+/);
    const num = numMatch ? numMatch[0].padStart(2, '0') : '01';
    return `Prescription_Scan_${num}.${ext.toLowerCase() === 'jfif' ? 'jpg' : ext.toLowerCase()}`;
  }
  return stripped.replace(/_+/g, '_');
}

/**
 * Fetch all prescription scans for a session or patient directly from InsForge
 */
export async function fetchPatientPrescriptionScans(sessionId?: string): Promise<PrescriptionScan[]> {
  try {
    let query = insforge.database
      .from('prescription_scans')
      .select('*')
      .order('created_at', { ascending: false });

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching prescription scans:', error);
      return [];
    }
    const rawList = (data as PrescriptionScan[]) || [];

    // 1. Filter out empty/corrupt records with no file reference or text
    const validList = rawList.filter((s) => s.file_url || s.file_key);

    // 2. Deduplicate records with the exact same clean filename, keeping the newest
    const seen = new Set<string>();
    const deduplicated: PrescriptionScan[] = [];
    for (const scan of validList) {
      const clean = cleanDocumentName(scan.file_key || scan.file_url).toLowerCase();
      if (!seen.has(clean)) {
        seen.add(clean);
        deduplicated.push(scan);
      }
    }

    return deduplicated;
  } catch (err) {
    console.error('fetchPatientPrescriptionScans exception:', err);
    return [];
  }
}

/**
 * Delete a prescription scan record permanently from InsForge
 */
export async function deletePrescriptionScan(id: string): Promise<boolean> {
  try {
    const { error } = await insforge.database
      .from('prescription_scans')
      .delete()
      .eq('id', id);
    if (error) {
      console.warn('Error deleting prescription scan from InsForge:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('deletePrescriptionScan exception:', err);
    return false;
  }
}

/**
 * Save OCR scanned medications and allergies to database
 */
export async function savePrescriptionScan(params: {
  session_id: string;
  file_url?: string;
  prescribing_doctor?: string;
  diagnosis_found?: string;
  extracted_medications: any[];
  detected_allergies: string[];
  ocr_confidence?: number;
}): Promise<boolean> {
  try {
    const { error } = await insforge.database
      .from('prescription_scans')
      .insert([params]);

    return !error;
  } catch (err) {
    console.error('Failed to save prescription scan:', err);
    return false;
  }
}

// ── Auth Operations ─────────────────────────────────────────────────

export async function signInWithGoogle(redirectTo?: string) {
  const targetUrl = redirectTo || (typeof window !== 'undefined' ? window.location.href : '');
  return await insforge.auth.signInWithOAuth('google', {
    redirectTo: targetUrl,
    additionalParams: { prompt: 'select_account' },
  });
}

export async function signInWithEmail(email: string, pass: string) {
  return await insforge.auth.signInWithPassword({
    email,
    password: pass,
  });
}

export async function signUpWithEmail(email: string, pass: string, name?: string) {
  return await insforge.auth.signUp({
    email,
    password: pass,
    name,
  });
}

export async function signOutUser() {
  return await insforge.auth.signOut();
}

export async function getCurrentAuthUser() {
  return await insforge.auth.getCurrentUser();
}
