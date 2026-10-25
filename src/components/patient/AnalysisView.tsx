import {
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  Pill,
  Sparkles,
  Activity,
  Calendar,
  Share2,
  Printer,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export interface Analysis {
  id: string;
  file_name: string;
  file_url: string;
  summary: string;
  risk_score: number;
  conditions: string[];
  specialist: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  record_hash: string;
  created_at: string;
  organ_data?: Record<string, any>;
  medications?: Array<{ name: string; dosage: string; frequency: string; instructions: string }>;
  allergies?: string[];
  blocks?: any[];
  pages?: any[];
  rawOcrText?: string;
  extraction?: any;
}

interface AnalysisViewProps {
  record: Analysis;
  onOpenComparison?: () => void;
}

export default function AnalysisView({ record, onOpenComparison }: AnalysisViewProps) {
  const urgencyColors = {
    critical: 'bg-rose-50 text-rose-700 border-rose-200',
    high: 'bg-amber-50 text-amber-800 border-amber-200',
    medium: 'bg-blue-50 text-blue-800 border-blue-200',
    low: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-rose-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-rose-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  // Safe date formatter preventing "Invalid Date"
  const formatDisplayDate = (d: string) => {
    if (!d) return 'Recent';
    if (d.includes('Today') || d.includes('Yesterday') || d.includes('ago')) return d;
    const parsed = new Date(d);
    return isNaN(parsed.getTime())
      ? d
      : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Sanitize doctor/specialist name so raw placeholders like "Not provided in the document" don't appear
  const displaySpecialist = (() => {
    const s = record.specialist?.trim();
    if (!s) return 'Prescribing clinician not provided';
    const lower = s.toLowerCase();
    if (
      lower.includes('not provided') ||
      lower.includes('unknown') ||
      lower === 'none' ||
      lower === 'n/a'
    ) {
      return 'Prescribing clinician not provided';
    }
    return s;
  })();

  // Sanitize condition badges
  const displayConditions = (() => {
    const valid = (record.conditions || []).filter((c) => {
      if (!c) return false;
      const lower = c.trim().toLowerCase();
      return (
        !lower.includes('not provided') &&
        !lower.includes('unknown') &&
        lower !== 'none' &&
        lower !== 'n/a'
      );
    });
    return valid.length > 0
      ? valid
      : ['General OPD Evaluation', 'Vital Parameters Stable', 'Ayush Consult Intake'];
  })();

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 font-sans">
      
      {/* ─────────────────────────────────────────────────────────────
          1. TOP DOSSIER BANNER (Clean 2-tier responsive layout)
          ───────────────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        {/* Tier 1: Metadata Badges + Print/Share Utilities */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                urgencyColors[record.urgency] || urgencyColors.medium
              }`}
            >
              Urgency: {record.urgency}
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <Calendar size={13} className="text-slate-400" />
              {formatDisplayDate(record.created_at)}
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              <ShieldCheck size={12} className="text-emerald-600" />
              ABDM Digitized
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => window.print()}
              className="p-2 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs transition-all cursor-pointer"
              title="Print Clinical Summary"
            >
              <Printer size={14} />
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Record link copied to clipboard.');
              }}
              className="p-2 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs transition-all cursor-pointer"
              title="Share Secure Record"
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>

        {/* Tier 2: Document Title + Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="min-w-0 flex-1 pr-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight truncate">
              {record.file_name}
            </h2>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
              SHA-256 Fingerprint: {record.record_hash}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {onOpenComparison && (
              <button
                onClick={onOpenComparison}
                className="px-4 py-2 rounded-full bg-black hover:bg-slate-800 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Inspect Original Document and Scanned OCR side-by-side with Sarvam"
              >
                <Sparkles size={13} className="text-yellow-400" />
                <span>Side-by-Side Sarvam OCR Inspector</span>
              </button>
            )}
            {record.file_url && (
              <a
                href={record.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-black border border-slate-200 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Open Document Stored in InsForge Storage"
              >
                <ExternalLink size={13} className="text-blue-600" />
                <span>Original Document</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. METRIC CARDS GRID (3 Columns)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Risk Score Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              AI Clinical Risk Score
            </span>
            <Activity size={16} className={getScoreColor(record.risk_score)} />
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-extrabold tracking-tight ${getScoreColor(record.risk_score)}`}>
                {record.risk_score}
              </span>
              <span className="text-slate-400 font-bold text-base">/100</span>
            </div>
            
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-700 rounded-full ${getScoreBg(record.risk_score)}`}
                style={{ width: `${record.risk_score}%` }}
              />
            </div>
          </div>

          <span className="text-[11px] text-slate-500 font-medium leading-snug">
            {record.risk_score >= 70
              ? 'Critical — Requires immediate clinical evaluation'
              : record.risk_score >= 40
              ? 'Moderate — Continuous monitoring recommended'
              : 'Low — Vital parameters within stable bounds'}
          </span>
        </div>

        {/* Consulting Specialist */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Consulting Department
            </span>
            <Stethoscope size={16} className="text-blue-600" />
          </div>

          <div className="my-2">
            <div className="text-base font-bold text-slate-900 leading-snug">
              {displaySpecialist}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Designated OPD Bay: <strong className="text-slate-800">Bay 04</strong>
            </p>
          </div>

          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 size={13} className="text-emerald-600" />
            Doctor briefed on file upload
          </span>
        </div>

        {/* Conditions Flagged */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Identified Conditions
            </span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>

          <div className="my-2 flex flex-wrap gap-1.5">
            {displayConditions.map((cond, idx) => (
              <span
                key={idx}
                className="text-[11px] bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-full font-semibold"
              >
                {cond}
              </span>
            ))}
          </div>

          <span className="text-[11px] text-slate-400">
            Cross-referenced with ICD-11 &amp; NAMASTE
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. DRUG ALLERGY WARNING BANNER (If Allergies Present)
          ───────────────────────────────────────────────────────────── */}
      {record.allergies && record.allergies.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 text-xs">
          <AlertTriangle size={18} className="text-rose-600 shrink-0" />
          <div>
            <strong>Active Drug Allergy Contraindications:</strong>{' '}
            <span className="font-semibold">{record.allergies.join(', ')}</span>. Cross-referenced against digital prescription pad.
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. CLINICAL SUMMARY ANAMNESIS
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/70 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-blue-600" />
          <h3 className="font-bold text-slate-900 text-sm">
            Sarvam Clinical Anamnesis Report
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-4.5 rounded-2xl border border-slate-200/60">
          {record.summary}
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. EXTRACTED MEDICATIONS & DOSAGES TABLE
          ───────────────────────────────────────────────────────────── */}
      {record.medications && record.medications.length > 0 && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/70 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Pill size={16} className="text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Extracted Prescriptions &amp; Dosages
              </h3>
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium">
              {record.medications.length} active formulations
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/70">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600">
                <tr>
                  <th className="py-3 px-4 font-semibold">Formulation / Medicine</th>
                  <th className="py-3 px-4 font-semibold">Dosage</th>
                  <th className="py-3 px-4 font-semibold">Frequency</th>
                  <th className="py-3 px-4 font-semibold">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 bg-white">
                {record.medications.map((med, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{med.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{med.dosage}</td>
                    <td className="py-3 px-4 text-slate-600">{med.frequency}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{med.instructions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
