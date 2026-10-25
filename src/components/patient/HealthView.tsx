import {
  Activity,
  Heart,
  Droplet,
  Wind,
  Flame,
  Waves,
  TrendingUp,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function HealthView() {
  const vitals = [
    {
      title: 'Blood Pressure',
      value: '128/82',
      unit: 'mmHg',
      status: 'Optimal Pre-Hypertension',
      color: 'text-[#4865ff]',
      bg: 'bg-[#4865ff]/10',
      icon: Heart
    },
    {
      title: 'Fasting Blood Sugar',
      value: '142',
      unit: 'mg/dL',
      status: 'Elevated (Target: <110)',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      icon: Droplet
    },
    {
      title: 'HbA1c Level',
      value: '7.6',
      unit: '%',
      status: 'Controlled Diabetic',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      icon: Activity
    },
    {
      title: 'Pulse Rate',
      value: '76',
      unit: 'bpm',
      status: 'Regular Sinus Rhythm',
      color: 'text-[#328a3b]',
      bg: 'bg-emerald-50',
      icon: Heart
    },
    {
      title: 'Oxygen Saturation (SpO2)',
      value: '98',
      unit: '%',
      status: 'Optimal Room Air',
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
      icon: Activity
    },
    {
      title: 'Body Mass Index (BMI)',
      value: '25.4',
      unit: 'kg/m²',
      status: 'Overweight Grade I',
      color: 'text-stone-700',
      bg: 'bg-stone-100',
      icon: TrendingUp
    }
  ];

  const doshaEquilibrium = [
    {
      name: 'Vata Dosha (Air & Ether)',
      percentage: 46,
      status: 'Aggravated (Vata Prakopa)',
      description: 'Drives peripheral neuropathy, tissue dry anhidrosis, and microcirculatory impedance in foot.',
      color: 'bg-[#4865ff]',
      icon: Wind
    },
    {
      name: 'Pitta Dosha (Fire & Water)',
      percentage: 34,
      status: 'Moderate (Sama Pitta)',
      description: 'Governs local inflammation, erythematous halo, and metabolic heat in ulcer bed.',
      color: 'bg-[#ff6d39]',
      icon: Flame
    },
    {
      name: 'Kapha Dosha (Earth & Water)',
      percentage: 20,
      status: 'Subdued (Manda Kapha)',
      description: 'Slow granulation tissue synthesis requiring Jatyadi Taila for tissue anabolic regeneration.',
      color: 'bg-[#328a3b]',
      icon: Waves
    }
  ];

  return (
    <div className="space-y-6 text-[#080331] animate-fade-in">
      {/* Vitals Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {vitals.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-3xl border border-[#4d4439]/10 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{item.title}</span>
                <div className={`w-8 h-8 rounded-xl ${item.bg} flex items-center justify-center ${item.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="my-2">
                <span className="font-serif text-3xl font-bold text-[#080331]">{item.value}</span>
                <span className="text-xs text-stone-500 font-mono ml-1.5">{item.unit}</span>
              </div>
              <span className="text-[11px] font-medium text-stone-600">{item.status}</span>
            </div>
          );
        })}
      </div>

      {/* Tridosha Equilibrium Panel */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#4d4439]/10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#ff6d39]" />
              <h3 className="font-serif text-xl text-[#080331] font-normal">Tridosha Balance (Prakriti &amp; Vikriti)</h3>
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              Computational Ayurvedic bio-energetic assessment computed from pulse anamnesis &amp; biomarkers.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-auto">
            Nadi Scan Synced
          </span>
        </div>

        <div className="space-y-5">
          {doshaEquilibrium.map((dosha, idx) => {
            const Icon = dosha.icon;
            return (
              <div key={idx} className="p-4 rounded-2xl bg-[#faf7f2] border border-[#4d4439]/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-[#080331]" />
                    <span className="font-semibold text-xs text-[#080331]">{dosha.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#080331]">{dosha.percentage}%</span>
                    <span className="text-[10px] text-stone-500 italic">({dosha.status})</span>
                  </div>
                </div>

                <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full ${dosha.color} transition-all duration-1000 rounded-full`}
                    style={{ width: `${dosha.percentage}%` }}
                  />
                </div>

                <p className="text-[11.5px] text-stone-600 leading-relaxed">{dosha.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dinacharya & Lifestyle Adherence */}
      <div className="bg-[#eef5ee] p-6 rounded-3xl border border-[#328a3b]/20 text-xs">
        <div className="flex items-center gap-2 text-sm font-bold text-[#328a3b] mb-3">
          <CheckCircle2 size={16} />
          <span>Ayush Dinacharya Adherence for Diabetic Foot Recovery</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-800 text-[11.5px]">
          <div className="bg-white/80 p-3 rounded-xl border border-[#328a3b]/15">
            <strong>Morning (Ushakala):</strong> 200ml lukewarm water + half tsp Methi (Fenugreek) powder for postprandial glucose moderation.
          </div>
          <div className="bg-white/80 p-3 rounded-xl border border-[#328a3b]/15">
            <strong>Wound Care:</strong> Cleansing with Panchavalkala Kashaya followed by sterile Jatyadi Taila dressing prior to off-loading footwear.
          </div>
          <div className="bg-white/80 p-3 rounded-xl border border-[#328a3b]/15">
            <strong>Diet (Ahara):</strong> Avoid Katu (excess chili) and Amla (sour fermented foods) to reduce Pitta inflammation.
          </div>
          <div className="bg-white/80 p-3 rounded-xl border border-[#328a3b]/15">
            <strong>Sleep (Nidra):</strong> Avoid day-sleeping (Divasvapna) which aggravates Kapha and impedes peripheral ulcer granulation.
          </div>
        </div>
      </div>
    </div>
  );
}
