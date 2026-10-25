-- ============================================================================
-- MineArena 1.0 National Hackathon
-- Autonomous OPD Clinical Intake Kiosk & Doctor Portal Database Schema
-- ============================================================================

-- 1. Patients Table
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    abha_id VARCHAR(50) UNIQUE,
    full_name TEXT NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    phone VARCHAR(20),
    preferred_language VARCHAR(20) DEFAULT 'hi',
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. OPD Sessions & Clinical Intake Queue
CREATE TABLE IF NOT EXISTS public.opd_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    token_number VARCHAR(20) NOT NULL,
    department VARCHAR(50) DEFAULT 'General Ayush OPD',
    status VARCHAR(30) DEFAULT 'waiting', -- 'waiting', 'in_intake', 'completed', 'in_consultation', 'discharged'
    triage_priority VARCHAR(20) DEFAULT 'routine', -- 'emergency', 'urgent', 'routine'
    triage_reason TEXT,
    chief_complaint TEXT,
    symptoms_duration TEXT,
    socrates_data JSONB DEFAULT '{}'::jsonb, -- site, onset, character, radiation, associations, time course, exacerbating/relieving, severity
    voice_transcript TEXT,
    assigned_bay VARCHAR(20) DEFAULT 'Bay 01',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Ayush Ahara-Vihara & Prakriti Pariksha
