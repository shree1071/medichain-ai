# Autonomous OPD Clinical Case-Taking Kiosk — MediChain AI

> **Problem Statement:** Multimodal AI-powered intake via Voice & Touch. Elicits SOCRATES anamnesis, AYUSH Dashavidha Pariksha, and digitizes past records in 2 minutes before the doctor consult.

Built for **MineArena 1.0 Hackathon** ([minearena-1-0.devpost.com](https://minearena-1-0.devpost.com/)).

## Inspiration

In 2023, the ICMR data breach exposed around **815 million identities**. That one number showed us the problem with health data today: it sits in central databases, so a single breach exposes everyone. At the same time, patients have no real ownership. Their reports are locked inside hospital systems, and they become "digital refugees" the moment they move to another hospital, city or country.

We also kept asking who gets left out. Most blockchain health projects assume the patient has a crypto wallet and some technical knowledge. A patient in a rural area has neither. We wanted records that the patient owns, that work over WhatsApp, and that don't need the patient to know anything about blockchain.

## What it does

**MediChain AI** is a patient-owned health record system.

- **Patient-owned storage:** reports are encrypted and stored on IPFS. Only the SHA-256 hash and content ID go on the Polygon blockchain.
- **Auto-expiring access (CAEAP):** a doctor gets time-limited access through a smart contract. When the time is up, access ends on its own, and every access event goes into an immutable audit log.
- **Local private AI:** MedGemma 4B runs locally. It reads reports, analyses chest X-rays and skin images, and feeds an OMVF/OME organ risk score. No raw patient data goes to a third-party cloud.
- **Wallet-free for rural users:** an SSS-TEE embedded wallet works in the background. Patients log in with WhatsApp or the website and never create, hold or see a wallet.

## How we built it

- **Frontend:** Next.js and Tailwind CSS web dashboard, plus a WhatsApp bot.
- **Backend:** FastAPI and Node.js.
- **Web3:** Hardhat, Ethers.js, Polygon smart contracts, IPFS through Pinata.
- **AI:** MedGemma 4B running locally.
- **Deployment:** the services run as Docker containers on separate networks, and the AI network has no internet access.

## Challenges we ran into

- **Making blockchain invisible:** the hardest design problem was giving a patient real ownership without making them manage keys or a wallet.
- **Keeping AI private:** useful AI normally needs raw patient data, and strong privacy normally limits AI. Running the model locally was how we resolved that.
- **Keeping the chain light:** health data can't go on a public chain, so we only put hashes and access rules on it and keep encrypted files off-chain.
- **Fitting a model on modest hardware:** we chose MedGemma 4B because it is small enough to run locally and still handles both text reports and images.

## What we learned

- Privacy and AI usefulness are not opposites if the model comes to the data instead of the data going to the model.
- A blockchain product is only useful to rural users if the blockchain part is hidden from them.
- Our post-quantum security design is described in our paper, accepted at **ICDDS'26**.
- MedGemma 4B reached **91.7% accuracy on 227 MIMIC-IV admissions** in our evaluation.

## What's next

- On-device AI with Gemma 3 and OCR for handwritten reports.
- Integration with hospital systems (HL7/FHIR).
- Cross-border portability across India, Thailand and the USA.
