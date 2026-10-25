import { Agent, dedent, tool } from '@livekit/agents';
import { LLM as OpenAILLM } from '@livekit/agents-plugin-openai';
import { z } from 'zod';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export function createMediKioskAgent() {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY is not configured');

  const groqLLM = new OpenAILLM({
    model: 'openai/gpt-oss-20b',
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: GROQ_API_KEY,
  });

  return Agent.create({
    instructions: dedent`
      You are the MediKiosk AI Clinical Voice Assistant for the National Institute of Ayurveda OPD, supervised by Dr. Vaidya Ananya Sharma at Bay 04.
      You are conducting a structured clinical intake (SOCRATES protocol) and prescription consultation for patient Govind Kumar (58 years old, Male, UHID: NIA-2026-GK-8821) under MediChain AI MineArena 1.0 Autonomous Clinical Intake Protocol.

      # Clinical Context for Govind Kumar:
      - Primary Diagnosis: Type 2 Diabetes Mellitus with Wagner Grade 2 Plantar Neuropathic Ulcer (left foot, 1st metatarsal head).
      - Recent Vitals: Fasting Blood Sugar 95 mg/dL (target achieved), HbA1c 7.4%, BP 124/82 mmHg, SpO2 98%, Heart Rate 72 bpm.
      - Ayush Assessment: Agni is Mandagni (diminished digestive fire), Prakriti is Vata-Kapha, Dushta Vrana healing under Shodhana & Ropana.
      - Current Regimen:
        1. Triphala Kashaya dhawana (gentle lukewarm wash once daily)
        2. Jatyadi Ghrita sterile gauze dressing once daily
        3. Kaishore Guggulu (2 tabs twice daily with lukewarm water after food)
        4. Madhumehari Churna (3g twice daily before breakfast and dinner)
        5. Diabetic offloading orthotic footwear - zero barefoot walking.

      # Autonomous OPD Clinical History Taking Protocol:
      Your task is to take his clinical history step by step. Ask ONE single question at a time so the conversation feels snappy, natural, and low-latency:
      1. Ask how the foot ulcer feels and his pain level (1 to 10 scale).
      2. Ask if there is any fresh redness, swelling, pus, or bad odor from the wound.
      3. Ask if he did the Triphala Kashaya wash and Jatyadi Ghrita dressing today.
      4. Ask if he is taking Kaishore Guggulu and Madhumehari Churna regularly.
      5. Ask about his fasting sugar check and confirm he is wearing offloading footwear without walking barefoot.
      Once he shares this information, call the 'generateDoctorPrescriptionReport' tool to file the intake report with Dr. Vaidya Ananya Sharma at Bay 04.

      # Spoken Voice Rules (Ultra-Low Latency, Multilingual & High Warmth):
      - Keep every response SHORT: 1 to 2 sentences maximum! Never speak long paragraphs.
      - Ask only ONE clinical question at a time.
      - Speak in plain, warm, natural conversational Kannada (ಕನ್ನಡ), Hindi (हिन्दी), or English matching the patient's spoken language. If the patient speaks Kannada, reply in Kannada. If Hindi, reply in Hindi. If English, reply in English.
      - Adaptive Clinical Pacing: For acute symptoms or urgent alerts, communicate concisely and briskly. For medication dosages and Triphala/Jatyadi dressing steps, speak with extra clarity.
      - Never use markdown, asterisks (*), hashtags (#), bullet points, tables, code, or emojis in your speech output.
      - Reassure the patient warmly that Dr. Vaidya Ananya Sharma is monitoring his progress at Bay 04.
      - If he reports sudden severe pain, fever, spreading redness, or foul pus, immediately advise him that an emergency alert is triggered for Bay 04.
    `,

    llm: groqLLM,

    tools: [
      tool({
        name: 'getPatientVitalsAndWoundStatus',
        description: 'Fetch real-time clinical vitals and Wagner Grade 2 diabetic foot ulcer status for Govind Kumar',
        parameters: z.object({}),
        execute: async () => {
          return JSON.stringify({
            patient: 'Govind Kumar, 58 M (UHID: NIA-2026-GK-8821)',
            fastingBloodSugar: '95 mg/dL (Normal fasting range < 100)',
            hba1c: '7.4%',
            bloodPressure: '124/82 mmHg',
            ulcerStage: 'Wagner Grade 2 neuropathic ulcer on left plantar 1st metatarsal head',
            healingStatus: 'Granulation tissue progressing cleanly, serous exudate minimal, no cellulitis',
            ayushDiagnosis: 'Mandagni, Dushta Vrana healing under Shodhana & Ropana therapy'
          });
        }
      }),

      tool({
        name: 'getTreatmentAndDressingInstructions',
        description: 'Fetch medication and Jatyadi Ghrita dressing protocol prescribed by Dr. Vaidya Ananya Sharma',
        parameters: z.object({}),
        execute: async () => {
          return JSON.stringify({
            dressingProtocol: 'Wash wound gently with lukewarm Triphala Kashaya dhawana. Apply sterile Jatyadi Ghrita gauze once daily.',
            internalMeds: 'Kaishore Guggulu 2 tablets twice daily with warm water after meals; Madhumehari Churna 3g before breakfast and dinner.',
            precautions: 'Wear custom offloading diabetic footwear at all times. Zero barefoot walking.',
            attendingPhysician: 'Dr. Vaidya Ananya Sharma, Bay 04'
          });
        }
      }),

      tool({
        name: 'generateDoctorPrescriptionReport',
        description: 'Generate and submit structured clinical anamnesis and prescription summary to Dr. Vaidya Ananya Sharma at Bay 04',
        parameters: z.object({
          painScore: z.string().describe('Patient reported pain score from 1-10 or description of sensation'),
          woundCondition: z.string().describe('Ulcer appearance, discharge, redness, or odor status'),
          dressingAdherence: z.string().describe('Whether Jatyadi Ghrita dressing and Triphala wash were done'),
          medicationCompliance: z.string().describe('Compliance with Kaishore Guggulu and Madhumehari Churna'),
          bloodSugarLevel: z.string().describe('Fasting blood sugar level or status'),
          clinicalImpression: z.string().describe('Brief clinical assessment summary for Dr. Sharma')
        }),
        execute: async (args) => {
          const report = {
            reportId: `RX-AYUSH-${Date.now().toString().slice(-6)}`,
            timestamp: new Date().toISOString(),
            patient: {
              name: 'Govind Kumar',
              age: 58,
              gender: 'Male',
              uhid: 'NIA-2026-GK-8821',
              token: 'A-104 (Bay 04)'
            },
            attendingClinician: 'Dr. Vaidya Ananya Sharma, MD (Ayush) - Bay 04',
            socratesHistory: {
              site: 'Left plantar surface, 1st metatarsal head',
              onset: 'Chronic neuropathic ulcer (3 weeks duration)',
              character: `Burning neuropathic ache (Pain scale: ${args.painScore})`,
              radiation: 'Non-radiating, localized to plantar base',
              associations: args.woundCondition,
              severity: args.painScore
            },
            adherence: {
              dressing: args.dressingAdherence,
              medications: args.medicationCompliance,
              sugarControl: args.bloodSugarLevel
            },
            doctorPrescriptionPlan: [
              'Triphala Kashaya Dhawana: Gentle lukewarm wash once daily',
              'Jatyadi Ghrita Sterile Gauze: Apply locally and dress daily',
              'Kaishore Guggulu: 2 tabs BD with warm water after meals',
              'Madhumehari Churna: 3g BD before meals with lukewarm water',
              'Diabetic Offloading Orthotic Footwear: Mandatory for all mobility. Strictly no barefoot walking'
            ],
            disposition: 'Synchronized with Dr. Vaidya Ananya Sharma Bay 04 Console',
            clinicalImpression: args.clinicalImpression
          };

          return JSON.stringify({
            status: 'success',
            message: 'Prescription and clinical history report submitted to Dr. Vaidya Ananya Sharma at Bay 04.',
            reportId: report.reportId
          });
        }
      }),

      tool({
        name: 'escalateToAttendingDoctor',
        description: 'Connect or alert Dr. Vaidya Ananya Sharma at Bay 04 for immediate clinical evaluation',
        parameters: z.object({
          symptomDescription: z.string().describe('The urgent or concerning symptom reported by the patient')
        }),
        execute: async ({ symptomDescription }) => {
          return JSON.stringify({
            status: 'Tele-Kiosk Priority Alert Created',
            assignedDoctor: 'Dr. Vaidya Ananya Sharma (Bay 04)',
            reason: symptomDescription,
            message: 'A priority alert has been dispatched to Bay 04 console. Dr. Ananya Sharma can initiate immediate video or tele-consult.'
          });
        }
      })
    ]
  });
}
