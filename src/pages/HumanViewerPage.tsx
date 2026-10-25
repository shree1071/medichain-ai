import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, Sparkles } from 'lucide-react';
import Human3DViewerModal from '../components/Human3DViewerModal';

export default function HumanViewerPage() {
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div className="human-workspace min-h-screen bg-[#f8f3eb] text-[#080331] font-sans">
      {/* Header */}
      <header className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-[#4d4439]/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-stone/80 hover:text-[#080331] bg-[#f8f3eb] hover:bg-[#ede6da] px-3 py-1.5 rounded-full transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Ayush Kiosk</span>
          </Link>
          <span className="text-stone/30">|</span>
          <span className="font-serif text-lg text-[#080331]">
            BioDigital & WebGL 3D Human Anatomy
          </span>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#4865ff] hover:bg-[#3852e6] text-white text-xs font-medium px-4 py-2 rounded-full shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Activity size={14} />
          <span>Launch Human Viewer in Popup Window</span>
        </button>
      </header>

      {/* Hero / Information Showcase */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4865ff] uppercase tracking-wider bg-[#4865ff]/10 px-3 py-1 rounded-full mb-3">
            <Sparkles size={13} />
            Clinical 3D Anatomical Tele-OPD
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#080331] font-normal leading-tight">
            Human Viewer in Popup Window
          </h1>
          <p className="text-sm text-stone/80 mt-3 leading-relaxed">
            Explore 3D human anatomy, navigate using synchronized text triggers (*Fly to Head*, *Fly to Foot*, *Rotate Left*, *Rotate Right*), and examine the clinical pathology of <strong>Diabetic Foot Ulcer (DFU)</strong> with evidence-based Ayush wound healing protocols.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#080331] hover:bg-[#1b1463] text-white text-sm font-medium px-6 py-3 rounded-full shadow-lg transition-all hover:scale-[1.02] cursor-pointer inline-flex items-center gap-2"
            >
              <Activity size={16} className="text-[#4865ff]" />
              <span>Launch 3D Popup Window Now</span>
            </button>
            <Link
              to="/dashboard"
              className="bg-white hover:bg-[#ede6da] text-[#080331] text-sm font-medium px-5 py-3 rounded-full border border-[#4d4439]/15 shadow-sm transition-all cursor-pointer"
            >
              Doctor Workstation
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#4d4439]/10 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#eef5ee] text-[#328a3b] flex items-center justify-center font-bold mb-3">
              01
            </div>
            <h3 className="font-serif text-lg text-[#080331] font-medium">
              Three.js 3D WebGL Engine
            </h3>
            <p className="text-xs text-stone/80 mt-2 leading-relaxed">
              Complete procedural human anatomical mannequin with interactive camera lerping, rotation controls, layer slicing (skin, muscle, nerve), and real-time radar pulsing on pathological sites.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#4d4439]/10 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#fbf1ec] text-[#ff6d39] flex items-center justify-center font-bold mb-3">
              02
            </div>
            <h3 className="font-serif text-lg text-[#080331] font-medium">
              Diabetic Foot Ulcer Dossier
            </h3>
            <p className="text-xs text-stone/80 mt-2 leading-relaxed">
              Comprehensive clinical case study detailing effects on skin (anhidrosis, shear stress), effects on muscles (intrinsic atrophy, claw toes), and cranial autonomic pathways.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#4d4439]/10 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#dce4fb] text-[#4865ff] flex items-center justify-center font-bold mb-3">
              03
            </div>
            <h3 className="font-serif text-lg text-[#080331] font-medium">
              Ayush Vrana Ropana Chikitsa
            </h3>
            <p className="text-xs text-stone/80 mt-2 leading-relaxed">
              Integrative evidence-based protocol with Jatyadi Taila dressings, Panchavalkala Kashaya bio-cleansing, off-loading total contact casting, and instant OPD notes synchronization.
            </p>
          </div>
        </div>
      </main>

      {/* Render the 3D Viewer Popup Modal */}
      <Human3DViewerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialFocus="foot"
      />
    </div>
  );
}
