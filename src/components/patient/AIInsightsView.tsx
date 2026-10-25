import {
  Sparkles,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

export default function AIInsightsView() {
  return (
    <div className="space-y-6 text-[#080331] animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#dce4fb]/50 to-[#fbf1ec]/50 border border-[#4865ff]/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={18} className="text-[#4865ff]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#4865ff]">Predictive Clinical AI</span>
        </div>
        <h2 className="font-serif text-2xl text-[#080331] font-normal">
          Holistic Integrative Prognosis
        </h2>
        <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
          Real-time longitudinal models cross-correlating allopathic laboratory biomarkers (HbA1c, CRP, lipid panel) with classical Ayush doshic diagnostics to predict wound healing velocity and drug safety.
        </p>
      </div>

      {/* Insight 1: Ulcer Healing Trajectory */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#4d4439]/10 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-[#328a3b]" />
            <h3 className="font-serif text-lg text-[#080331] font-normal">
              Diabetic Foot Ulcer (Wagner Grade 2) Healing Trajectory
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Projected: 28 Days to Granulation
          </span>
        </div>

        <p className="text-xs text-stone-700 leading-relaxed mb-4">
          Based on the current wound depth of <strong>3.1 mm</strong> and minimal perilesional maceration, strict adherence to <strong>total contact off-loading</strong> and <strong>Jatyadi Taila sterile dressing</strong> predicts a <strong>68% reduction in ulcer surface area</strong> over the next 14 days.
        </p>

        {/* Visual Progress Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-[#fbf1ec] border border-[#ff6d39]/20">
            <span className="text-[10px] font-bold uppercase text-[#ff6d39]">Week 1: Cleansing Phase (Shodhana)</span>
            <div className="font-semibold text-xs mt-1">Biofilm Elimination</div>
            <p className="text-[11px] text-stone-600 mt-1">
              Panchavalkala Kashaya wash reduces bacterial colonization without destroying fragile epithelial buds.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#dce4fb] border border-[#4865ff]/20">
            <span className="text-[10px] font-bold uppercase text-[#4865ff]">Week 2–3: Granulation (Ropana)</span>
            <div className="font-semibold text-xs mt-1">Vascularized Bed Synthesis</div>
            <p className="text-[11px] text-stone-600 mt-1">
              Jatyadi Taila lipids accelerate micro-capillary angiogenesis and tissue fibroblast proliferation.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#eef5ee] border border-[#328a3b]/20">
            <span className="text-[10px] font-bold uppercase text-[#328a3b]">Week 4: Epithelialization (Savarnikarana)</span>
            <div className="font-semibold text-xs mt-1">Complete Epidermal Closure</div>
            <p className="text-[11px] text-stone-600 mt-1">
              Marginal keratinocyte migration closes crater. Transition to customized preventive orthotic insoles.
            </p>
          </div>
        </div>
      </div>

      {/* Insight 2: Drug-Herb Interaction Safety Matrix */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#4d4439]/10 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={18} className="text-[#4865ff]" />
          <h3 className="font-serif text-lg text-[#080331] font-normal">
            Drug-Herb Interaction Safety Matrix
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-[#080331]">
                Metformin (Allopathic) + Vijaysar (Pterocarpus marsupium)
              </div>
              <p className="text-stone-700 text-[11px] mt-0.5">
                <strong>Status: Synergistic Benefit (Safe).</strong> Beta-cell insulin sensitization without hypoglycemia risk. Recommended to monitor fasting sugar every 72 hours.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-[#080331]">
                Pantoprazole (Proton Pump Inhibitor) + Shankh Bhasma
              </div>
              <p className="text-stone-700 text-[11px] mt-0.5">
                <strong>Status: Temporal Separation Recommended.</strong> Take Pantoprazole 30 mins before morning meal, and Shankh Bhasma after meals with honey to avoid acid neutralization antagonism.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3">
            <Zap size={16} className="text-blue-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-[#080331]">
                Curcumin 500mg BD + Antiplatelet Therapy
              </div>
              <p className="text-stone-700 text-[11px] mt-0.5">
                <strong>Status: Low Mild Anti-Aggregatory Effect.</strong> Curcumin aids tissue debridement; clinical dose approved by Bay 04 doctor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
