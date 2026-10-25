import { ServerOptions, cli, defineAgent, voice } from '@livekit/agents';
import * as sarvam from '@livekit/agents-plugin-sarvam';
import * as silero from '@livekit/agents-plugin-silero';
import { LLM as OpenAILLM } from '@livekit/agents-plugin-openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { createMediKioskAgent } from './agent.ts';

// Load credentials
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const sarvamApiKey = process.env.SARVAM_API_KEY;
const groqApiKey = process.env.GROQ_API_KEY;

if (!sarvamApiKey) throw new Error('SARVAM_API_KEY is not configured');
if (!groqApiKey) throw new Error('GROQ_API_KEY is not configured');

export default defineAgent({
  entry: async (ctx) => {
    // 1. Voice Activity Detector with noise-resilient activation threshold & padding
    const vad = await silero.VAD.load({
      activationThreshold: 0.6, // Prevents steady ambient noise from falsely sustaining speech
      minSilenceDuration: 450,  // Milliseconds of silence to close speech chunk
      prefixPaddingDuration: 300,
    });

    // 2. Clinical reasoning LLM (Groq GPT-OSS 20B)
    const groqLLM = new OpenAILLM({
      model: 'openai/gpt-oss-20b',
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: groqApiKey,
    });

    // 3. Configure voice session with Sarvam STT (saaras:v3) and TTS (bulbul:v3)
    const session = new voice.AgentSession({
      // Speech to Text: Sarvam Saaras v3 with multilingual Indic auto-detection
      stt: new sarvam.STT({
        apiKey: sarvamApiKey,
        model: 'saaras:v3',
        languageCode: 'unknown',
      }),

      // Text to Speech: Sarvam Bulbul v3 with natural expressive Indic female voice (kavya)
      tts: new sarvam.TTS({
        apiKey: sarvamApiKey,
        model: 'bulbul:v3',
        speaker: 'kavya',
        pace: 1.15,
      }),

      // LLM Reasoning: Groq GPT-OSS 20B
      llm: groqLLM,

      // Voice Activity Detection
      vad: vad,

      turnHandling: {
        interruption: { mode: 'adaptive' },
        preemptiveGeneration: { enabled: true },
        endpointing: {
          minDelay: 500,  // Milliseconds: wait 500ms of silence before declaring turn complete
          maxDelay: 2500, // Milliseconds: maximum wait ceiling
        },
      },
    });

    // Start voice session with MediKiosk Ayush OPD Agent
    await session.start({
      agent: createMediKioskAgent(),
      room: ctx.room,
    });

    // Connect to LiveKit Room
    await ctx.connect();

    // Initial warm greeting in spoken Hindi/Hinglish (instant synthesis without waiting for LLM generation)
    session.say(
      'Namaste Govind ji! Main Dr. Vaidya Ananya Sharma ke OPD se MediKiosk AI clinical assistant hoon. Aapke pair ke ghav aur dawaiyon ka status lene ke liye call kiya hai. Abhi aapke pair ke ghav mein dard kaisa hai?',
      { allowInterruptions: true }
    );
  },
});

// Run LiveKit Agent CLI only when executed as the main entrypoint
const isMain = process.argv[1] && (
  process.argv[1] === fileURLToPath(import.meta.url) ||
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))
);

if (isMain) {
  cli.runApp(
    new ServerOptions({
      agent: fileURLToPath(import.meta.url),
      agentName: 'medikiosk-voice-agent',
      wsURL: process.env.LIVEKIT_URL,
      apiKey: process.env.LIVEKIT_API_KEY,
      apiSecret: process.env.LIVEKIT_API_SECRET,
      numIdleProcesses: 1,
      initializeProcessTimeout: 60 * 1000,
    }),
  );
}


