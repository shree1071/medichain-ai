import logging
from dotenv import load_dotenv
from livekit.agents import JobContext, WorkerOptions, cli
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import sarvam, silero

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice-agent")

SYSTEM_PROMPT = """
You are an expressive, knowledgeable AI Heritage Voice Guide for Odisha and Indian cultural heritage (including the Konark Sun Temple, Jagannath Temple in Puri, Lingaraj Temple, and Dhauli Shanti Stupa).

Guidelines:
1. Speak warmly, respectfully, and conversationally.
2. Keep spoken replies concise (2 to 3 sentences maximum) so the voice conversation remains natural and responsive.
3. You can understand and converse in English, Hindi (हिन्दी), and Odia (ଓଡ଼ିଆ). Respond in the language the user speaks.
4. Greet visitors warmly with "Namaskar! Welcome to the Odisha Heritage Experience." or "Jay Jagannath!"
"""

class HeritageVoiceAgent(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=SYSTEM_PROMPT,
            # Speech-to-text with auto Indic language detection
            stt=sarvam.STT(
                language="unknown",
                model="saaras:v4",
                mode="transcribe"
            ),
            # Conversational Indic LLM with sub-second response times
            llm=sarvam.LLM(
                model="sarvam-105b-conversations"
            ),
            # Bulbul v3 TTS for natural Indian voices
            tts=sarvam.TTS(
                language_code="hi-IN",
                model="bulbul:v3",
                speaker="shubh"
            ),
            # Voice Activity Detection for seamless interruption / barge-in
            vad=silero.VAD.load()
        )

    async def on_enter(self):
        """Triggered when a user joins the room - start with a warm audio greeting"""
        logger.info("User joined room. Generating greeting...")
        self.session.generate_reply()

async def entrypoint(ctx: JobContext):
    logger.info(f"Agent worker connected to LiveKit room: {ctx.room.name}")
    session = AgentSession()
    await session.start(
        agent=HeritageVoiceAgent(),
        room=ctx.room
    )

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