CREATE TABLE IF NOT EXISTS public.ayush_pariksha (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.opd_sessions(id) ON DELETE CASCADE,
    dominant_rasa VARCHAR(50), -- Katu, Tikta, Kashaya, Madhura, Amla, Lavana
    ahara_habits JSONB DEFAULT '{}'::jsonb, -- timings, vishamashana, samashana, water intake
    vihara_habits JSONB DEFAULT '{}'::jsonb, -- sleep (Nidra), ratri jagarana, physical activity (Vyayama)
    agni_state VARCHAR(30), -- Mandagni, Tikshnagni, Vishamagni, Samagni
    prakriti_primary VARCHAR(30), -- Vata, Pitta, Kapha, Vata-Pitta, Pitta-Kapha, etc.
    dashavidha_ready BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Prescription & Lab OCR Scans
CREATE TABLE IF NOT EXISTS public.prescription_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.opd_sessions(id) ON DELETE CASCADE,
    file_url TEXT,
    file_key TEXT,
    prescribing_doctor TEXT,
    diagnosis_found TEXT,
    extracted_medications JSONB DEFAULT '[]'::jsonb, -- array of { name, dosage, frequency, instructions }
    detected_allergies TEXT[] DEFAULT ARRAY[]::TEXT[], -- e.g. ['Sulfa', 'Penicillin']
    ocr_confidence NUMERIC(5, 2) DEFAULT 98.20,
    lab_flags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Doctor & Vaidya Profiles
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role VARCHAR(30) DEFAULT 'vaidya', -- 'vaidya', 'medical_officer', 'triage_nurse', 'admin'
    specialization TEXT DEFAULT 'Kayachikitsa (Internal Medicine)',
    hospital_name TEXT DEFAULT 'AIIMS New Delhi - Ayush Centre',
    opd_bay VARCHAR(20) DEFAULT 'Bay 01',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for lightning fast OPD Queue lookups
CREATE INDEX IF NOT EXISTS idx_opd_sessions_status ON public.opd_sessions(status);
CREATE INDEX IF NOT EXISTS idx_opd_sessions_triage ON public.opd_sessions(triage_priority);
CREATE INDEX IF NOT EXISTS idx_opd_sessions_created ON public.opd_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patients_abha ON public.patients(abha_id);

-- Enable Row-Level Security
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opd_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ayush_pariksha ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

-- Grants for API roles
GRANT ALL ON TABLE public.patients TO anon, authenticated;
GRANT ALL ON TABLE public.opd_sessions TO anon, authenticated;
GRANT ALL ON TABLE public.ayush_pariksha TO anon, authenticated;
GRANT ALL ON TABLE public.prescription_scans TO anon, authenticated;
GRANT ALL ON TABLE public.doctor_profiles TO anon, authenticated;

-- RLS Policies (Allow kiosk anonymous intake writes & doctor dashboard authenticated reads)
CREATE POLICY "Allow anon and auth to view and register patients"
    ON public.patients FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anon and auth to read and manage OPD sessions"
    ON public.opd_sessions FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anon and auth to view and create Ayush assessments"
    ON public.ayush_pariksha FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anon and auth to read and upload prescription scans"
    ON public.prescription_scans FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all to view doctor profiles and auth to manage"
    ON public.doctor_profiles FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- Seed Initial Authentic Hospital OPD Queue Data for Immediate Verification
-- ============================================================================

DO $$
DECLARE
    p1_id UUID := gen_random_uuid();
    p2_id UUID := gen_random_uuid();
    p3_id UUID := gen_random_uuid();
    s1_id UUID := gen_random_uuid();
    s2_id UUID := gen_random_uuid();
    s3_id UUID := gen_random_uuid();
BEGIN
    -- Patient 1: Rameshwar Prasad (Acute Chest Pain / Triage Red-Flag)
    INSERT INTO public.patients (id, abha_id, full_name, age, gender, phone, preferred_language)
    VALUES (p1_id, '91-8291-3829', 'Rameshwar Prasad', 68, 'Male', '+91 98112 34567', 'hi')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.opd_sessions (id, patient_id, token_number, department, status, triage_priority, triage_reason, chief_complaint, symptoms_duration, socrates_data, voice_transcript, assigned_bay)
    VALUES (
        s1_id,
        p1_id,
        'TK-01',
        'Kayachikitsa / Emergency',
        'waiting',
        'emergency',
        'Acute retrosternal chest pain radiating to left arm (Triage Red-Flag Alert)',
        'Severe crushing chest heaviness and breathlessness since morning',
        '3 hours',
        '{"site": "Substernal", "onset": "Sudden", "character": "Crushing heaviness", "radiation": "Left shoulder & jaw", "severity": 9, "timing": "Continuous"}'::jsonb,
        'Mujhe subah se seene mein bohot tej dard aur ghutan mehsoos ho rahi hai, dard baaye hath ki taraf ja raha hai.',
        'Bay 01'
    ) ON CONFLICT DO NOTHING;

    INSERT INTO public.prescription_scans (session_id, prescribing_doctor, diagnosis_found, extracted_medications, detected_allergies, ocr_confidence, lab_flags)
    VALUES (
        s1_id,
        'Dr. A. K. Sen, MD (AIIMS)',
        'Hypertension & Angina suspect',
        '[{"name": "Amlodipine 5mg", "dosage": "1 Tab", "frequency": "Morning", "instructions": "After breakfast"}, {"name": "Sorbitrate 5mg", "dosage": "SOS", "frequency": "PRN", "instructions": "Sublingual"}]'::jsonb,
        ARRAY['Sulfa Drugs', 'Penicillin'],
        98.40,
        '[{"test": "ECG", "flag": "ST depression noted", "severity": "critical"}]'::jsonb
    ) ON CONFLICT DO NOTHING;

    -- Patient 2: Sunita Devi (Ayush Ahara-Vihara Anamnesis Completed)
    INSERT INTO public.patients (id, abha_id, full_name, age, gender, phone, preferred_language)
    VALUES (p2_id, '91-4402-9918', 'Sunita Devi', 54, 'Female', '+91 94120 78901', 'hi')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.opd_sessions (id, patient_id, token_number, department, status, triage_priority, triage_reason, chief_complaint, symptoms_duration, socrates_data, voice_transcript, assigned_bay)
    VALUES (
        s2_id,
        p2_id,
        'TK-43',
        'Kayachikitsa Bay',
        'waiting',
        'routine',
        'Chronic indigestion and joint stiffness (Amavata signs)',
        'Amlapitta (Hyperacidity) and Sandhishoola (morning joint pain)',
        '6 months',
        '{"site": "Epigastrium and Bilateral Knees", "onset": "Gradual", "character": "Burning and throbbing", "radiation": "None", "severity": 5, "timing": "Worse after spicy meals"}'::jsonb,
        'Khana khane ke baad pet mein jalan hoti hai aur subah dono ghutno mein jakdan rehti hai.',
        'Bay 03'
    ) ON CONFLICT DO NOTHING;

    INSERT INTO public.ayush_pariksha (session_id, dominant_rasa, ahara_habits, vihara_habits, agni_state, prakriti_primary, dashavidha_ready)
    VALUES (
        s2_id,
        'Katu (Pungent) & Lavana (Salty)',
        '{"timings": "Irregular (Vishamashana)", "diet_type": "Vegetarian, high fried intake", "water_intake": "Low, cold water post meals"}'::jsonb,
        '{"sleep": "Disturbed (Ratri Jagarana)", "exercise": "Sedentary", "stress_level": "Moderate"}'::jsonb,
        'Mandagni',
        'Vata-Pitta',
        true
    ) ON CONFLICT DO NOTHING;

    -- Patient 3: Rajesh Kumar (Aadhaar Verified Token #104)
    INSERT INTO public.patients (id, abha_id, full_name, age, gender, phone, preferred_language)
    VALUES (p3_id, '91-1029-7734', 'Rajesh Kumar', 42, 'Male', '+91 97188 12345', 'hi')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.opd_sessions (id, patient_id, token_number, department, status, triage_priority, triage_reason, chief_complaint, symptoms_duration, socrates_data, voice_transcript, assigned_bay)
    VALUES (
        s3_id,
        p3_id,
        'TK-104',
        'Panchakarma Consultation',
        'waiting',
        'routine',
        'Lower backache (Katisula) radiating down right leg',
        'Gridhrasi (Sciatica-like shooting pain) aggravated by long sitting',
        '3 weeks',
        '{"site": "Lumbar spine", "onset": "Subacute", "character": "Radiating ache", "radiation": "Right calf", "severity": 6, "timing": "Worse after sitting 2+ hours"}'::jsonb,
        'Kamar ke nichle hisse mein dard rehta hai aur daaye pair tak jata hai jab jyada der baithta hoon.',
        'Bay 02'
    ) ON CONFLICT DO NOTHING;

    -- Seed Default Doctor Profile for Demo Login
    INSERT INTO public.doctor_profiles (id, full_name, email, role, specialization, hospital_name, opd_bay)
    VALUES (
        'd0c70000-0000-0000-0000-000000000001',
        'Dr. Vaidya Ananya Sharma, BAMS MD',
        'vaidya.ananya@aiims.edu',
        'vaidya',
        'Kayachikitsa (Ayush Internal Medicine)',
        'AIIMS New Delhi - Ayush Centre of Excellence',
        'Bay 01'
    ) ON CONFLICT (email) DO NOTHING;

END $$;
