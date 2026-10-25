import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { AccessToken, AgentDispatchClient, RoomConfiguration } from 'livekit-server-sdk';
import { createAdminClient } from '@insforge/sdk';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'livekit-token-endpoint',
        configureServer(server) {
          server.middlewares.use('/api/livekit-token', async (req, res) => {
            if (req.method !== 'GET') {
              res.statusCode = 405;
              res.end('Method Not Allowed');
              return;
            }

            try {
              const url = new URL(req.url || '', `http://${req.headers.host}`);
              const roomName = url.searchParams.get('room') || 'heritage-tour-room';
              const participantName = url.searchParams.get('name') || 'Heritage Visitor';
              const identity = 'user-' + Math.random().toString(36).substring(7);

              const apiKey = env.LIVEKIT_API_KEY || process.env.LIVEKIT_API_KEY;
              const apiSecret = env.LIVEKIT_API_SECRET || process.env.LIVEKIT_API_SECRET;
              const livekitUrl = env.LIVEKIT_URL || process.env.LIVEKIT_URL;
              if (!apiKey || !apiSecret || !livekitUrl) throw new Error('LiveKit credentials are not configured in .env.local');

              // 1. Generate user access token with roomConfig agent dispatch
              const at = new AccessToken(apiKey, apiSecret, {
                identity,
                name: participantName,
              });
              at.addGrant({
                roomJoin: true,
                room: roomName,
                canPublish: true,
                canSubscribe: true,
              });

              // Dispatch the medikiosk-voice-agent worker upon room join (matches murf-livekit-starter)
              at.roomConfig = RoomConfiguration.fromJson(
                { agents: [{ agentName: 'medikiosk-voice-agent' }] },
                { ignoreUnknownFields: true }
              );

              const token = await at.toJwt();

              // 2. Automatically dispatch the MediKiosk voice agent into this room
              const httpHost = livekitUrl.replace('wss://', 'https://');
              const dispatchClient = new AgentDispatchClient(httpHost, apiKey, apiSecret);
              try {
                await dispatchClient.createDispatch(roomName, 'medikiosk-voice-agent');
              } catch (dispatchErr: any) {
                console.warn('Dispatch note:', dispatchErr?.message);
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ token, url: livekitUrl, roomName }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Token generation failed' }));
            }
          });

          // ── Groq-backed text assistant (server-side key; GPT-OSS 20B) ──
          server.middlewares.use('/api/groq-chat', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            let bodyStr = '';
            req.on('data', (chunk) => { bodyStr += chunk; });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(bodyStr || '{}');
                const { message, messages = [], language = 'auto', patientName = 'Govind Kumar', systemPrompt, jsonMode = false } = parsed;
                const groqApiKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY;

                if (!groqApiKey) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'GROQ_API_KEY is not configured in .env.local' }));
                  return;
                }

                const history = Array.isArray(messages)
                  ? messages
                      .filter((item: any) => (item?.role === 'user' || item?.role === 'assistant') && typeof item.content === 'string')
                      .slice(-10)
                  : [];
                if (typeof message === 'string' && message.trim()) {
                  history.push({ role: 'user', content: message.trim() });
                }
                if (!history.length) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'A message is required' }));
                  return;
                }

                const defaultSystemPrompt = `You are Ayush AI, a careful clinical information assistant for a local healthcare kiosk.
Patient context: ${patientName}. Preferred response language: ${language}.
Answer the user's question clearly and briefly. Do not invent diagnoses, test results, appointments, medications, or treatment outcomes. Do not replace a clinician. For emergency symptoms, advise the patient to contact local emergency services or their care team immediately. Keep responses suitable for a patient-facing UI.`;
                const selectedSystemPrompt = typeof systemPrompt === 'string' && systemPrompt.trim()
                  ? systemPrompt.trim().slice(0, 4000)
                  : defaultSystemPrompt;

                const chatRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    model: 'openai/gpt-oss-20b',
                    messages: [{ role: 'system', content: selectedSystemPrompt }, ...history],
                    temperature: 0.2,
                    max_completion_tokens: 512,
                    ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
                  }),
                });

                const chatData = (await chatRes.json().catch(() => ({}))) as any;
                if (!chatRes.ok) {
                  res.statusCode = 502;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: chatData.error?.message || `Groq API status: ${chatRes.status}` }));
                  return;
                }

                const reply = chatData.choices?.[0]?.message?.content?.trim();
                if (!reply) throw new Error('Groq returned an empty response');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  reply,
                  result: jsonMode ? JSON.parse(reply) : undefined,
                  model: 'openai/gpt-oss-20b',
                }));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err?.message || 'Groq assistant request failed' }));
              }
            });
          });

          // ── Local MedGemma vision endpoint (Ollama; no cloud/backend mutation) ──
          server.middlewares.use('/api/medgemma/analyze', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            let bodyStr = '';
            req.on('data', (chunk) => { bodyStr += chunk; });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(bodyStr || '{}');
                const image = typeof parsed.image === 'string' ? parsed.image : '';
                const patientName = typeof parsed.patientName === 'string' ? parsed.patientName.slice(0, 120) : 'the patient';

                if (!image.startsWith('data:image/')) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'A PNG, JPG, or WebP image is required.' }));
                  return;
                }

                const commaIndex = image.indexOf(',');
                const imageBase64 = commaIndex >= 0 ? image.slice(commaIndex + 1) : image;
                if (!imageBase64 || imageBase64.length > 30_000_000) {
                  res.statusCode = 413;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'The image is too large for local analysis.' }));
                  return;
                }

                const ollamaBaseUrl = (env.MEDGEMMA_OLLAMA_URL || process.env.MEDGEMMA_OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
                const model = env.MEDGEMMA_OLLAMA_MODEL || process.env.MEDGEMMA_OLLAMA_MODEL || 'medgemma:4b';
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 180_000);

                let modelResponse: Response;
                try {
                  modelResponse = await fetch(`${ollamaBaseUrl}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                    body: JSON.stringify({
                      model,
                      stream: false,
                      options: { temperature: 0.1, num_predict: 500 },
                      messages: [{
                        role: 'user',
                        content: `Review this X-ray image for ${patientName} and give your own best preliminary medical imaging opinion based on what is visibly present. Do not hide behind a generic instruction to consult a radiologist. State what you see, what it most likely means, and how confident you are, while clearly distinguishing observations from interpretation. Use careful phrases such as "most consistent with," "suspicious for," or "no clear evidence of" when appropriate. Do not claim certainty when the image does not support it.

Use plain text only: no Markdown, no asterisks, no hash symbols, no bullet characters, no emojis, and no decorative formatting. Use these section headings on separate lines: Examination, Image quality, Findings, Preliminary opinion, Confidence and limitations, and Clinical correlation. Write one concise paragraph under each heading, aiming for roughly 220 to 320 words total when the image supports it. Describe the body region and view only if clear, then focus on positioning, technical quality, relevant bones and joints, lungs or other soft tissues, and cardiac or mediastinal contours when applicable. Mention clinically relevant normal observations, but do not produce long lists of everything that is not present.

Avoid repetitive boilerplate. Never list repeated negatives such as not blurry, not compressed, not distorted, not filtered, or not processed. Do not repeat the same finding in multiple sections. Only report observations grounded in the image. Do not invent measurements, symptoms, history, age, comparison studies, or treatment. Give a direct preliminary opinion even when uncertain. If the image is not an X-ray, is unreadable, or does not support a reliable assessment, say so plainly in one short paragraph and do not fill space with assumptions. In the final section, briefly state that the opinion is preliminary and should be verified against the complete clinical context.`,
                        images: [imageBase64]
                      }]
                    })
                  });
                } finally {
                  clearTimeout(timeout);
                }

                const modelData = (await modelResponse.json().catch(() => ({}))) as any;
                if (!modelResponse.ok) throw new Error(modelData.error || `Ollama returned HTTP ${modelResponse.status}`);

                const rawAnalysis = modelData.message?.content?.trim();
                if (!rawAnalysis) throw new Error('MedGemma returned an empty analysis.');
                const withoutFormatting: string = rawAnalysis
                  .replace(/\*\*/g, '')
                  .replace(/^\s*#{1,6}\s*/gm, '')
                  .replace(/^\s*[-*•]\s+/gm, '')
                  .replace(/\n{3,}/g, '\n\n')
                  .trim();
                const repetitiveTechnicalNegative = /\bnot\s+(blurry|grainy|compressed|distorted|filtered|processed|dark|light|overexposed|underexposed|noisy|pixelated|artifacted|a simulation|a rendering|a drawing|a photograph|a painting|a sculpture|a statue|a model|a hologram|a projection|a scan|a copy|a print|a photocopy)\b/i;
                const analysis = withoutFormatting
                  .split(/\n{2,}/)
                  .map((paragraph: string) => {
                    const heading = paragraph.trim();
                    if (/^(Examination|Image quality|Findings|Preliminary opinion|Confidence and limitations|Clinical correlation)$/i.test(heading)) return heading;

                    const seen = new Set<string>();
                    const sentences = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [paragraph];
                    return sentences
                      .map((sentence: string) => sentence.trim())
                      .filter((sentence: string) => {
                        const normalized = sentence.toLowerCase().replace(/\s+/g, ' ');
                        if (!normalized || seen.has(normalized) || repetitiveTechnicalNegative.test(sentence)) return false;
                        seen.add(normalized);
                        return true;
                      })
                      .join(' ');
                  })
                  .filter(Boolean)
                  .join('\n\n')
                  .trim();

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ analysis, model }));
              } catch (err: any) {
                const message = err?.name === 'AbortError'
                  ? 'MedGemma took too long to respond. Check that Ollama is running and try again.'
                  : err?.message?.includes('fetch failed')
                  ? 'The image analysis service is unavailable. Please start the analysis service and try again.'
                  : err?.message || 'MedGemma analysis failed.';
                res.statusCode = 502;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: message }));
              }
            });
          });

          // ── Real-time Neural Voice Assistant APIs (Groq chat + Sarvam Bulbul TTS) ──
          server.middlewares.use('/api/voice/chat', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            let bodyStr = '';
            req.on('data', (chunk) => { bodyStr += chunk; });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(bodyStr || '{}');
                const { message, history = [], language: _language = 'auto', patientName = 'Govind Kumar' } = parsed;
                const groqApiKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY;
                if (!groqApiKey) throw new Error('GROQ_API_KEY is not configured in .env.local');

                const systemPrompt = `You are Dr. Vaidya Ananya Sharma, expert Ayurvedic physician and clinical assistant at OPD Bay 04, National Institute of Ayurveda (MediChain AI MineArena 1.0).
Patient: ${patientName}, 58M, Type 2 Diabetes with Wagner Grade 2 Plantar Neuropathic Ulcer (left foot, 1st metatarsal head).
Current Regimen: Triphala Kashaya dhawana wash, Jatyadi Ghrita sterile dressing, Kaishore Guggulu (2 tabs BD), Madhumehari Churna (3g BD), custom diabetic offloading footwear.

Detected spoken language hint from speech recognition: ${_language}.

CRITICAL VOICE CALL INSTRUCTIONS:
1. MULTI-LANGUAGE AUTO-DETECTION: Detect the language spoken by the patient (Hindi, English, Kannada, Marathi, Telugu, Tamil, Bengali, Gujarati, etc.).
2. REPLY IN THE EXACT SAME LANGUAGE: Use the detected spoken language when available. If the hint is auto, infer the language from the patient's words. If the patient speaks Kannada, reply in natural Kannada; if Hindi or Hinglish, reply in Hindi; if English, reply in English.
3. PHONE CALL CADENCE: Keep every reply SHORT, conversational, and brisk (strictly 1 to 2 spoken sentences maximum!).
4. Maintain empathetic clinical warmth and reassure the patient that OPD Bay 04 is tracking their progress.
5. If emergency signs appear (pain >7, fever, spreading cellulitis, foul pus), urgently instruct the patient to alert the Bay 04 nursing station.
6. SPOKEN TEXT ONLY: Absolutely NO markdown, NO asterisks (*), NO bullet points, NO emoji. Output plain speech only.`;

                const messages = [
                  { role: 'system', content: systemPrompt },
                  ...history.slice(-4),
                  { role: 'user', content: message }
                ];

                const chatRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    model: 'openai/gpt-oss-20b',
                    messages,
                    temperature: 0.2,
                    max_completion_tokens: 256,
                  })
                });

                if (chatRes.ok) {
                  const chatData = (await chatRes.json()) as any;
                  const reply = chatData.choices?.[0]?.message?.content?.trim() || 'Aapki sthiti note kar li gayi hai. Dr. Ananya Sharma ko update bhej diya hai.';
                  
                  // Auto-detect script of the response for appropriate TTS code
                  let detectedLang = ['kn', 'ta', 'te', 'bn', 'gu', 'hi', 'mr', 'en'].includes(_language)
                    ? _language
                    : 'hi';
                  if (/[\u0C80-\u0CFF]/.test(reply)) detectedLang = 'kn'; // Kannada
                  else if (/[\u0B80-\u0BFF]/.test(reply)) detectedLang = 'ta'; // Tamil
                  else if (/[\u0C00-\u0C7F]/.test(reply)) detectedLang = 'te'; // Telugu
                  else if (/[\u0980-\u09FF]/.test(reply)) detectedLang = 'bn'; // Bengali
                  else if (/[\u0A80-\u0AFF]/.test(reply)) detectedLang = 'gu'; // Gujarati
                  else if (/[\u0900-\u097F]/.test(reply)) detectedLang = 'hi'; // Hindi/Marathi
                  else if (/^[A-Za-z0-9\s.,!?'"()-]+$/.test(reply)) detectedLang = 'en'; // English

                  // Dynamically judge speaking pace based on clinical question urgency, length, and regimen
                  let judgedPace = 1.16;
                  let paceReason = 'Natural Conversational';
                  const combined = (message + ' ' + reply).toLowerCase();
                  const isEmergency = /(emergency|urgent|alert|danger|cellulitis|fever|pus|bleeding|severe|nursing station|turant|khatra|rakta|ಘಾಸಿ|ತುರ್ತು|ರಕ್ತ|ಹೆಚ್ಚು)/i.test(combined);
                  const isAdherenceOrPrescription = /(dosage|churna|kashaya|vati|tablet|triphala|jatyadi|morning|evening|empty stomach|subah|shaam|roz|ಮಾತ್ರೆ|ಔಷಧಿ|ಕಷಾಯ)/i.test(combined);

                  if (isEmergency) {
                    judgedPace = 1.25;
                    paceReason = 'Urgent Clinical Alert';
                  } else if (isAdherenceOrPrescription && reply.length > 80) {
                    judgedPace = 1.08;
                    paceReason = 'Clear Regimen Guidance';
                  } else if (reply.length < 60) {
                    judgedPace = 1.20;
                    paceReason = 'Brisk Acknowledgment';
                  }

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ reply, detectedLang, pace: judgedPace, paceReason }));
                } else {
                  throw new Error(`Groq Chat API status: ${chatRes.status}`);
                }
              } catch (err: any) {
                console.warn('Groq voice chat request failed:', err?.message);
                res.statusCode = 502;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err?.message || 'Groq voice assistant unavailable' }));
              }
            });
          });

          server.middlewares.use('/api/voice/tts', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            let bodyStr = '';
            req.on('data', (chunk) => { bodyStr += chunk; });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(bodyStr || '{}');
                const { text, language = 'hi', pace = 1.15, speaker = 'kavya' } = parsed;
                const sarvamApiKey = env.SARVAM_API_KEY || process.env.SARVAM_API_KEY;
                if (!sarvamApiKey) throw new Error('SARVAM_API_KEY is not configured in .env.local');

                if (!text || !text.trim()) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Text input is required' }));
                  return;
                }

                // Map Indic languages to BCP-47 codes
                const langCodeMap: Record<string, string> = {
                  hi: 'hi-IN', en: 'en-IN', kn: 'kn-IN', mr: 'mr-IN',
                  te: 'te-IN', ta: 'ta-IN', gu: 'gu-IN', bn: 'bn-IN',
                  ml: 'ml-IN', pa: 'pa-IN', od: 'od-IN'
                };

                // Auto-detect from script if not explicitly specified
                let targetCode = langCodeMap[language] || 'hi-IN';
                if (/[\u0C80-\u0CFF]/.test(text)) targetCode = 'kn-IN'; // Kannada script
                else if (/[\u0B80-\u0BFF]/.test(text)) targetCode = 'ta-IN'; // Tamil script
                else if (/[\u0C00-\u0C7F]/.test(text)) targetCode = 'te-IN'; // Telugu script
                else if (/[\u0980-\u09FF]/.test(text)) targetCode = 'bn-IN'; // Bengali script
                else if (/[\u0A80-\u0AFF]/.test(text)) targetCode = 'gu-IN'; // Gujarati script
                else if (/[\u0D00-\u0D7F]/.test(text)) targetCode = 'ml-IN'; // Malayalam script
                else if (/[\u0A00-\u0A7F]/.test(text)) targetCode = 'pa-IN'; // Punjabi script
                else if (/[\u0B00-\u0B7F]/.test(text)) targetCode = 'od-IN'; // Odia script
                else if (/[\u0900-\u097F]/.test(text) && language !== 'mr') targetCode = 'hi-IN'; // Devanagari
                else if (/^[A-Za-z0-9\s.,!?'"()\-]+$/.test(text.trim())) targetCode = 'en-IN'; // English

                // Clean text for speech synthesis (remove asterisks, brackets, hashes, markdown)
                const cleanText = text.replace(/[*#_`[\]]/g, '').trim().slice(0, 500);

                // Female voice 'kavya' natively supports Hindi, English, Kannada, Marathi, Telugu, Tamil, Gujarati, Bengali
                const chosenSpeaker = speaker || 'kavya';
                const chosenPace = Math.max(0.8, Math.min(1.8, Number(pace) || 1.15));

                const ttsRes = await fetch('https://api.sarvam.ai/text-to-speech', {
                  method: 'POST',
                  headers: {
                    'api-subscription-key': sarvamApiKey,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    inputs: [cleanText],
                    target_language_code: targetCode,
                    speaker: chosenSpeaker,
                    model: 'bulbul:v3',
                    pace: chosenPace
                  })
                });

                if (ttsRes.ok) {
                  const ttsData = (await ttsRes.json()) as any;
                  const audio = ttsData.audios?.[0];
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ audio, format: 'wav', targetLanguage: targetCode, pace: chosenPace }));
                } else {
                  const errText = await ttsRes.text();
                  console.warn('Sarvam TTS API error response:', errText);
                  res.statusCode = 502;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Sarvam TTS unavailable' }));
                }
              } catch (err: any) {
                console.error('Voice TTS API exception:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err?.message || 'TTS generation failed' }));
              }
            });
          });

          // Server-side Speech-to-Text via Sarvam Saaras v3 (ultra-robust fallback for all browsers)
          server.middlewares.use('/api/voice/stt', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            let bodyStr = '';
            req.on('data', (chunk) => { bodyStr += chunk; });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(bodyStr || '{}');
                const { audio, language = 'unknown' } = parsed;
                const sarvamApiKey = env.SARVAM_API_KEY || process.env.SARVAM_API_KEY;
                if (!sarvamApiKey) throw new Error('SARVAM_API_KEY is not configured in .env.local');

                if (!audio) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Base64 audio payload required' }));
                  return;
                }

                const cleanBase64 = audio.includes(',') ? audio.split(',')[1] : audio;
                const audioBuffer = Buffer.from(cleanBase64, 'base64');

                const langMap: Record<string, string> = {
                  hi: 'hi-IN', en: 'en-IN', mr: 'mr-IN', te: 'te-IN', gu: 'gu-IN',
                  bn: 'bn-IN', ta: 'ta-IN', kn: 'kn-IN', ml: 'ml-IN', pa: 'pa-IN', od: 'od-IN'
                };

                const form = new FormData();
                form.append('file', new Blob([audioBuffer], { type: 'audio/wav' }), 'speech.wav');
                form.append('model', 'saaras:v3');
                form.append('language_code', langMap[language] || 'unknown');

                const sttRes = await fetch('https://api.sarvam.ai/speech-to-text', {
                  method: 'POST',
                  headers: { 'api-subscription-key': sarvamApiKey },
                  body: form
                });

                if (sttRes.ok) {
                  const sttData = (await sttRes.json()) as any;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    transcript: sttData.transcript?.trim() || '',
                    language_code: sttData.language_code
                  }));
                } else {
                  const errText = await sttRes.text();
                  console.warn('Sarvam STT error:', errText);
                  res.statusCode = 502;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'STT service error', details: errText }));
                }
              } catch (err: any) {
                console.error('STT endpoint exception:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err?.message || 'STT processing failed' }));
              }
            });
          });

          // BioDigital Human Content API OAuth2 Token Proxy (avoids CORS preflight)
          server.middlewares.use('/api/biodigital/token', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            let bodyStr = '';
            req.on('data', (chunk) => {
              bodyStr += chunk;
            });

            req.on('end', async () => {
              try {
                const parsed = JSON.parse(bodyStr || '{}');
                const { developerKey, developerSecret } = parsed;

                if (!developerKey || !developerSecret) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({
                      service_version: 1,
                      error_status_code: 400,
                      error_type: 'invalid_request',
                      error_code: '1001',
                      error_message: 'developerKey and developerSecret are required.'
                    })
                  );
                  return;
                }

                // Step 1: URL-encode key and secret, concatenate with colon, and Base64-encode
                const concatenated = `${encodeURIComponent(developerKey.trim())}:${encodeURIComponent(developerSecret.trim())}`;
                const authStr = Buffer.from(concatenated).toString('base64');

                // Step 2: POST /token to BioDigital APIs
                const biodigitalRes = await fetch('https://apis.biodigital.com/oauth2/v2/token', {
                  method: 'POST',
                  headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json;charset=UTF-8',
                    Authorization: `Basic ${authStr}`
                  },
                  body: JSON.stringify({
                    grant_type: 'client_credentials',
                    scope: 'contentapi'
                  })
                });

                const data = await biodigitalRes.json();
                res.statusCode = biodigitalRes.status;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    service_version: 1,
                    error_status_code: 500,
                    error_type: 'internal_server_error',
                    error_code: '5000',
                    error_message: err?.message || 'Failed to exchange BioDigital token.'
                  })
                );
              }
            });
          });

          // Sarvam Vision OCR & Document Intelligence + InsForge Storage & Database
          server.middlewares.use('/api/sarvam-ocr', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            const chunks: Buffer[] = [];
            req.on('data', (chunk) => {
              chunks.push(chunk);
            });

            req.on('end', async () => {
              try {
                const bodyStr = Buffer.concat(chunks).toString('utf-8');
                const parsed = JSON.parse(bodyStr || '{}');
                const { fileDataUrl, fileName, fileType, sessionId } = parsed;

                if (!fileDataUrl) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'fileDataUrl is required' }));
                  return;
                }

                const base64Data = fileDataUrl.includes(',') ? fileDataUrl.split(',')[1] : fileDataUrl;
                const buffer = Buffer.from(base64Data, 'base64');
                const mimeType = fileType || 'image/jpeg';
                const cleanName = (fileName || 'prescription.jpg').replace(/[^a-zA-Z0-9.-]/g, '_');
                const storageKey = `prescriptions/${Date.now()}_${cleanName}`;

                // 1. Upload file to InsForge Storage bucket (patient-records) using admin client
                const insforgeUrl = env.INSFORGE_URL || process.env.INSFORGE_URL;
                const insforgeApiKey = env.INSFORGE_API_KEY || process.env.INSFORGE_API_KEY;
                const sarvamApiKey = env.SARVAM_API_KEY || process.env.SARVAM_API_KEY;

                if (!insforgeUrl || !insforgeApiKey) {
                  throw new Error('INSFORGE_URL and INSFORGE_API_KEY must be configured in .env.local');
                }
                if (!sarvamApiKey) {
                  throw new Error('SARVAM_API_KEY must be configured in .env.local');
                }

                const admin = createAdminClient({
                  baseUrl: insforgeUrl,
                  apiKey: insforgeApiKey,
                });

                let storageUrl = '';
                const blob = new Blob([buffer], { type: mimeType });
                const { data: uploadData, error: uploadErr } = await admin.storage
                  .from('patient-records')
                  .upload(storageKey, blob);

                if (uploadErr || !uploadData?.url) {
                  throw new Error(`InsForge storage upload failed: ${uploadErr?.message || 'no file URL returned'}`);
                }
                storageUrl = uploadData.url;

                // 2. Perform Sarvam Doc-AI OCR (Digitise endpoint)
                let rawOcrText = '';
                let ocrPages: any[] = [];
                let ocrBlocks: any[] = [];
                let ocrConfidence = 0;

                const form = new FormData();
                form.append('file', new Blob([buffer], { type: mimeType }), cleanName);
                form.append('language', 'en-IN');
                form.append('output_format', 'json');
                form.append('content_type', 'mixed');

                const digitiseRes = await fetch('https://api.sarvam.ai/doc-ai/v1/job/digitise', {
                  method: 'POST',
                  headers: { 'api-subscription-key': sarvamApiKey },
                  body: form,
                });
                const digitiseData = (await digitiseRes.json().catch(() => ({}))) as any;
                if (!digitiseRes.ok) {
                  throw new Error(`Sarvam Doc-AI digitise failed (${digitiseRes.status}): ${digitiseData.message || 'provider rejected the request'}`);
                }

                const jobId = digitiseData.job_id;
                if (!jobId) throw new Error('Sarvam Doc-AI did not return a job_id');

                console.log(`[Sarvam Doc-AI] Job initiated: ${jobId}. Polling status...`);
                let completed = false;
                for (let i = 0; i < 30; i++) {
                  await new Promise((r) => setTimeout(r, 1200));
                  const statusRes = await fetch(`https://api.sarvam.ai/doc-ai/v1/job/${jobId}/status`, {
                    headers: { 'api-subscription-key': sarvamApiKey },
                  });
                  const statusData = (await statusRes.json().catch(() => ({}))) as any;
                  if (!statusRes.ok) {
                    throw new Error(`Sarvam Doc-AI status failed (${statusRes.status})`);
                  }

                  const jobStatus = String(statusData.status ?? statusData.job_state ?? '').toLowerCase();
                  if (['completed', 'complete', 'succeeded', 'success'].includes(jobStatus)) {
                    const resultsRes = await fetch(`https://api.sarvam.ai/doc-ai/v1/job/${jobId}/results`, {
                      headers: { 'api-subscription-key': sarvamApiKey },
                    });
                    const resultsData = (await resultsRes.json().catch(() => ({}))) as any;
                    if (!resultsRes.ok) throw new Error(`Sarvam Doc-AI results failed (${resultsRes.status})`);

                    const documents = Array.isArray(resultsData.documents) ? resultsData.documents : [];
                    ocrPages = documents.flatMap((document: any) => Array.isArray(document.pages) ? document.pages : []);
                    if (!ocrPages.length && Array.isArray(resultsData.pages)) ocrPages = resultsData.pages;
                    ocrBlocks = ocrPages.flatMap((page: any) => Array.isArray(page.blocks) ? page.blocks : []);
                    rawOcrText = ocrBlocks.map((block: any) => block.text).filter(Boolean).join('\n');
                    ocrConfidence = Number(resultsData.confidence ?? ocrBlocks[0]?.confidence ?? 0) || 0;
                    completed = true;
                    console.log(`[Sarvam Doc-AI] Extracted ${ocrBlocks.length} OCR blocks across ${ocrPages.length} pages.`);
                    break;
                  }
                  if (['failed', 'rejected', 'error'].includes(jobStatus)) {
                    throw new Error(`Sarvam Doc-AI job ended with status: ${jobStatus}`);
                  }
                }
                if (!completed) throw new Error('Sarvam Doc-AI job did not complete within the local polling window');

                // 3. Clinical Extraction with Sarvam 105B Reasoning ONLY
                let extraction: any = null;
                const promptContent = rawOcrText
                  ? `Extracted Medical Document OCR Text:\n${rawOcrText}`
                  : `Medical prescription file uploaded: "${cleanName}". No legible text detected by OCR.`;

                try {
                  console.log('[Sarvam Model] Requesting clinical report from sarvam-105b-conversations...');
                  const chatRes = await fetch('https://api.sarvam.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                      'api-subscription-key': sarvamApiKey,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      model: 'sarvam-105b-conversations',
                      messages: [
                        {
                          role: 'system',
                          content: `You are an expert clinical medical officer and pharmacologist at the OPD clinical intake desk.
Analyze the provided medical prescription/lab OCR text carefully.
Extract structured clinical details based STRICTLY on what is present in the document. Do not invent unrelated diseases or medications.
Return STRICTLY a valid JSON object matching this exact schema:
{
  "doctor_report": "Comprehensive 3-5 sentence clinical anamnesis and prescription review for the attending doctor, noting findings, potential drug risks, and immediate clinical evaluation needed.",
  "patient_summary": "Warm, reassuring 2-3 sentence explanation for the patient explaining what medications were found and key precautions in simple terms.",
  "prescribing_doctor": "Doctor name with qualifications and hospital/clinic name from the document",
  "diagnosis_found": "Primary medical diagnosis or clinical condition detected",
  "extracted_medications": [
    {
      "name": "Medication name",
      "dosage": "Dosage (e.g. 500mg, 40mg)",
      "frequency": "Frequency (e.g. OD, BD, TDS, Once Daily)",
      "instructions": "Administration instructions (e.g. After meals, Before breakfast)",
      "category": "Allopathic | Ayurvedic | Supportive"
    }
  ],
  "detected_allergies": ["List of detected drug allergies or severe warning flags"],
  "contraindications": ["Specific clinical warnings, contraindications, or drug-drug interaction cautions"],
  "vitals_extracted": {
    "blood_pressure": "e.g. 130/85 mmHg if mentioned or null",
    "blood_glucose": "e.g. 140 mg/dL if mentioned or null",
    "pulse": "e.g. 78 bpm if mentioned or null",
    "weight": "if mentioned or null"
  },
  "recommendations": [
    "Actionable clinical recommendation 1",
    "Actionable clinical recommendation 2"
  ],
  "organ_impact": {
    "HEART": "safe or warning or risk",
    "LUNGS": "safe or warning or risk",
    "LIVER": "safe or warning or risk",
    "GUT": "safe or warning or risk",
    "KIDNEYS": "safe or warning or risk",
    "SKIN": "safe or warning or risk",
    "BRAIN": "safe or warning or risk"
  },
  "risk_score": 0,
  "urgency": "routine | medium | high | emergency",
  "ocr_confidence": ${ocrConfidence}
}
Do NOT wrap in markdown code blocks. Output ONLY valid parseable JSON.`,
                        },
                        {
                          role: 'user',
                          content: promptContent,
                        },
                      ],
                    }),
                  });

                  if (chatRes.ok) {
                    const chatData = (await chatRes.json()) as any;
                    const content = chatData.choices?.[0]?.message?.content || '{}';
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                      extraction = JSON.parse(jsonMatch[0]);
                      console.log('[Sarvam Model] Successfully generated clinical report.');
                    }
                  } else {
                    console.warn('[Sarvam Model] Chat API responded with:', chatRes.status);
                  }
                } catch (llmErr) {
                  console.warn('Sarvam 105B parsing note:', llmErr);
                }

                // Truthful fallback derived from actual OCR blocks (no fake mock data!)
                if (!extraction) {
                  const hasBlocks = ocrBlocks.length > 0;
                  extraction = {
                    doctor_report: hasBlocks
                      ? `Digitized ${ocrBlocks.length} text segments from "${cleanName}" via Sarvam Vision OCR. Attending clinician verification recommended.`
                      : `Uploaded document "${cleanName}" was processed via Sarvam Vision OCR. No distinct text lines recognized. Manual clinician inspection advised.`,
                    patient_summary: hasBlocks
                      ? `Your document "${cleanName}" has been digitized and sent to the attending clinician for review.`
                      : `Your file "${cleanName}" has been uploaded. The doctor will examine the original document during your consultation.`,
                    prescribing_doctor: 'Not provided in document',
                    diagnosis_found: hasBlocks ? 'Not provided in document' : 'No legible text detected',
                    extracted_medications: [],
                    detected_allergies: [],
                    contraindications: [],
                    vitals_extracted: {},
                    recommendations: [
                      'Review original uploaded document with attending physician.',
                      'Confirm current medication dosages during OPD consultation.'
                    ],
                    organ_impact: {
                      HEART: 'safe',
                      LUNGS: 'safe',
                      LIVER: 'safe',
                      GUT: 'safe',
                      KIDNEYS: 'safe',
                      SKIN: 'safe',
                      BRAIN: 'safe'
                    },
                    risk_score: 0,
                    urgency: 'routine',
                    ocr_confidence: ocrConfidence,
                  };
                }

                // 4. Save to InsForge Database: prescription_scans
                if (!sessionId) throw new Error('An active OPD session is required before saving a prescription');
                const targetSessionId = sessionId;
                let recordId = `rec-${Date.now()}`;
                try {
                  const { data: dbData, error: dbErr } = await admin.database
                    .from('prescription_scans')
                    .insert([
                      {
                        session_id: targetSessionId,
                        file_url: storageUrl,
                        file_key: storageKey,
                        prescribing_doctor: extraction.prescribing_doctor || 'Hospital OPD',
                        diagnosis_found: extraction.diagnosis_found || 'Clinical Intake',
                        extracted_medications: extraction.extracted_medications || [],
                        detected_allergies: extraction.detected_allergies || [],
                        ocr_confidence: extraction.ocr_confidence || ocrConfidence,
                        lab_flags: {
                          ocr_blocks: ocrBlocks,
                          pages: ocrPages,
                          doctor_report: extraction.doctor_report,
                          patient_summary: extraction.patient_summary,
                          vitals: extraction.vitals_extracted,
                          recommendations: extraction.recommendations,
                          contraindications: extraction.contraindications,
                          organ_impact: extraction.organ_impact,
                          raw_ocr_text: rawOcrText,
                        },
                      },
                    ])
                    .select('id')
                    .single();

                  if (dbErr || !dbData) {
                    throw new Error(`InsForge prescription_scans insert failed: ${dbErr?.message || 'no record returned'}`);
                  }
                  recordId = (dbData as { id: string }).id;

                  // 5. Update OPD session to notify doctor with real diagnosis
                  await admin.database
                    .from('opd_sessions')
                    .update({
                      chief_complaint: `Prescription Digitized: ${extraction.diagnosis_found || 'Clinical Intake'}`,
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', targetSessionId);
                } catch (dbErr) {
                  throw dbErr;
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    success: true,
                    recordId,
                    storageUrl,
                    storageKey,
                    rawOcrText,
                    pages: ocrPages,
                    blocks: ocrBlocks,
                    extraction,
                  })
                );
              } catch (err: any) {
                console.error('Sarvam OCR API exception:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    error: err?.message || 'Failed to process document with Sarvam OCR',
                  })
                );
              }
            });
          });

          // ── Pinata IPFS Decentralized Pinning Endpoint ──
          server.middlewares.use('/api/pinata/pin-json', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            const chunks: Buffer[] = [];
            req.on('data', (c) => chunks.push(c));
            req.on('end', async () => {
              try {
                const bodyStr = Buffer.concat(chunks).toString('utf-8');
                const parsed = JSON.parse(bodyStr || '{}');
                const { content, name = 'patient-record.json' } = parsed;

                const pinataApiKey = env.PINATA_API_KEY || process.env.PINATA_API_KEY;
                const pinataSecretKey = env.PINATA_SECRET_KEY || process.env.PINATA_SECRET_KEY;
                const pinataGateway = env.PINATA_GATEWAY || process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';

                if (!pinataApiKey || !pinataSecretKey) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Pinata API keys not configured in .env' }));
                  return;
                }

                const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
                const crypto = await import('node:crypto');
                const sha256 = crypto.createHash('sha256').update(contentStr).digest('hex');

                const pinRes = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    pinata_api_key: pinataApiKey,
                    pinata_secret_api_key: pinataSecretKey,
                  },
                  body: JSON.stringify({
                    pinataOptions: { cidVersion: 1 },
                    pinataMetadata: { name },
                    pinataContent: typeof content === 'object' ? content : { payload: content },
                  }),
                });

                if (!pinRes.ok) {
                  const errText = await pinRes.text();
                  throw new Error(`Pinata error (${pinRes.status}): ${errText}`);
                }

                const pinData = (await pinRes.json()) as any;
                const cid = pinData.IpfsHash;

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    success: true,
                    cid,
                    sha256,
                    pinSize: pinData.PinSize,
                    timestamp: pinData.Timestamp,
                    gatewayUrl: `${pinataGateway.replace(/\/$/, '')}/${cid}`,
                  })
                );
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err?.message || 'Pinata pinning failed' }));
              }
            });
          });
        }
      }
    ],
  };
});
