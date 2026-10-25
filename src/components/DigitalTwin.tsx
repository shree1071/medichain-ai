import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Layers,
  ChevronRight,
  AlertTriangle,
  Shield,
  Activity,
  Sparkles
} from 'lucide-react';
import { useSketchfab } from '../hooks/useSketchfab';

// ─── ANATOMY MAPPING (EXACT node names from model) ───────────────
const ANATOMY_MAPPING: Record<string, string> = {
  BRAIN: 'Brain',
  HEART: 'Heart',
  LUNGS: 'Humanlungs',
  LIVER: 'Liver',
  GUT: 'Digestivesystem',
  KIDNEYS: 'Urinary_system',
  EYES: 'Eye',
  GALLBLADDER: 'Gallbladder',
  SKULL: 'Skull',
  RIBCAGE: 'Ribcage',
  SPINE: 'Spine',
  SKIN: 'HumanSkin',
  DIAPHRAGM: 'Diafragma',
};

// Layer definitions: outer → inner (nodeNames = prefixes to match)
const LAYER_ORDER = [
  { id: 'SKIN', label: 'Skin', nodeNames: ['HumanSkin', 'Shorts', 'Eyelash'] },
  { id: 'MUSCLES', label: 'Muscles', nodeNames: ['Musclespart'] },
  { id: 'CIRCULATORY', label: 'Blood Vessels', nodeNames: ['Arteriasmesh', 'Venasmesh'] },
];

const RISK_COLORS: Record<string, [number, number, number]> = {
  risk: [1.0, 0.05, 0.0],       // Bright red
  warning: [1.0, 0.5, 0.0],     // Bright orange
  safe: [0.0, 0.9, 0.4],        // Green
};

interface OrganDef {
  id: string;
  name: string;
  displayName: string;
  keywords: string[];
}

const muscleDefinitions: OrganDef[] = Object.entries(ANATOMY_MAPPING).map(([abbr, name]) => ({
  id: abbr,
  name: name,
  displayName: name,
  keywords: [name.toLowerCase(), name.split(' ')[0].toLowerCase()]
}));

interface DigitalTwinProps {
  analysisData?: any;
  recordId?: string;
}

type Status = 'safe' | 'warning' | 'risk';

interface OrganStatus {
  status: Status;
  muscleId: string;
  score: number;
  details: string;
  aiInsights: string[];
  recommendations: string[];
  markers: { name: string; value: string; status: Status }[];
  normalRange?: string;
  fromAI?: boolean;
}

// Local mock/fallback for organ deep AI analysis
async function analyzeOrgan(params: { organName: string; analysisText: any }) {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const organ = params.organName.toLowerCase();
  if (organ.includes('foot') || organ.includes('skin') || organ.includes('digest')) {
    return {
      organAnalysis: {
        status: 'risk' as Status,
        score: 82,
        details: 'Elevated localized inflammatory and microvascular stress',
        aiInsights: [
          'High shear peak loading observed on regional weight-bearing axis',
          'Autonomic anhidrosis reducing hydration elasticity',
          'Microvascular perfusion reduced due to chronic hyperglycemia'
        ],
        recommendations: [
          'Jatyadi Taila sterile dressing daily for Vrana Ropana',
          'Panchavalkala Kashaya bio-wash before dressing',
          'Total contact off-loading therapeutic footwear'
        ],
        markers: [
          { name: 'Ulcer Depth', value: '3.1 mm', status: 'risk' as Status },
          { name: 'Exudate Level', value: 'Moderate Serosanguinous', status: 'warning' as Status },
          { name: 'Perilesional Halo', value: '1.4 cm hyperkeratotic', status: 'warning' as Status },
          { name: 'Plantar Peak Pressure', value: '56 N/cm²', status: 'risk' as Status }
        ],
        normalRange: 'Plantar Peak Pressure: <35 N/cm²'
      }
    };
  }

  return {
    organAnalysis: {
      status: 'safe' as Status,
      score: 16,
      details: 'Tissue architecture and perfusion within normal clinical limits',
      aiInsights: [
        'Hemodynamic stability confirmed',
        'No focal inflammatory lesions detected on surface scan'
      ],
      recommendations: [
        'Routine periodic observation during scheduled OPD',
        'Maintain balanced Ahara & Vihara regimen'
      ],
      markers: [
        { name: 'Perfusion Index', value: '1.8', status: 'safe' as Status },
        { name: 'Cellular Hydration', value: 'Optimal', status: 'safe' as Status }
      ]
    }
  };
}

