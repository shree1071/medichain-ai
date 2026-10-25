// Groq Fast LLM Adaptive Quiz & Instant Clinical Summary Engine
// Powered by Groq ultra-low latency inference (openai/gpt-oss-20b)

export interface AdaptiveOption {
  id: string;
  label: string;
  description?: string;
  isRedFlag?: boolean;
}

export interface AdaptiveQuestion {
  id: string;
  category: string;
  question: string;
  subtitle: string;
  options: AdaptiveOption[];
}

export interface AnswerRecord {
  step: number;
  questionId: string;
  question: string;
  answer: string;
  category?: string;
  isRedFlag?: boolean;
}

export interface InstantClinicalSummary {
  chiefComplaint: string;
  hpiSummary: string;
  ayushDoshaAnalysis: string;
  estimatedSeverity: string;
  triagePriority: 'emergency' | 'urgent' | 'routine';
  redFlags: string[];
  keyRecommendations: string[];
  doctorHandoverNote: string;
}

const PRIMARY_MODEL = 'openai/gpt-oss-20b';

// Helper: Call the local Groq proxy so the provider key never reaches the browser.
async function callGroqChat(messages: Array<{ role: string; content: string }>, model = PRIMARY_MODEL): Promise<any> {
  const res = await fetch('/api/groq-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      jsonMode: true,
      model,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Groq API error (${res.status})`);
  }

  const data = await res.json();
  if (!data.result) throw new Error('Groq returned an empty JSON response');
  return data.result;
}

/**
 * Real-time Adaptive Clinical Question Generator
 * Evaluates patient answers so far and constructs the exact next probe
 */
export async function generateAdaptiveQuestion(
  history: AnswerRecord[],
  language = 'en',
  currentStep = 1,
  patientName = 'Govind Narain'
): Promise<AdaptiveQuestion> {
  const langPrompt =
    language === 'mr'
      ? 'Marathi with Devanagari script and English in brackets'
      : language === 'hi'
      ? 'Hindi with Devanagari script and English in brackets'
      : language === 'ta'
      ? 'Tamil with English in brackets'
      : 'English with concise Hindi translation in brackets';

  const systemPrompt = `You are an expert Autonomous OPD Clinical Triage AI at Ayush Hospital Bay 04.
Your goal is to conduct an adaptive, highly relevant clinical anamnesis for patient ${patientName}.
Follow the classical clinical SOCRATES and AYUSH Dashavidha Pariksha principles:
- Step 2: Precise anatomical site, duration, and disease progression
- Step 3: Exacerbating factors, infection indicators, and red-flags
- Step 4: AYUSH Ahara (dietary tastes, Agni digestion power, bowel Koshtha) & Vihara (sleep, physical strain)
- Step 5: Prior medications, glycemic/BP history, and functional daily limitation

Based strictly on what the patient answered previously (including any custom voice-typed or typed symptoms), generate the SINGLE most clinically relevant NEXT question.
Do NOT repeat questions or ask generic unrelated questions. If the patient has a foot ulcer, focus on the wound, depth, discharge, sensation, and glycemic control. If they have acidity, focus on burning, nocturnal reflux, Ahara, and sour burps.

Output MUST be a JSON object with this exact schema:
{
  "id": string (unique slug, e.g. "wound_infection_status"),
  "category": string (e.g. "Wound & Sensation Probe", "Infection Risk", "Ahara & Agni Pariksha"),
  "question": string (Clear question in ${langPrompt}),
  "subtitle": string (Clinical guideline for patient),
  "options": [
    {
      "id": string,
      "label": string (Patient choice text in ${langPrompt}),
      "description": string (Clinical significance or detail),
      "isRedFlag": boolean (true if acute emergency risk like severe infection, gangrene, radiating chest pain, blackout)
    }
  ]
}
Always provide exactly 4 clear, distinct, touch-friendly multiple-choice options.`;

  const userContent = `Patient Answers Collected So Far:
${JSON.stringify(history, null, 2)}

Current Anamnesis Step: ${currentStep + 1}
Generate the next adaptive clinical question for this specific case.`;

  try {
    const parsed = await callGroqChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ]);

    if (parsed && parsed.question && Array.isArray(parsed.options) && parsed.options.length > 0) {
      return {
        id: parsed.id || `adaptive_step_${currentStep + 1}`,
        category: parsed.category || 'Adaptive Clinical Probe',
        question: parsed.question,
        subtitle: parsed.subtitle || 'Touch the option that best matches or type/speak your response.',
        options: parsed.options.map((opt: any, idx: number) => ({
          id: opt.id || `opt_${idx + 1}`,
          label: opt.label || `Option ${idx + 1}`,
          description: opt.description || '',
          isRedFlag: Boolean(opt.isRedFlag)
        }))
      };
    }
    throw new Error('Invalid JSON structure from Groq');
  } catch (err) {
    console.warn('Groq adaptive generation fallback:', err);
    return getCuratedFallbackQuestion(history, currentStep, language);
  }
}

/**
 * Real-time Instant Clinical Summary Generator
 * Synthesizes all elicited answers into a complete doctor-ready clinical dossier
 */
export async function generateInstantClinicalSummary(
  history: AnswerRecord[],
  language = 'en',
  patientName = 'Govind Narain'
): Promise<InstantClinicalSummary> {
  const systemPrompt = `You are an Ayush & Allopathic Chief Medical Officer.
Analyze the clinical anamnesis history of patient ${patientName} and generate an INSTANT CLINICAL SUMMARY.
Synthesize the chief complaint, SOCRATES narrative, AYUSH Dosha analysis (Vata, Pitta, Kapha, Agni, Dhatu), estimated severity, triage priority (emergency, urgent, or routine), detected red-flags, key clinical recommendations, and a professional SOAP handover note for the OPD attending doctor.

Output MUST be a JSON object with this exact schema:
{
  "chiefComplaint": string (Concise clinical diagnosis / symptom summary),
  "hpiSummary": string (Comprehensive 2-3 paragraph SOCRATES clinical progression),
  "ayushDoshaAnalysis": string (Detailed Tri-dosha, Agni, and Ahara-Vihara correlation),
  "estimatedSeverity": string (e.g. "Moderate (Wagner Grade 2 equivalent)", "High Acute Severity"),
  "triagePriority": "emergency" | "urgent" | "routine",
  "redFlags": string[] (List of critical danger signs, or empty array if none),
  "keyRecommendations": string[] (Actionable clinical investigations, dressings, bio-washes, diet),
  "doctorHandoverNote": string (Concise pre-consultation SOAP handover note)
}`;

  const userContent = `Patient Answers:
${JSON.stringify(history, null, 2)}
Preferred Language: ${language}`;

  try {
    const parsed = await callGroqChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ]);

    if (parsed && parsed.chiefComplaint && parsed.hpiSummary) {
      return {
        chiefComplaint: parsed.chiefComplaint,
        hpiSummary: parsed.hpiSummary,
        ayushDoshaAnalysis: parsed.ayushDoshaAnalysis || 'Vata-Pitta vitiation with Mandagni',
        estimatedSeverity: parsed.estimatedSeverity || 'Moderate',
        triagePriority: parsed.triagePriority || (history.some(h => h.isRedFlag) ? 'urgent' : 'routine'),
        redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
        keyRecommendations: Array.isArray(parsed.keyRecommendations) ? parsed.keyRecommendations : [],
        doctorHandoverNote: parsed.doctorHandoverNote || 'Patient intake completed. Awaiting physician examination.'
      };
    }
    throw new Error('Invalid JSON structure for summary');
  } catch (err) {
    console.warn('Groq instant summary fallback:', err);
    return getFallbackInstantSummary(history, patientName);
  }
}

// Curated fallbacks if network is offline
function getCuratedFallbackQuestion(history: AnswerRecord[], step: number, language: string): AdaptiveQuestion {
  const isHindi = language === 'hi';
  const isMarathi = language === 'mr';
  const firstAns = (history[0]?.answer || '').toLowerCase();

  if (firstAns.includes('ulcer') || firstAns.includes('foot') || firstAns.includes('wound') || firstAns.includes('घाव')) {
    if (step === 1) {
      return {
        id: 'ulcer_discharge_depth',
        category: 'Wound & Infection Assessment',
        question: isMarathi
          ? 'जखमेतून स्राव किंवा संसर्ग कसा आहे? (Wound Discharge & Odor)'
          : isHindi
          ? 'घाव से किस प्रकार का स्राव या बदबू आ रही है? (Wound Discharge)'
          : 'What type of discharge or infection signs are present in the wound?',
        subtitle: 'Assess ulcer base, pus, exudate, and surrounding cellulitis.',
        options: [
          {
            id: 'clear_dry',
            label: isMarathi ? 'स्वच्छ कोरडी जखम (Clear / Dry Base)' : 'Clear dry wound with minimal redness',
            description: 'Superficial ulceration, no foul odor',
            isRedFlag: false
          },
          {
            id: 'serous_mild',
            label: isMarathi ? 'हलका पिवळसर स्राव (Serous Fluid)' : 'Mild clear-yellow fluid, healing slowly',
            description: 'Early granulation tissue present',
            isRedFlag: false
          },
          {
            id: 'purulent_foul',
            label: isMarathi ? 'दुर्गंधीयुक्त पू व सूज (Pus with Odor)' : 'Purulent discharge with foul odor & heat',
            description: 'Signs of bacterial infection and deep tissue involvement',
            isRedFlag: true
          },
          {
            id: 'black_gangrene',
            label: isMarathi ? 'काळे पडणे व तीव्र वेदना (Black Necrotic Tissue)' : 'Black discolored tissue / numbness',
            description: 'Tissue necrosis, ischemia, urgent surgical evaluation',
            isRedFlag: true
          }
        ]
      };
    }
  }

  // Generic fallback adaptive step
  return {
    id: `fallback_step_${step + 1}`,
    category: 'Clinical Progression & Impact',
    question: isMarathi
      ? 'या समस्येमुळे दैनंदिन जीवनावर काय परिणाम होतो? (Daily Functional Impact)'
      : isHindi
      ? 'इस समस्या से आपकी दिनचर्या पर क्या असर पड़ रहा है? (Daily Impact)'
      : 'How is this symptom impacting your daily physical mobility and routine?',
    subtitle: 'Evaluate functional severity, sleep disturbance, and pain thresholds.',
    options: [
      {
        id: 'mild_impact',
        label: isMarathi ? 'हलका त्रास, सर्व कामे सहज (Mild Impact)' : 'Mild discomfort, able to perform all routine activities',
        description: 'Pain scale 1-3/10',
        isRedFlag: false
      },
      {
        id: 'moderate_impact',
        label: isMarathi ? 'मध्यम त्रास, चालताना वेदना (Moderate Limiting)' : 'Moderate restriction, pain during walking or working',
        description: 'Pain scale 4-6/10, requires frequent rests',
        isRedFlag: false
      },
      {
        id: 'severe_impact',
        label: isMarathi ? 'तीव्र त्रास, झोपमोड होते (Severe - Disturbs Sleep)' : 'Severe discomfort, unable to put weight / disturbs sleep',
        description: 'Pain scale 7-8/10, nocturnal distress',
        isRedFlag: false
      },
      {
        id: 'emergency_impact',
        label: isMarathi ? 'असह्य वेदना व चक्कर/ताप (Excruciating / Fever)' : 'Unbearable pain with spreading redness, chills or vertigo',
        description: 'Pain scale 9-10/10, immediate triage needed',
        isRedFlag: true
      }
    ]
  };
}

function getFallbackInstantSummary(history: AnswerRecord[], patientName: string): InstantClinicalSummary {
  const hasRedFlag = history.some(h => h.isRedFlag);
  const complaint = history[0]?.answer || 'General Clinical Consultation';

  return {
    chiefComplaint: complaint,
    hpiSummary: history.length
      ? `Patient ${patientName} reported: ${history.map(h => `${h.question}: ${h.answer}`).join('; ')}.`
      : 'No clinical history was captured.',
    ayushDoshaAnalysis: 'AI summary unavailable; clinician review required.',
    estimatedSeverity: hasRedFlag ? 'Red flag reported; clinician review required' : 'Not assessed',
    triagePriority: hasRedFlag ? 'urgent' : 'routine',
    redFlags: hasRedFlag ? ['Acute red-flag trigger flagged during anamnesis'] : [],
    keyRecommendations: [
      'Review the captured history with a clinician.',
      'Confirm vitals and medication details during the consultation.'
    ],
    doctorHandoverNote: `Pre-consultation intake captured for ${patientName}. Chief complaint: ${complaint}.`
  };
}
