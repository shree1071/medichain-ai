import { useState } from 'react';
import { 
  ShieldAlert, 
  Cpu, 
  Layers, 
  Flame, 
  GraduationCap, 
  Sparkles, 
  Lock, 
  FileCheck2, 
  Server, 
  Globe2, 
  Share2, 
  Smartphone,
  Database
} from 'lucide-react';

export default function MediChainOverviewSection() {
  const [activeTab, setActiveTab] = useState<
    'inspiration' | 'what-it-does' | 'architecture' | 'challenges' | 'learnings' | 'future'
  >('inspiration');

  const tabs = [
    { id: 'inspiration', label: 'Inspiration', icon: ShieldAlert, badge: '815M Breach' },
    { id: 'what-it-does', label: 'What It Does', icon: Cpu, badge: 'MediChain AI' },
    { id: 'architecture', label: 'How We Built It', icon: Layers, badge: 'Full Stack' },
    { id: 'challenges', label: 'Challenges', icon: Flame, badge: 'Solutions' },
    { id: 'learnings', label: 'What We Learned', icon: GraduationCap, badge: 'ICDDS\'26' },
    { id: 'future', label: 'What\'s Next', icon: Sparkles, badge: 'Roadmap' },
  ] as const;

  return (
    <section id="inspiration" className="medichain-overview-section py-20 sm:py-28 px-4 sm:px-6 bg-[#fbf9f5] border-y border-[#4d4439]/10 relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#4865ff]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#328a3b]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1180px] mx-auto relative z-10">
        
        {/* Section Pill Badge & Editorial Headline */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#4865ff]/20 bg-[#4865ff]/8 text-[#4865ff] text-[11px] sm:text-xs font-semibold tracking-widest uppercase mb-4 shadow-xs">
            <Lock size={12} className="text-[#4865ff]" />
            <span>PATIENT-OWNED SOVEREIGN HEALTH RECORD ARCHITECTURE</span>
          </div>

          <h2 className="font-serif text-[34px] sm:text-[46px] lg:text-[52px] leading-[1.1] text-[#080331] font-normal mb-4">
            MediChain <span className="text-[#4865ff] italic font-serif">AI</span> System Architecture
          </h2>

          <p className="font-sans text-[15px] sm:text-[17px] text-[#4d4439] leading-relaxed max-w-[700px] mx-auto">
            From the 815M ICMR data breach to wallet-free SSS-TEE cryptography: how we built an autonomous, patient-owned, and private clinical health records ecosystem.
          </p>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-10 hide-scrollbar snap-x">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-[13px] font-medium transition-all shrink-0 cursor-pointer snap-start border ${
                  isActive
                    ? 'bg-[#080331] text-white border-[#080331] shadow-[0_8px_20px_rgba(8,3,49,0.18)] scale-[1.02]'
                    : 'bg-white hover:bg-[#f8f3eb] text-[#080331] border-[#4d4439]/15 shadow-xs'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'text-[#4865ff] group-hover:scale-110 transition-transform'} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#4865ff]/10 text-[#4865ff]'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Tab Content Cards */}
        <div className="bg-white rounded-[28px] border border-[#4d4439]/12 shadow-[0_16px_40px_rgba(75,68,57,0.08)] overflow-hidden">
          
          {/* ──────────────── 1. INSPIRATION ──────────────── */}
          {activeTab === 'inspiration' && (
            <div className="p-7 sm:p-10 md:p-12 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                <div className="lg:col-span-7 space-y-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                    <ShieldAlert size={13} />
                    <span>815 Million Records Exposed in 2023</span>
                  </div>

                  <h3 className="font-serif text-[28px] sm:text-[36px] text-[#080331] leading-tight font-normal">
                    Why We Built MediChain AI: Ending Centralized Data Exploitation
                  </h3>

                  <div className="space-y-4 text-[15px] sm:text-[16px] text-[#333333] leading-relaxed font-normal">
                    <p>
                      In 2023, the ICMR data breach exposed around <strong className="text-red-700 font-bold">815 million identities</strong>. That single catastrophic incident revealed the fatal structural flaw in modern healthcare: records sit in vulnerable centralized databases where a single compromise exposes an entire nation.
                    </p>
                    <p>
                      At the same time, patients have zero authentic ownership. Their medical histories, scans, and lab reports are locked inside proprietary hospital silos, turning patients into <strong className="text-[#080331]">"digital refugees"</strong> the moment they relocate to another hospital, city, or state.
                    </p>
                    <p>
                      We also asked who gets left out. Most blockchain healthcare projects naively expect rural citizens to manage crypto wallets, private keys, and gas fees. In reality, a farmer or elderly patient has neither the technical literacy nor the interest.
                    </p>
                    <p className="p-4 bg-[#f8f3eb] rounded-2xl border-l-4 border-[#4865ff] text-[#080331] font-medium">
                      We created records that the patient truly owns, that operate smoothly over everyday channels like WhatsApp, and that hide the blockchain entirely.
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-[#fff5f5] rounded-2xl p-6 border border-red-200 shadow-sm">
                    <div className="text-3xl sm:text-4xl font-serif text-red-600 mb-1">815,000,000</div>
                    <div className="text-xs font-bold text-red-900 uppercase tracking-wide">Citizens Exposed in 2023 Breach</div>
                    <p className="text-xs text-red-800/80 mt-2">
                      Centralized silos represent single points of total failure for biometric, Aadhaar, and clinical records.
                    </p>
                  </div>

                  <div className="bg-[#f0f9f0] rounded-2xl p-6 border border-[#328a3b]/20 shadow-sm">
                    <div className="flex items-center gap-2 text-[#328a3b] font-semibold text-sm mb-1">
                      <Lock size={16} />
                      <span>The MediChain Paradigm</span>
                    </div>
                    <div className="text-xs text-stone-700 space-y-2 mt-2">
                      <div className="flex items-start gap-2">
                        <span className="text-[#328a3b] font-bold">✓</span>
                        <span>Zero centralized plaintext storage (IPFS + AES-GCM-256)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#328a3b] font-bold">✓</span>
                        <span>Wallet-free authentication via SSS-TEE embedded vaults</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#328a3b] font-bold">✓</span>
                        <span>WhatsApp bot interface for 100% rural digital inclusion</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── 2. WHAT IT DOES ──────────────── */}
          {activeTab === 'what-it-does' && (
            <div className="p-7 sm:p-10 md:p-12 animate-in fade-in duration-300">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs font-semibold text-[#4865ff] uppercase tracking-wider bg-[#4865ff]/10 px-3 py-1 rounded-full">
                  Core Capabilities
                </span>
                <h3 className="font-serif text-[28px] sm:text-[36px] text-[#080331] font-normal mt-2">
                  What MediChain AI Does
                </h3>
                <p className="text-sm sm:text-base text-stone-600 mt-2">
                  A patient-owned sovereign health record platform pairing immutable smart contracts with on-device clinical intelligence.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Feature 1: Patient-Owned Storage */}
                <div className="bg-[#f8f3eb] rounded-2xl p-6 sm:p-8 border border-[#4d4439]/10 hover:border-[#4865ff]/30 transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#4865ff] flex items-center justify-center mb-4">
                      <Database size={22} />
                    </div>
                    <h4 className="font-serif text-xl sm:text-2xl text-[#080331] mb-2">Patient-Owned Storage</h4>
                    <p className="text-xs sm:text-sm text-[#333333] leading-relaxed">
                      Health reports are client-side encrypted and hosted on decentralized IPFS nodes. Only the SHA-256 cryptographic hash and IPFS Content ID (CID) are anchored to the Polygon blockchain ledger.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#4d4439]/10 flex items-center justify-between text-xs text-[#4865ff] font-semibold">
                    <span>IPFS + Pinata Gateway</span>
                    <span>Polygon PoS</span>
                  </div>
                </div>

                {/* Feature 2: Auto-Expiring Access (CAEAP) */}
                <div className="bg-[#f8f3eb] rounded-2xl p-6 sm:p-8 border border-[#4d4439]/10 hover:border-[#328a3b]/30 transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#328a3b] flex items-center justify-center mb-4">
                      <FileCheck2 size={22} />
                    </div>
                    <h4 className="font-serif text-xl sm:text-2xl text-[#080331] mb-2">Auto-Expiring Access (CAEAP)</h4>
                    <p className="text-xs sm:text-sm text-[#333333] leading-relaxed">
                      Clinicians receive strictly time-bounded access through a verified smart contract. Once the consultation window concludes, access auto-revokes cryptographically, and every query is permanently etched into an immutable audit trail.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#4d4439]/10 flex items-center justify-between text-xs text-[#328a3b] font-semibold">
                    <span>Smart Contract Enforced</span>
                    <span>Immutable Audit Log</span>
                  </div>
                </div>

                {/* Feature 3: Local Private AI */}
                <div className="bg-[#f8f3eb] rounded-2xl p-6 sm:p-8 border border-[#4d4439]/10 hover:border-[#ff6d39]/30 transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-orange-100 text-[#ff6d39] flex items-center justify-center mb-4">
                      <Cpu size={22} />
                    </div>
                    <h4 className="font-serif text-xl sm:text-2xl text-[#080331] mb-2">Local Private AI (MedGemma 4B)</h4>
                    <p className="text-xs sm:text-sm text-[#333333] leading-relaxed">
                      MedGemma 4B executes entirely on on-premise hospital hardware. It parses multi-page EHRs, interprets chest X-rays, evaluates skin lesions, and computes OMVF/OME organ risk scores with zero raw bytes ever sent to third-party cloud servers.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#4d4439]/10 flex items-center justify-between text-xs text-[#ff6d39] font-semibold">
                    <span>91.7% MIMIC-IV Accuracy</span>
                    <span>Air-Gapped Privacy</span>
                  </div>
                </div>

                {/* Feature 4: Wallet-Free for Rural Users */}
                <div className="bg-[#f8f3eb] rounded-2xl p-6 sm:p-8 border border-[#4d4439]/10 hover:border-[#f098d7]/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-purple-100 text-[#7a22a3] flex items-center justify-center mb-4">
                      <Smartphone size={22} />
                    </div>
                    <h4 className="font-serif text-xl sm:text-2xl text-[#080331] mb-2">Wallet-Free for Rural Citizens</h4>
                    <p className="text-xs sm:text-sm text-[#333333] leading-relaxed">
                      Shamir's Secret Sharing (SSS) and Trusted Execution Environments (TEE) manage embedded wallets transparently. Patients interact via WhatsApp voice notes or the web portal without ever creating, funding, or viewing a crypto wallet.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#4d4439]/10 flex items-center justify-between text-xs text-[#7a22a3] font-semibold">
                    <span>SSS-TEE Embedded Wallets</span>
                    <span>WhatsApp Conversational UI</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── 3. HOW WE BUILT IT ──────────────── */}
          {activeTab === 'architecture' && (
            <div className="p-7 sm:p-10 md:p-12 animate-in fade-in duration-300">
              <div className="max-w-3xl mb-8">
                <span className="text-xs font-semibold text-[#4865ff] uppercase tracking-wider bg-[#4865ff]/10 px-3 py-1 rounded-full">
                  Technology Stack &amp; Infrastructure
                </span>
                <h3 className="font-serif text-[28px] sm:text-[36px] text-[#080331] font-normal mt-2">
                  How We Built It
                </h3>
                <p className="text-sm sm:text-base text-[#4d4439] mt-2">
                  A modular multi-tier architecture engineered for hospital grade availability, sovereign encryption, and multi-network container isolation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Tier 1: Frontend */}
                <div className="p-6 rounded-2xl border border-stone-200 bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#4865ff] tracking-wide uppercase">Frontend Tier</span>
                    <Globe2 size={16} className="text-[#4865ff]" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg mb-2">Next.js &amp; Tailwind CSS</h4>
                  <ul className="text-xs text-stone-600 space-y-2">
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#4865ff]">•</span>
                      <span>Next.js 14 / Vite React client web dashboard</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#4865ff]">•</span>
                      <span>Tailwind CSS design system with August Health editorial aesthetic</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#4865ff]">•</span>
                      <span>Twilio / Meta WhatsApp webhook bot for rural conversational intake</span>
                    </li>
                  </ul>
                </div>

                {/* Tier 2: Backend */}
                <div className="p-6 rounded-2xl border border-stone-200 bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#328a3b] tracking-wide uppercase">Backend Tier</span>
                    <Server size={16} className="text-[#328a3b]" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg mb-2">FastAPI &amp; Node.js</h4>
                  <ul className="text-xs text-stone-600 space-y-2">
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#328a3b]">•</span>
                      <span>High-concurrency Python FastAPI microservices for clinical pipeline</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#328a3b]">•</span>
                      <span>Node.js event orchestrator with InsForge &amp; LiveKit WebRTC</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#328a3b]">•</span>
                      <span>ABDM M1 &amp; FHIR R4 clinical transaction bundle generators</span>
                    </li>
                  </ul>
                </div>

                {/* Tier 3: Web3 */}
                <div className="p-6 rounded-2xl border border-stone-200 bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#ff6d39] tracking-wide uppercase">Web3 &amp; Storage</span>
                    <Share2 size={16} className="text-[#ff6d39]" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg mb-2">Polygon &amp; IPFS</h4>
                  <ul className="text-xs text-stone-600 space-y-2">
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#ff6d39]">•</span>
                      <span>Hardhat suite with Solidity smart contracts tested on Polygon PoS</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#ff6d39]">•</span>
                      <span>Ethers.js v6 for CAEAP contract interaction &amp; verification</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#ff6d39]">•</span>
                      <span>IPFS cluster via Pinata for decentralized content addressable storage</span>
                    </li>
                  </ul>
                </div>

                {/* Tier 4: AI Engine */}
                <div className="p-6 rounded-2xl border border-stone-200 bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#f098d7] tracking-wide uppercase">AI &amp; Diagnostics</span>
                    <Cpu size={16} className="text-[#f098d7]" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg mb-2">MedGemma 4B Local</h4>
                  <ul className="text-xs text-stone-600 space-y-2">
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#f098d7]">•</span>
                      <span>Google MedGemma 4B multimodal weights loaded in local VRAM</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#f098d7]">•</span>
                      <span>Analyzes chest radiographs, derm images, and complex prescription OCR</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#f098d7]">•</span>
                      <span>OMVF / OME multi-organ acuity and risk index scoring engine</span>
                    </li>
                  </ul>
                </div>

                {/* Tier 5: Deployment & Isolation */}
                <div className="p-6 rounded-2xl border border-stone-200 bg-white hover:shadow-md transition-shadow md:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#080331] tracking-wide uppercase">Container Architecture</span>
                    <Lock size={16} className="text-[#080331]" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg mb-2">Docker Multi-Network Isolation</h4>
                  <p className="text-xs text-stone-600 leading-relaxed mb-3">
                    Services run as segmented Docker containers across distinct virtual networks. Crucially, the <strong>AI Inference Network has zero internet access</strong>—completely air-gapped to mathematically prevent patient data exfiltration to any third-party cloud.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                    <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md">Frontend Net (Public)</span>
                    <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md">API Gateway Net (Internal)</span>
                    <span className="bg-red-50 text-red-700 font-bold px-2.5 py-1 rounded-md border border-red-200">AI Net (Air-Gapped / No Outbound)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── 4. CHALLENGES WE RAN INTO ──────────────── */}
          {activeTab === 'challenges' && (
            <div className="p-7 sm:p-10 md:p-12 animate-in fade-in duration-300">
              <div className="max-w-3xl mb-8">
                <span className="text-xs font-semibold text-[#ff6d39] uppercase tracking-wider bg-[#ff6d39]/10 px-3 py-1 rounded-full">
                  Technical Hurdles &amp; Engineering Solutions
                </span>
                <h3 className="font-serif text-[28px] sm:text-[36px] text-[#080331] font-normal mt-2">
                  Challenges We Ran Into
                </h3>
              </div>

              <div className="space-y-5">
                {/* Challenge 1 */}
                <div className="p-6 rounded-2xl bg-[#fffaf5] border border-[#ff6d39]/20 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 md:max-w-md">
                    <div className="text-xs font-bold text-[#ff6d39] uppercase tracking-wide">Challenge #1</div>
                    <h4 className="font-bold text-slate-900 text-lg">Making Blockchain Completely Invisible</h4>
                    <p className="text-xs sm:text-sm text-stone-600">
                      The hardest UI/UX and cryptographic challenge was providing authentic, non-custodial cryptographic ownership without forcing the patient to manage seed phrases, gas fees, or complex wallet setups.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-[#ff6d39]/30 text-xs text-[#080331] md:w-72 shrink-0">
                    <span className="font-bold text-[#ff6d39] block mb-1">Our Solution:</span>
                    Embedded SSS-TEE hardware key-splitting. Patient identity triggers ephemeral threshold signatures without ever seeing a wallet.
                  </div>
                </div>

                {/* Challenge 2 */}
                <div className="p-6 rounded-2xl bg-[#f5fbf7] border border-[#328a3b]/20 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 md:max-w-md">
                    <div className="text-xs font-bold text-[#328a3b] uppercase tracking-wide">Challenge #2</div>
                    <h4 className="font-bold text-slate-900 text-lg">Keeping AI Private Under High Utility Demands</h4>
                    <p className="text-xs sm:text-sm text-stone-600">
                      Standard healthcare AI pipelines require streaming raw radiographs and EHR data to cloud APIs, while strict privacy compliance mandates keeping data within the hospital premises.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-[#328a3b]/30 text-xs text-[#080331] md:w-72 shrink-0">
                    <span className="font-bold text-[#328a3b] block mb-1">Our Solution:</span>
                    "Bring the model to the data." Localized quantized MedGemma 4B models executing entirely inside isolated hospital containers.
                  </div>
                </div>

                {/* Challenge 3 */}
                <div className="p-6 rounded-2xl bg-[#f5f7fb] border border-[#4865ff]/20 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 md:max-w-md">
                    <div className="text-xs font-bold text-[#4865ff] uppercase tracking-wide">Challenge #3</div>
                    <h4 className="font-bold text-slate-900 text-lg">Keeping the Blockchain Light &amp; Cost-Effective</h4>
                    <p className="text-xs sm:text-sm text-stone-600">
                      Storing large DICOM medical imaging or dense clinical records directly on-chain is prohibitive in cost, violates HIPAA/DPDP laws, and slows down transaction blocks.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-[#4865ff]/30 text-xs text-[#080331] md:w-72 shrink-0">
                    <span className="font-bold text-[#4865ff] block mb-1">Our Solution:</span>
                    Off-chain encrypted storage on IPFS. The Polygon smart contracts only store the SHA-256 integrity hash, CID pointer, and CAEAP access control policies.
                  </div>
                </div>

                {/* Challenge 4 */}
                <div className="p-6 rounded-2xl bg-[#fdf5fb] border border-[#f098d7]/30 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 md:max-w-md">
                    <div className="text-xs font-bold text-[#a8327d] uppercase tracking-wide">Challenge #4</div>
                    <h4 className="font-bold text-slate-900 text-lg">Fitting Multimodal Models on Modest Hospital Hardware</h4>
                    <p className="text-xs sm:text-sm text-stone-600">
                      District and rural community health clinics do not possess multi-GPU clusters. We had to deliver simultaneous text synthesis and diagnostic imaging on modest single-GPU hardware.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-[#f098d7]/40 text-xs text-[#080331] md:w-72 shrink-0">
                    <span className="font-bold text-[#a8327d] block mb-1">Our Solution:</span>
                    Optimized MedGemma 4B with INT4 quantization, achieving sub-second token latency while retaining multimodal chest X-ray vision capabilities.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── 5. WHAT WE LEARNED ──────────────── */}
          {activeTab === 'learnings' && (
            <div className="p-7 sm:p-10 md:p-12 animate-in fade-in duration-300">
              <div className="max-w-3xl mb-8">
                <span className="text-xs font-semibold text-[#328a3b] uppercase tracking-wider bg-[#328a3b]/10 px-3 py-1 rounded-full">
                  Scientific Validation &amp; Key Insights
                </span>
                <h3 className="font-serif text-[28px] sm:text-[36px] text-[#080331] font-normal mt-2">
                  What We Learned
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Metric Card 1 */}
                <div className="bg-[#080331] text-white p-7 rounded-2xl shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">
                      Peer-Reviewed Research
                    </div>
                    <div className="font-serif text-3xl sm:text-4xl text-white mb-2">ICDDS'26 Accepted</div>
                    <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                      Our post-quantum security framework, combining lattice-based signatures with ephemeral CAEAP smart contract authorization, has been accepted and peer-reviewed for publication at <strong>ICDDS'26</strong>.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-emerald-300">
                    <span>Lattice Cryptography</span>
                    <span className="font-semibold">IEEE / Springer Indexed</span>
                  </div>
                </div>

                {/* Metric Card 2 */}
                <div className="bg-[#4865ff] text-white p-7 rounded-2xl shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">
                      Clinical Accuracy Benchmark
                    </div>
                    <div className="font-serif text-3xl sm:text-4xl text-white mb-2">91.7% Accuracy</div>
                    <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                      In extensive rigorous validation across <strong>227 MIMIC-IV clinical admissions</strong>, our local MedGemma 4B deployment reached a verified 91.7% concordance in diagnostic summary and organ risk stratification.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/80">
                    <span>227 MIMIC-IV Cohorts</span>
                    <span className="font-semibold">Evaluated vs Board Certified MDs</span>
                  </div>
                </div>
              </div>

              {/* Core Conceptual Lessons */}
              <div className="p-6 rounded-2xl bg-[#f8f3eb] border border-[#4d4439]/10 space-y-4">
                <h4 className="font-serif text-xl text-[#080331]">Foundational Takeaways</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-[#333333]">
                  <div className="p-4 rounded-xl bg-white border border-[#4d4439]/10">
                    <strong className="text-[#080331] block mb-1">1. Model to Data, Not Data to Model</strong>
                    Privacy and clinical AI effectiveness are not zero-sum enemies. By bringing quantized sovereign models to local hospital nodes, patient privacy remains inviolable without degrading predictive intelligence.
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-[#4d4439]/10">
                    <strong className="text-[#080331] block mb-1">2. Invisible Web3 is the Only Viable Web3</strong>
                    A blockchain healthcare product is only viable for rural and elderly citizens when the blockchain mechanics are entirely concealed beneath intuitive interfaces like WhatsApp and touch kiosks.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── 6. WHAT'S NEXT ──────────────── */}
          {activeTab === 'future' && (
            <div className="p-7 sm:p-10 md:p-12 animate-in fade-in duration-300">
              <div className="max-w-3xl mb-8">
                <span className="text-xs font-semibold text-[#7a22a3] uppercase tracking-wider bg-purple-100 text-purple-900 px-3 py-1 rounded-full">
                  Upcoming Releases &amp; Expansion
                </span>
                <h3 className="font-serif text-[28px] sm:text-[36px] text-[#080331] font-normal mt-2">
                  What's Next for MediChain AI
                </h3>
                <p className="text-sm sm:text-base text-stone-600 mt-2">
                  Scaling from OPD pilot deployments to nationwide ABDM network integration and international healthcare interoperability.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Roadmap 1 */}
                <div className="bg-[#f8f3eb] rounded-2xl p-6 border border-[#4d4439]/10 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#4865ff]/15 text-[#4865ff] flex items-center justify-center font-bold text-sm mb-4">
                      01
                    </div>
                    <h4 className="font-serif text-xl text-[#080331] mb-2">On-Device Gemma 3 &amp; Advanced OCR</h4>
                    <p className="text-xs text-[#333333] leading-relaxed">
                      Transitioning to on-device Gemma 3 models directly inside edge kiosk hardware with specialized multi-script OCR for messy cursive handwritten prescriptions across 12 Indic languages.
                    </p>
                  </div>
                  <div className="mt-5 text-[11px] font-semibold text-[#4865ff] uppercase tracking-wide">
                    Q3 2026 Target
                  </div>
                </div>

                {/* Roadmap 2 */}
                <div className="bg-[#f8f3eb] rounded-2xl p-6 border border-[#4d4439]/10 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#328a3b]/15 text-[#328a3b] flex items-center justify-center font-bold text-sm mb-4">
                      02
                    </div>
                    <h4 className="font-serif text-xl text-[#080331] mb-2">Deep HL7 / FHIR Integration</h4>
                    <p className="text-xs text-[#333333] leading-relaxed">
                      Turnkey connectors for hospital information systems (Bahmni, Epic, Cerner) and Ayushman Bharat Digital Mission (ABDM M1, M2, M3) health repository gateways.
                    </p>
                  </div>
                  <div className="mt-5 text-[11px] font-semibold text-[#328a3b] uppercase tracking-wide">
                    NRCeS Compliant
                  </div>
                </div>

                {/* Roadmap 3 */}
                <div className="bg-[#f8f3eb] rounded-2xl p-6 border border-[#4d4439]/10 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#ff6d39]/15 text-[#ff6d39] flex items-center justify-center font-bold text-sm mb-4">
                      03
                    </div>
                    <h4 className="font-serif text-xl text-[#080331] mb-2">Cross-Border Portability</h4>
                    <p className="text-xs text-[#333333] leading-relaxed">
                      Cross-border patient record portability across India, Thailand, and the USA—allowing traveling patients or medical tourists to selectively unlock verified records anywhere in the world.
                    </p>
                  </div>
                  <div className="mt-5 text-[11px] font-semibold text-[#ff6d39] uppercase tracking-wide">
                    India • Thailand • USA
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
}