async function updateRecord(recordId: string, updates: any) {
  try {
    const stored = localStorage.getItem('ayush_patient_records');
    if (stored) {
      const records = JSON.parse(stored);
      const updated = records.map((r: any) => (r.id === recordId ? { ...r, ...updates } : r));
      localStorage.setItem('ayush_patient_records', JSON.stringify(updated));
    }
  } catch (_) {}
}

export default function DigitalTwin({ analysisData, recordId }: DigitalTwinProps) {
  const [selectedMuscle, setSelectedMuscle] = useState<OrganDef | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0);
  const [hiddenLayers, setHiddenLayers] = useState<Set<string>>(new Set());
  const [riskHighlighted, setRiskHighlighted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Initialize analyzed organs from DB/props if available
  const [analyzedOrgans, setAnalyzedOrgans] = useState<Set<string>>(
    new Set(analysisData?.organ_data ? Object.keys(analysisData.organ_data) : [])
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const {
    api,
    isReady,
    nodes,
    findNodeIdByName,
    findAllNodesByPartialName,
    highlightNode,
    highlightNodeWithColor,
    hideNode,
    showNode,
    resetMaterials,
    setMaterialTransparency,
    lastClickedNode
  } = useSketchfab('9b0b079953b840bc9a13f524b60041e4', iframeRef);

  // ─── SYSTEM STATUS WITH RICH AI ANALYSIS ─────────────────────
  const [systemStatus, setSystemStatus] = useState<Record<string, OrganStatus>>({
    Brain: {
      status: 'safe',
      muscleId: 'BRAIN',
      score: 12,
      details: 'Normal neural activity patterns',
      aiInsights: ['EEG patterns within normal range', 'No signs of neurodegeneration', 'Cognitive function markers stable'],
      recommendations: ['Continue regular sleep schedule', 'Omega-3 supplementation recommended'],
      markers: [
        { name: 'Cortisol', value: '14.2 µg/dL', status: 'safe' },
        { name: 'B12 Level', value: '450 pg/mL', status: 'safe' },
        { name: 'Homocysteine', value: '9.1 µmol/L', status: 'safe' }
      ],
      normalRange: 'Cortisol: 6-23 µg/dL'
    },
    Lungs: {
      status: 'warning',
      muscleId: 'LUNGS',
      score: 52,
      details: 'Elevated inflammatory markers in respiratory pathway',
      aiInsights: ['SpO2 trending downward (96% → 94%)', 'Mild bronchial inflammation detected', 'FEV1/FVC ratio slightly reduced'],
      recommendations: ['Pulmonary function test recommended', 'Avoid polluted environments', 'Consider inhaler prescription review'],
      markers: [
        { name: 'SpO2', value: '94%', status: 'warning' },
        { name: 'CRP', value: '4.2 mg/L', status: 'warning' },
        { name: 'FEV1', value: '78%', status: 'warning' },
        { name: 'IgE', value: '180 IU/mL', status: 'safe' }
      ],
      normalRange: 'SpO2: 95-100%'
    },
    Heart: {
      status: 'risk',
      muscleId: 'HEART',
      score: 82,
      details: 'Critical: Elevated cardiac troponin and irregular rhythm',
      aiInsights: [
        'Troponin I elevated — possible myocardial stress',
        'QTc interval prolonged (480ms)',
        'LDL cholesterol significantly above target',
        'Blood pressure consistently elevated'
      ],
      recommendations: [
        'URGENT: Cardiology consultation within 48 hours',
        'ECG monitoring recommended',
        'Start statin therapy if not contraindicated',
        'Reduce sodium intake immediately'
      ],
      markers: [
        { name: 'Troponin I', value: '0.08 ng/mL', status: 'risk' },
        { name: 'BNP', value: '450 pg/mL', status: 'risk' },
        { name: 'LDL', value: '185 mg/dL', status: 'risk' },
        { name: 'BP', value: '155/95', status: 'risk' },
        { name: 'Heart Rate', value: '92 bpm', status: 'warning' }
      ],
      normalRange: 'Troponin I: <0.04 ng/mL'
    },
    Liver: {
      status: 'warning',
      muscleId: 'LIVER',
      score: 44,
      details: 'Mild hepatic enzyme elevation',
      aiInsights: ['ALT slightly above reference range', 'Possible fatty liver grade I', 'Albumin production adequate'],
      recommendations: ['Reduce alcohol consumption', 'Liver ultrasound in 3 months', 'Mediterranean diet recommended'],
      markers: [
        { name: 'ALT', value: '52 U/L', status: 'warning' },
        { name: 'AST', value: '38 U/L', status: 'safe' },
        { name: 'GGT', value: '65 U/L', status: 'warning' },
        { name: 'Albumin', value: '4.1 g/dL', status: 'safe' }
      ],
      normalRange: 'ALT: 7-35 U/L'
    },
    Gut: {
      status: 'safe',
      muscleId: 'GUT',
      score: 15,
      details: 'Normal digestive function',
      aiInsights: ['Microbiome diversity is healthy', 'No inflammatory bowel markers', 'Glucose metabolism stable'],
      recommendations: ['Maintain fiber-rich diet', 'Continue probiotic supplementation'],
      markers: [
        { name: 'Glucose', value: '92 mg/dL', status: 'safe' },
        { name: 'HbA1c', value: '5.2%', status: 'safe' },
        { name: 'Calprotectin', value: '35 µg/g', status: 'safe' }
      ],
      normalRange: 'Fasting glucose: 70-100 mg/dL'
    },
    Kidneys: {
      status: 'safe',
      muscleId: 'KIDNEYS',
      score: 9,
      details: 'Adequate renal filtration',
      aiInsights: ['eGFR within normal range', 'No proteinuria detected', 'Electrolyte balance stable'],
      recommendations: ['Stay well hydrated', 'Annual renal panel recommended'],
      markers: [
        { name: 'Creatinine', value: '0.9 mg/dL', status: 'safe' },
        { name: 'eGFR', value: '95 mL/min', status: 'safe' },
        { name: 'BUN', value: '14 mg/dL', status: 'safe' }
      ],
      normalRange: 'eGFR: >90 mL/min'
    }
  });

  // ─── PARSE ANALYSIS DATA → RISK SCORES ─────────────────────
  useEffect(() => {
    if (!analysisData) return;
    const text = JSON.stringify(analysisData).toLowerCase();

    const evaluateRisk = (keywords: string[], organName: string): Omit<OrganStatus, 'muscleId'> => {
      const matches = keywords.filter((k) => text.includes(k));
      const base = {
        aiInsights: [] as string[],
        recommendations: [] as string[],
        markers: [] as { name: string; value: string; status: Status }[]
      };

      if (matches.length === 0) {
        return {
          ...base,
          status: 'safe',
          score: Math.floor(Math.random() * 15) + 5,
          details: 'No anomalies detected'
        };
      }

      const hasCritical = ['critical', 'high', 'severe', 'danger', 'emergency', 'abnormal', 'ulcer'].some((c) =>
        text.includes(c)
      );
      const hasModerate = ['elevated', 'borderline', 'moderate', 'mild', 'low'].some((c) => text.includes(c));

      if (hasCritical && matches.length > 0) {
        return {
          ...base,
          status: 'risk',
          score: 70 + Math.floor(Math.random() * 25),
          details: `Critical: ${matches.slice(0, 2).join(', ')} detected`,
          aiInsights: [`Critical markers detected in ${organName}`, `Keywords matched: ${matches.join(', ')}`],
          recommendations: [`Urgent medical review for ${organName}`, 'Consult specialist immediately']
        };
      }
      if (hasModerate || matches.length > 0) {
        return {
          ...base,
          status: 'warning',
          score: 35 + Math.floor(Math.random() * 30),
          details: `Monitoring: ${matches[0]} markers found`,
          aiInsights: [`Elevated markers in ${organName}`, `Tracking: ${matches.join(', ')}`],
          recommendations: [`Schedule follow-up for ${organName}`, 'Monitor changes over next 30 days']
        };
      }
      return {
        ...base,
        status: 'safe',
        score: 10 + Math.floor(Math.random() * 20),
        details: 'Within normal range'
      };
    };

    setSystemStatus((prev) => ({
      Brain: {
        ...prev['Brain'],
        ...evaluateRisk(['brain', 'head', 'mental', 'stroke', 'neuro', 'cognitive'], 'Brain'),
        muscleId: 'BRAIN'
      },
      Lungs: {
        ...prev['Lungs'],
        ...evaluateRisk(['lung', 'respiratory', 'breath', 'asthma', 'copd', 'oxygen'], 'Lungs'),
        muscleId: 'LUNGS'
      },
      Heart: {
        ...prev['Heart'],
        ...evaluateRisk(['heart', 'cardio', 'pulse', 'bp', 'hypertension', 'cholesterol'], 'Heart'),
        muscleId: 'HEART'
      },
      Liver: {
        ...prev['Liver'],
        ...evaluateRisk(['liver', 'hepatic', 'alcohol', 'fatty', 'bilirubin'], 'Liver'),
        muscleId: 'LIVER'
      },
      Gut: {
        ...prev['Gut'],
        ...evaluateRisk(['stomach', 'gut', 'digestive', 'diabetes', 'sugar', 'glucose', 'bowel', 'ulcer'], 'Gut'),
        muscleId: 'GUT'
      },
      Kidneys: {
        ...prev['Kidneys'],
        ...evaluateRisk(['kidney', 'renal', 'urine', 'creatinine'], 'Kidneys'),
        muscleId: 'KIDNEYS'
      }
    }));
  }, [analysisData]);

  // ─── AUTO-HIGHLIGHT RISK ORGANS (PRESERVES SKIN & MUSCLES) ──
  useEffect(() => {
    if (!isReady || riskHighlighted) return;
    if (Object.keys(nodes).length === 0) return;

    const riskyOrgans = Object.entries(systemStatus).filter(
      ([_, d]) => d.status === 'risk' || d.status === 'warning'
    );
    if (riskyOrgans.length === 0) return;

    // Apply bright glow to each risky organ without hiding skin or muscles
    riskyOrgans.forEach(([organName, data]) => {
      const nodeName = ANATOMY_MAPPING[data.muscleId];
      if (!nodeName) return;

      const nodeId = findNodeIdByName(nodeName);
      if (nodeId) {
        const color = RISK_COLORS[data.status];
        const emissive = data.status === 'risk' ? 2.5 : 1.5;
        highlightNodeWithColor(nodeId, color, emissive);
        console.log(`[Risk] highlight prepared: ${organName} → ${nodeName}`);
      }
    });

    setRiskHighlighted(true);
  }, [isReady, systemStatus, nodes, findNodeIdByName, highlightNodeWithColor, riskHighlighted]);

  // ─── LAYER PEELING (TRANSPARENCY + HIDE) ───────────────────
  const peelLayer = useCallback(() => {
    if (currentLayerIndex >= LAYER_ORDER.length) return;

    const layer = LAYER_ORDER[currentLayerIndex];
    let totalHidden = 0;

    layer.nodeNames.forEach((prefix) => {
      setMaterialTransparency(prefix, 0.05);

      const layerNodes = findAllNodesByPartialName(prefix);
      layerNodes.forEach((n) => {
        hideNode(n.instanceID);
        if (n.children) n.children.forEach((child) => hideNode(child.instanceID));
      });
      totalHidden += layerNodes.length;
    });

    setHiddenLayers((prev) => new Set([...prev, layer.id]));
    setCurrentLayerIndex((prev) => prev + 1);
    console.log(`[Peel] layer: ${layer.label} (${totalHidden} nodes hidden)`);
  }, [currentLayerIndex, findAllNodesByPartialName, hideNode, setMaterialTransparency]);

  const restoreAllLayers = useCallback(() => {
    LAYER_ORDER.forEach((layer) => {
      layer.nodeNames.forEach((prefix) => {
        const layerNodes = findAllNodesByPartialName(prefix);
        layerNodes.forEach((n) => {
          showNode(n.instanceID);
          if (n.children) n.children.forEach((child) => showNode(child.instanceID));
        });
      });
    });
    setHiddenLayers(new Set());
    setCurrentLayerIndex(0);
    resetMaterials();
    setRiskHighlighted(false);
  }, [findAllNodesByPartialName, showNode, resetMaterials]);

  // ─── CLICK HANDLERS ──────────────────────────────────────────
  const handleOrganClick = useCallback(
    (muscleId: string) => {
      const nodeName = ANATOMY_MAPPING[muscleId];
      if (!nodeName) return;

      const nodeId = findNodeIdByName(nodeName);
      if (nodeId) {
        highlightNode(nodeId);
        const def = muscleDefinitions.find((m) => m.id === muscleId);
        if (def) {
          setSelectedMuscle(def);
          setIsPanelOpen(true);
        }
      }
    },
    [findNodeIdByName, highlightNode]
  );

  const handleSystemClick = useCallback(
    (organ: string) => {
      const data = systemStatus[organ];
      if (data) {
        handleOrganClick(data.muscleId);

        if (['HEART', 'LUNGS', 'LIVER', 'GUT', 'KIDNEYS'].includes(data.muscleId) && currentLayerIndex === 0) {
          peelLayer();
        }
      }
    },
    [systemStatus, handleOrganClick, currentLayerIndex, peelLayer]
  );

  useEffect(() => {
    if (!lastClickedNode || !nodes[lastClickedNode]) return;
    const node = nodes[lastClickedNode];
    const found = muscleDefinitions.find(
      (m) => node.name?.includes(m.name) || m.keywords.some((k) => node.name?.toLowerCase().includes(k))
    );
    if (found) {
      setSelectedMuscle(found);
      setIsPanelOpen(true);
    }
  }, [lastClickedNode, nodes]);

  const resetView = () => {
    if (api) api.recenterCamera();
    setSelectedMuscle(null);
    restoreAllLayers();
  };

  // ─── AI ORGAN ANALYSIS ───────────────────────────────────────
  useEffect(() => {
    if (!selectedMuscle || !analysisData) return;

    const organName = selectedMuscle.displayName;

    const fetchAnalysis = async () => {
      if (analyzedOrgans.has(organName)) {
        setIsAnalyzing(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setIsAnalyzing(false);
        return;
      }

      setIsAnalyzing(true);
      try {
        const data = await analyzeOrgan({
          organName,
          analysisText: analysisData
        });

        if (data?.organAnalysis) {
          const newAnalysis = data.organAnalysis;
          setSystemStatus((prev) => {
            const updatedStatus = {
              ...prev,
              [organName]: {
                ...prev[organName],
                ...newAnalysis,
                fromAI: true
              }
            };

            if (recordId) {
              const organDataToSave = Object.keys(updatedStatus)
                .filter((key) => updatedStatus[key].fromAI)
                .reduce((obj, key) => {
                  (obj as any)[key] = updatedStatus[key];
                  return obj;
                }, {});

              updateRecord(recordId, { organ_data: organDataToSave }).catch((error) => {
                console.error('Failed to save organ data:', error);
              });
            }

            return updatedStatus;
          });
          setAnalyzedOrgans((prev) => new Set(prev).add(organName));
        }
      } catch (err) {
        console.error('Failed to analyze organ:', err);
        setAnalyzedOrgans((prev) => new Set(prev).add(organName));
      } finally {
        setIsAnalyzing(false);
      }
    };

    fetchAnalysis();
  }, [selectedMuscle, analysisData, analyzedOrgans, recordId]);

  // ─── FULLSCREEN HANDLING ─────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // ─── COMPUTED VALUES ─────────────────────────────────────────
  const riskCount = Object.values(systemStatus).filter((d) => d.status === 'risk').length;
  const warningCount = Object.values(systemStatus).filter((d) => d.status === 'warning').length;
  const overallScore = Math.round(
    Object.values(systemStatus).reduce((sum, d) => sum + d.score, 0) / Object.keys(systemStatus).length
  );

  const getStatusColor = (status: Status) => {
    if (status === 'risk') return 'text-rose-600';
    if (status === 'warning') return 'text-amber-600';
    return 'text-emerald-600';
  };

  const getStatusBg = (status: Status) => {
    if (status === 'risk') return 'bg-rose-50/80 border-rose-200 text-rose-900';
    if (status === 'warning') return 'bg-amber-50/80 border-amber-200 text-amber-900';
    return 'bg-emerald-50/80 border-emerald-200 text-emerald-900';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 70) return 'bg-rose-500';
    if (score >= 35) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-white overflow-hidden border border-slate-200/80 shadow-sm flex flex-col md:flex-row transition-all duration-300 ${
        isFullscreen ? 'w-full h-full rounded-none border-0' : 'h-[700px] w-full rounded-2xl'
      }`}
    >
      {/* ═══ LEFT: 3D Viewer ═══ */}
      <div className={`relative flex-1 h-full min-h-[400px] bg-white ${!isPanelOpen ? 'md:w-full' : ''}`}>
        {/* Top Bar */}
        <div className="absolute top-3 left-3 right-20 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200 px-3 py-1 rounded-xl shadow-xs">
            <h3 className="text-slate-800 font-sans text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>3D Digital Twin</span>
            </h3>
          </div>

          {/* Risk Summary Badge */}
          {(riskCount > 0 || warningCount > 0) && (
            <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-rose-200 px-2.5 py-1 rounded-xl shadow-xs">
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-rose-600" />
                <span className="text-rose-700 font-sans text-[11px] font-semibold">
                  {riskCount > 0 ? `${riskCount} Critical` : ''}
                  {riskCount > 0 && warningCount > 0 ? ' · ' : ''}
                  {warningCount > 0 ? `${warningCount} Warning` : ''}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="absolute top-3 right-3 z-30 flex gap-1.5">
          <button
            onClick={toggleFullscreen}
            className="bg-white/90 hover:bg-slate-100 border border-slate-200 text-slate-700 p-2 rounded-xl transition-all shadow-xs cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="bg-white/90 hover:bg-slate-100 border border-slate-200 text-slate-700 p-2 rounded-xl transition-all shadow-xs cursor-pointer"
            title="Toggle Panel"
          >
            <ChevronRight size={14} className={`transition-transform ${isPanelOpen ? 'rotate-0' : 'rotate-180'}`} />
          </button>
        </div>

        {/* Layer Peel Controls */}
        <div className="digital-twin-layer-controls absolute top-16 left-3 z-20 flex flex-col gap-1.5">
          <button
            onClick={peelLayer}
            disabled={currentLayerIndex >= LAYER_ORDER.length}
            className="group flex items-center gap-2 bg-white/95 backdrop-blur-md border border-slate-200 hover:border-blue-500 px-3.5 py-2 rounded-xl transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-slate-800"
          >
            <Layers size={14} className="text-blue-600" />
            <span className="font-sans text-xs font-semibold">
              {currentLayerIndex >= LAYER_ORDER.length ? 'All Layers Peeled' : `Peel: ${LAYER_ORDER[currentLayerIndex]?.label}`}
            </span>
          </button>

          {currentLayerIndex > 0 && (
            <button
              onClick={restoreAllLayers}
              className="flex items-center gap-2 bg-white/95 backdrop-blur-md border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer text-slate-600"
            >
              <RotateCcw size={12} className="text-slate-500" />
              <span className="font-sans text-[11px] font-medium">Restore Layers</span>
            </button>
          )}

          {/* Layer Indicator */}
          <div className="flex gap-2.5 pl-1 pt-0.5">
            {LAYER_ORDER.map((layer) => (
              <div key={layer.id} className="flex items-center gap-1" title={layer.label}>
                <div
                  className={`w-2 h-2 rounded-full transition-all ${
                    hiddenLayers.has(layer.id) ? 'bg-slate-300' : 'bg-blue-600'
                  }`}
                />
                <span className={`text-[10px] font-medium ${hiddenLayers.has(layer.id) ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {layer.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reset View Button */}
        <div className="absolute bottom-3 right-3 z-20">
          <button
            onClick={resetView}
            className="bg-white/90 hover:bg-slate-100 border border-slate-200 text-slate-700 p-2 rounded-xl transition-all shadow-xs cursor-pointer"
            title="Reset View"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Iframe */}
        <div className="w-full h-full bg-white">
          <iframe
            ref={iframeRef}
            id="sketchfab-iframe"
            title="Digital Body Scanner"
            allow="autoplay; fullscreen; xr-spatial-tracking"
            className="w-full h-full border-0 bg-white"
            style={{ background: '#ffffff' }}
          />
        </div>

        {/* Loading Overlay */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-10 pointer-events-none transition-opacity duration-300">
            <div className="text-center p-4">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <div className="text-blue-600 font-sans text-xs font-semibold animate-pulse">
                Loading 3D Anatomical Digital Twin...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ RIGHT: Analysis Panel ═══ */}
      <div
        className={`bg-slate-50/70 border-t md:border-t-0 md:border-l border-slate-200/80 overflow-hidden transition-all duration-300 flex flex-col ${
          isPanelOpen ? 'w-full md:w-96 opacity-100' : 'w-0 opacity-0 p-0 border-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {/* Overall Risk Header */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-blue-600" />
                <span className="font-sans text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Organ Risk Summary
                </span>
              </div>
              <div
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  overallScore >= 50
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : overallScore >= 25
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {overallScore}% Stress
              </div>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${getScoreBarColor(overallScore)}`}
                style={{ width: `${overallScore}%` }}
              />
            </div>
          </div>

          {selectedMuscle ? (
            /* ─── Selected Organ Detail with AI Analysis ─── */
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <h2 className="text-base font-bold font-sans text-slate-900 uppercase tracking-tight">
                  {selectedMuscle.displayName}
                </h2>
                <button
                  onClick={() => setSelectedMuscle(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
                >
                  ×
                </button>
              </div>

              {(() => {
                const organEntry = Object.entries(systemStatus).find(([_, d]) => d.muscleId === selectedMuscle.id);
                if (!organEntry) return <div className="text-slate-400 text-xs">No data available</div>;
                const [, data] = organEntry;
                return (
                  <div className="relative space-y-3">
                    {/* AI Loading State Overlay */}
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-xs z-10 flex flex-col items-center justify-center rounded-xl border border-blue-200 overflow-hidden">
                        <Sparkles className="text-blue-600 w-7 h-7 mb-2 animate-spin" />
                        <h3 className="text-blue-600 font-sans text-xs font-bold uppercase tracking-wider">
                          Analyzing Biometrics
                        </h3>
                        <p className="text-slate-500 text-[10px]">Deep scanning {selectedMuscle.displayName}...</p>
                      </div>
                    )}

                    {/* Risk Score Card */}
                    <div className={`p-3.5 rounded-xl border ${getStatusBg(data.status)} shadow-xs`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${getStatusColor(data.status)}`}>
                          {data.status === 'risk'
                            ? 'Critical Attention'
                            : data.status === 'warning'
                            ? 'Elevated Attention'
                            : 'Normal Condition'}
                        </span>
                        <span className={`text-xl font-bold font-mono ${getStatusColor(data.status)}`}>
                          {data.score}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-200/60 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${getScoreBarColor(data.score)}`}
                          style={{ width: `${data.score}%` }}
                        />
                      </div>
                      <div className="text-slate-600 text-xs leading-relaxed">{data.details}</div>
                    </div>

                    {/* AI Insights */}
                    {data.aiInsights && data.aiInsights.length > 0 && (
                      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Activity size={13} className="text-blue-600" />
                          <span className="text-blue-900 font-sans text-xs font-bold uppercase tracking-wider">
                            Clinical AI Anamnesis
                          </span>
                        </div>
                        <ul className="space-y-1.5">
                          {data.aiInsights.map((insight, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                              <span className="text-blue-500 mt-0.5 text-[8px]">●</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Biomarkers Table */}
                    {data.markers && data.markers.length > 0 && (
                      <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-xs">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Activity size={13} className="text-purple-600" />
                          <span className="text-purple-900 font-sans text-xs font-bold uppercase tracking-wider">
                            Correlated Biomarkers
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {data.markers.map((marker, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"
                            >
                              <span className="text-slate-600 text-xs">{marker.name}</span>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-mono font-bold ${
                                    marker.status === 'risk'
                                      ? 'text-rose-600'
                                      : marker.status === 'warning'
                                      ? 'text-amber-600'
                                      : 'text-emerald-600'
                                  }`}
                                >
                                  {marker.value}
                                </span>
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    marker.status === 'risk'
                                      ? 'bg-rose-500'
                                      : marker.status === 'warning'
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  }`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        {data.normalRange && (
                          <div className="mt-2 text-[10px] text-slate-400 font-mono">Ref: {data.normalRange}</div>
                        )}
                      </div>
                    )}

                    {/* Recommendations */}
                    {data.recommendations && data.recommendations.length > 0 && (
                      <div
                        className={`p-3 rounded-xl border ${
                          data.status === 'risk'
                            ? 'bg-rose-50/60 border-rose-200/80'
                            : data.status === 'warning'
                            ? 'bg-amber-50/60 border-amber-200/80'
                            : 'bg-emerald-50/60 border-emerald-200/80'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <AlertTriangle size={13} className={data.status === 'risk' ? 'text-rose-600' : 'text-amber-600'} />
                          <span
                            className={`font-sans text-xs font-bold uppercase tracking-wider ${
                              data.status === 'risk'
                                ? 'text-rose-800'
                                : data.status === 'warning'
                                ? 'text-amber-800'
                                : 'text-emerald-800'
                            }`}
                          >
                            {data.status === 'risk' ? 'Urgent Ayush Protocol' : 'Clinical Directives'}
                          </span>
                        </div>
                        <ul className="space-y-1.5">
                          {data.recommendations.map((rec, i) => (
                            <li
                              key={i}
                              className={`flex items-start gap-2 text-xs leading-relaxed ${
                                data.status === 'risk' ? 'text-rose-900' : 'text-slate-700'
                              }`}
                            >
                              <span className="mt-0.5 text-blue-500 text-[9px]">▸</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-200/80">
                      {data.fromAI ? 'MediKiosk AI Mapped' : '3D Node Status'} • {ANATOMY_MAPPING[selectedMuscle.id] || 'N/A'}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* ─── System Overview ─── */
            <div className="space-y-2.5">
              <div className="flex items-center justify-between mb-1 px-1">
                <div className="flex items-center gap-1.5">
                  <Shield size={14} className="text-blue-600" />
                  <span className="text-slate-700 font-sans text-xs font-bold uppercase tracking-wider">
                    Organ Status Matrix
                  </span>
                </div>
                <span className="text-emerald-600 text-[10px] font-bold">● LIVE 3D</span>
              </div>

              {Object.entries(systemStatus).map(([organ, data]) => (
                <div
                  key={organ}
                  onClick={() => handleSystemClick(organ)}
                  className={`p-3 rounded-xl border bg-white cursor-pointer transition-all duration-200 hover:shadow-sm hover:border-blue-400 ${
                    data.status === 'risk'
                      ? 'border-rose-300'
                      : data.status === 'warning'
                      ? 'border-amber-300'
                      : 'border-slate-200/80'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          data.status === 'safe'
                            ? 'bg-emerald-500'
                            : data.status === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-rose-500 animate-ping'
                        }`}
                      />
                      <span className="text-xs font-bold text-slate-900">{organ}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold ${getStatusColor(data.status)}`}>{data.score}%</span>
                      {data.status === 'risk' && <AlertTriangle size={12} className="text-rose-500" />}
                    </div>
                  </div>

                  {/* Risk Bar */}
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-1">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${getScoreBarColor(data.score)}`}
                      style={{ width: `${data.score}%` }}
                    />
                  </div>

                  <div className="text-[11px] text-slate-500 truncate">{data.details}</div>
                </div>
              ))}

              <div className="text-[10px] text-slate-400 text-center mt-3 border-t border-slate-200/80 pt-2">
                Click organ node to orbit 3D view · Peel outer layers to reveal internal organs
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
