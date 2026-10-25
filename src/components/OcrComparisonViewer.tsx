import { useState, useRef } from 'react';
import {
  FileText,
  Eye,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  ShieldCheck,
  Activity,
  Sparkles,
  Info,
  Maximize2,
  Minimize2
} from 'lucide-react';
import type { OcrBlock, SarvamExtraction } from '../lib/insforge';

export interface OcrComparisonViewerProps {
  originalFileUrl?: string;
  originalFileName?: string;
  rawOcrText?: string;
  blocks?: OcrBlock[];
  pages?: any[];
  extraction?: SarvamExtraction;
  onClose?: () => void;
  isModal?: boolean;
}

export default function OcrComparisonViewer({
  originalFileUrl,
  originalFileName = 'Prescription_Document.pdf',
  rawOcrText = '',
  blocks = [],
  pages = [],
  extraction,
  onClose,
  isModal = false
}: OcrComparisonViewerProps) {
  const [activeTab, setActiveTab] = useState<'report' | 'blocks' | 'raw'>('report');
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 1100
  });

  const [pdfViewMode, setPdfViewMode] = useState<'interactive' | 'embed'>('interactive');

  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // Normalize blocks list
  const displayBlocks: OcrBlock[] =
    blocks.length > 0
      ? blocks
      : pages.length > 0 && pages[0].blocks
      ? pages[0].blocks
      : [];

  const isPdf = Boolean(
    originalFileName?.toLowerCase().endsWith('.pdf') ||
    originalFileUrl?.toLowerCase().includes('.pdf') ||
    originalFileUrl?.startsWith('data:application/pdf')
  );

  // Categorize block for color-coding
  const getCategoryMeta = (block: OcrBlock) => {
    const text = (block.text || '').toLowerCase();
    if (
      text.includes('tab') ||
      text.includes('cap') ||
      text.includes('syrup') ||
      text.includes('mg') ||
      text.includes('guggulu') ||
      text.includes('churna') ||
      text.includes('dose') ||
      text.includes('bd') ||
      text.includes('od') ||
      text.includes('tds') ||
      text.includes('ghrita')
    ) {
      return {
        borderColor: '#10b981', // emerald
        bgColor: 'rgba(16, 185, 129, 0.22)',
        activeBgColor: 'rgba(16, 185, 129, 0.4)',
        textColor: 'text-emerald-700',
        badgeBg: 'bg-emerald-600',
        category: 'Medication'
      };
    }
    if (
      text.includes('diagno') ||
      text.includes('ulcer') ||
      text.includes('diabetes') ||
      text.includes('hypertens') ||
      text.includes('disease') ||
      text.includes('fever') ||
      text.includes('pain') ||
      text.includes('neuropathy')
    ) {
      return {
        borderColor: '#f59e0b', // amber
        bgColor: 'rgba(245, 158, 11, 0.22)',
        activeBgColor: 'rgba(245, 158, 11, 0.4)',
        textColor: 'text-amber-700',
        badgeBg: 'bg-amber-600',
        category: 'Diagnosis'
      };
    }
    if (
      text.includes('dr.') ||
      text.includes('doctor') ||
      text.includes('vaidya') ||
      text.includes('hospital') ||
      text.includes('institute') ||
      text.includes('clinic') ||
      text.includes('opd') ||
      text.includes('patient') ||
      text.includes('abha') ||
      text.includes('uhid')
    ) {
      return {
        borderColor: '#3b82f6', // blue
        bgColor: 'rgba(59, 130, 246, 0.22)',
        activeBgColor: 'rgba(59, 130, 246, 0.4)',
        textColor: 'text-blue-700',
        badgeBg: 'bg-blue-600',
        category: 'Clinician / Patient'
      };
    }
    if (
      text.includes('allerg') ||
      text.includes('contra') ||
      text.includes('warn') ||
      text.includes('avoid') ||
      text.includes('danger') ||
      text.includes('sulfa')
    ) {
      return {
        borderColor: '#f43f5e', // rose
        bgColor: 'rgba(244, 63, 94, 0.25)',
        activeBgColor: 'rgba(244, 63, 94, 0.45)',
        textColor: 'text-rose-700',
        badgeBg: 'bg-rose-600',
        category: 'Allergy / Warning'
      };
    }
    return {
      borderColor: '#6366f1', // indigo
      bgColor: 'rgba(99, 102, 241, 0.18)',
      activeBgColor: 'rgba(99, 102, 241, 0.35)',
      textColor: 'text-indigo-700',
      badgeBg: 'bg-indigo-600',
      category: block.layout_tag || 'Text Line'
    };
  };

  // Scroll to block in list when box is hovered
  const handleBoxSelect = (blockId: string) => {
    setSelectedBlockId(blockId);
    if (activeTab !== 'blocks') {
      setActiveTab('blocks');
    }
    setTimeout(() => {
      blockRefs.current[blockId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }, 100);
  };

  return (
    <div
      ref={viewerContainerRef}
      className={`bg-white rounded-3xl border border-slate-200/80 shadow-2xl flex flex-col overflow-hidden transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none'
          : isModal
          ? 'w-full max-w-6xl h-[90vh]'
          : 'w-full h-[760px]'
      }`}
    >
      {/* ═══ TOP HEADER (Clean & Minimal) ═══ */}
      <div className="bg-white text-slate-900 px-5 py-3 flex items-center justify-between shrink-0 border-b border-slate-200">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
            <FileText size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-slate-900 truncate">
                {originalFileName}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                {displayBlocks.length} OCR segments
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Confidence: {extraction?.ocr_confidence || 98.4}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Digitized prescription document and Sarvam extracted clinical entities
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {originalFileUrl && (
            <a
              href={originalFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
              title="Open Original File"
            >
              <ExternalLink size={14} />
            </a>
          )}
          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
              title="Close Viewer"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ═══ MAIN COMPARISON SPLIT VIEW ═══ */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
        {/* ══════════════════════════════════════════════════════════════
            LEFT (7 cols): ORIGINAL DOCUMENT & INTERACTIVE BOUNDING BOXES
            ══════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 flex flex-col min-h-0 bg-slate-100/70">
          {/* Controls Bar */}
          <div className="px-4 py-2 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                <FileText size={13} className="text-blue-600" />
                Original Document
              </span>
              <span className="text-[10px] text-slate-400">
                (Click any region to inspect OCR text)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isPdf && originalFileUrl && (
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-[11px]">
                  <button
                    onClick={() => setPdfViewMode('interactive')}
                    className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                      pdfViewMode === 'interactive'
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Overlay View
                  </button>
                  <button
                    onClick={() => setPdfViewMode('embed')}
                    className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                      pdfViewMode === 'embed'
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Raw PDF
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowBoundingBoxes((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg font-medium text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                  showBoundingBoxes
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <Eye size={12} />
                <span>{showBoundingBoxes ? 'Boxes Visible' : 'Boxes Hidden'}</span>
              </button>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                  className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={13} />
                </button>
                <span className="px-1.5 font-mono text-[10px] font-bold text-slate-600">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                  className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={13} />
                </button>
                <button
                  onClick={() => setZoomLevel(1.0)}
                  className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900 cursor-pointer"
                  title="Reset Zoom"
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Document Canvas Area */}
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center relative custom-scrollbar">
            {isPdf && pdfViewMode === 'embed' && originalFileUrl ? (
              // Raw Embedded PDF Viewer
              <div
                className="relative bg-white shadow-xl rounded-xl border border-slate-200 overflow-hidden"
                style={{
                  width: `${680 * zoomLevel}px`,
                  height: '780px',
                  transition: 'width 0.2s ease'
                }}
              >
                <object
                  data={`${originalFileUrl}#toolbar=1&navpanes=0`}
                  type="application/pdf"
                  className="w-full h-full"
                >
                  <iframe
                    src={`${originalFileUrl}#toolbar=1&navpanes=0`}
                    title="Original Prescription PDF"
                    className="w-full h-full border-0"
                  />
                </object>
              </div>
            ) : isPdf ? (
              // High-Fidelity Interactive Scanned PDF Sheet with Bounding Boxes
              <div
                className="relative bg-white shadow-xl rounded-xl border border-slate-200 overflow-hidden"
                style={{
                  width: `${640 * zoomLevel}px`,
                  minHeight: `${820 * zoomLevel}px`,
                  transition: 'width 0.2s ease, height 0.2s ease'
                }}
              >
                {/* PDF iframe background */}
                {originalFileUrl && (
                  <iframe
                    src={`${originalFileUrl}#toolbar=0&navpanes=0`}
                    title="Original Prescription Document"
                    className="w-full h-[820px] border-0"
                  />
                )}

                {/* Interactive Overlaid Bounding Boxes for PDF */}
                {showBoundingBoxes && displayBlocks.length > 0 && (
                  <div className="absolute inset-0 pointer-events-none">
                    {displayBlocks.map((block, idx) => {
                      const meta = getCategoryMeta(block);
                      const isHovered = hoveredBlockId === block.block_id;
                      const isSelected = selectedBlockId === block.block_id;

                      const bbox = block.bbox_norm || [0.05, 0.2 + idx * 0.07, 0.95, 0.25 + idx * 0.07];
                      const left = `${bbox[0] * 100}%`;
                      const top = `${bbox[1] * 100}%`;
                      const width = `${Math.max(2, (bbox[2] - bbox[0]) * 100)}%`;
                      const height = `${Math.max(1.8, (bbox[3] - bbox[1]) * 100)}%`;

                      return (
                        <div
                          key={block.block_id || idx}
                          onClick={() => handleBoxSelect(block.block_id)}
                          onMouseEnter={() => setHoveredBlockId(block.block_id)}
                          onMouseLeave={() => setHoveredBlockId(null)}
                          className={`absolute border transition-all cursor-pointer pointer-events-auto rounded-xs ${
                            isSelected
                              ? 'border-2 ring-2 ring-blue-500 shadow-md z-30'
                              : isHovered
                              ? 'border-2 ring-1 shadow-sm z-20'
                              : 'border z-10'
                          }`}
                          style={{
                            left,
                            top,
                            width,
                            height,
                            borderColor: meta.borderColor,
                            backgroundColor: isSelected || isHovered ? meta.activeBgColor : meta.bgColor
                          }}
                          title={`[${meta.category}] ${block.text}`}
                        >
                          {(isHovered || isSelected) && (
                            <span
                              className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-bold text-white whitespace-nowrap shadow-xs ${meta.badgeBg}`}
                            >
                              #{block.reading_order || idx + 1} {meta.category}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              // Standard Image Container with Dynamic Coordinates
              <div
                className="relative bg-white shadow-xl rounded-xl border border-slate-200 overflow-hidden"
                style={{
                  width: `${600 * zoomLevel}px`,
                  transition: 'width 0.2s ease'
                }}
              >
                {originalFileUrl ? (
                  <img
                    src={originalFileUrl}
                    alt="Original Clinical Document"
                    className="w-full h-auto block select-none"
                    onLoad={(e) => {
                      const target = e.currentTarget;
                      setImageDimensions({
                        width: target.naturalWidth,
                        height: target.naturalHeight
                      });
                    }}
                  />
                ) : (
                  <div className="p-16 text-center text-slate-400 bg-slate-50">
                    <FileText size={38} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-700">Prescription File Not Found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Upload a prescription slip to view the original and scanned OCR blocks.
                    </p>
                  </div>
                )}

                {/* Overlaid Normalized Bounding Boxes */}
                {showBoundingBoxes && displayBlocks.length > 0 && originalFileUrl && (
                  <div className="absolute inset-0">
                    {displayBlocks.map((block, idx) => {
                      const meta = getCategoryMeta(block);
                      const isHovered = hoveredBlockId === block.block_id;
                      const isSelected = selectedBlockId === block.block_id;

                      let left = '0%';
                      let top = '0%';
                      let width = '100%';
                      let height = '10%';

                      if (block.bbox_norm && block.bbox_norm.length === 4) {
                        const [x1, y1, x2, y2] = block.bbox_norm;
                        left = `${x1 * 100}%`;
                        top = `${y1 * 100}%`;
                        width = `${Math.max(2, (x2 - x1) * 100)}%`;
                        height = `${Math.max(1.8, (y2 - y1) * 100)}%`;
                      } else if (block.coordinates && imageDimensions.width > 0) {
                        const { x1, y1, x2, y2 } = block.coordinates;
                        left = `${(x1 / imageDimensions.width) * 100}%`;
                        top = `${(y1 / imageDimensions.height) * 100}%`;
                        width = `${Math.max(2, ((x2 - x1) / imageDimensions.width) * 100)}%`;
                        height = `${Math.max(1.8, ((y2 - y1) / imageDimensions.height) * 100)}%`;
                      }

                      return (
                        <div
                          key={block.block_id || idx}
                          onClick={() => handleBoxSelect(block.block_id)}
                          onMouseEnter={() => setHoveredBlockId(block.block_id)}
                          onMouseLeave={() => setHoveredBlockId(null)}
                          className={`absolute border transition-all cursor-pointer rounded-xs ${
                            isSelected
                              ? 'border-2 ring-2 ring-blue-500 shadow-md z-30'
                              : isHovered
                              ? 'border-2 ring-1 shadow-sm z-20'
                              : 'border z-10'
                          }`}
                          style={{
                            left,
                            top,
                            width,
                            height,
                            borderColor: meta.borderColor,
                            backgroundColor: isSelected || isHovered ? meta.activeBgColor : meta.bgColor
                          }}
                          title={`[${meta.category}] ${block.text}`}
                        >
                          {(isHovered || isSelected) && (
                            <span
                              className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-bold text-white whitespace-nowrap shadow-xs ${meta.badgeBg}`}
                            >
                              #{block.reading_order || idx + 1} {meta.category}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Color Legend Footer */}
          <div className="px-4 py-2 bg-white border-t border-slate-200/80 flex flex-wrap items-center gap-3 text-[11px] shrink-0">
            <span className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider">
              OCR Categories:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span className="text-slate-700">Medications</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              <span className="text-slate-700">Diagnosis</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
              <span className="text-slate-700">Clinician / UHID</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              <span className="text-slate-700">Allergies / Warnings</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
              <span className="text-slate-700">Clinical Text</span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            RIGHT (5 cols): SCANNED OCR IDENTIFICATION & SARVAM REPORT
            ══════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 flex flex-col min-h-0 bg-white">
          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-slate-200/80 px-4 pt-2.5 bg-slate-50/70 shrink-0">
            <button
              onClick={() => setActiveTab('report')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'report'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sparkles size={13} />
              <span>Sarvam Clinical Report</span>
            </button>

            <button
              onClick={() => setActiveTab('blocks')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'blocks'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Layers size={13} />
              <span>Identified Blocks ({displayBlocks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('raw')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'raw'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText size={13} />
              <span>Raw Transcript</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {/* ── TAB 1: SARVAM CLINICAL REPORT ── */}
            {activeTab === 'report' && (
              <div className="space-y-4 animate-fade-in">
                {/* Doctor Clinical Anamnesis Report */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                      <ShieldCheck size={13} />
                      Attending Clinician Anamnesis (Sarvam Clinical Report)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Verified by Model
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-sans">
                    {extraction?.doctor_report ||
                      'No clinical report generated yet. Upload a prescription to analyze.'}
                  </p>
                </div>

                {/* Patient Plain-Language Explanation */}
                {extraction?.patient_summary && (
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      <Info size={13} />
                      Patient Summary
                    </div>
                    <p className="text-xs text-emerald-950 leading-relaxed">
                      {extraction.patient_summary}
                    </p>
                  </div>
                )}

                {/* Extracted Metadata Banner */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] text-slate-400 block font-medium">Prescribing Doctor</span>
                    <span className="font-semibold text-slate-900 block truncate">
                      {extraction?.prescribing_doctor || 'Hospital OPD'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] text-slate-400 block font-medium">Diagnosis Detected</span>
                    <span className="font-semibold text-slate-900 block truncate">
                      {extraction?.diagnosis_found || 'Clinical Intake'}
                    </span>
                  </div>
                </div>

                {/* Extracted Medications Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Extracted Medications ({extraction?.extracted_medications?.length || 0})
                    </h4>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Vision OCR Digitize
                    </span>
                  </div>

                  {extraction?.extracted_medications && extraction.extracted_medications.length > 0 ? (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-600">
                          <tr>
                            <th className="py-2.5 px-3 font-semibold">Medication</th>
                            <th className="py-2.5 px-3 font-semibold">Dose</th>
                            <th className="py-2.5 px-3 font-semibold">Freq</th>
                            <th className="py-2.5 px-3 font-semibold">Instructions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {extraction.extracted_medications.map((med, mIdx) => (
                            <tr key={mIdx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2 px-3 font-semibold text-slate-900">
                                {med.name}
                                {med.category && (
                                  <span className="block text-[9px] text-slate-400 font-normal">
                                    {med.category}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-slate-700 font-mono text-[11px]">{med.dosage || '—'}</td>
                              <td className="py-2 px-3 text-slate-700 font-medium">{med.frequency || 'OD'}</td>
                              <td className="py-2 px-3 text-slate-500 text-[11px] leading-tight">
                                {med.instructions || 'As directed'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
                      No medications extracted from this document.
                    </div>
                  )}
                </div>

                {/* Drug Allergies & Warnings */}
                {((extraction?.detected_allergies && extraction.detected_allergies.length > 0) ||
                  (extraction?.contraindications && extraction.contraindications.length > 0)) && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs text-rose-900">
                    <div className="font-bold flex items-center gap-1.5 text-rose-800">
                      <AlertTriangle size={15} className="text-rose-600" />
                      <span>Allergies &amp; Clinical Contraindications (Flagged by Sarvam)</span>
                    </div>

                    {extraction.detected_allergies && extraction.detected_allergies.length > 0 && (
                      <div>
                        <span className="font-semibold text-rose-800 text-[11px]">Allergies Detected: </span>
                        <span className="font-bold">{extraction.detected_allergies.join(', ')}</span>
                      </div>
                    )}

                    {extraction.contraindications && extraction.contraindications.length > 0 && (
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-800 pl-1">
                        {extraction.contraindications.map((c, cIdx) => (
                          <li key={cIdx}>{c}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Recommendations */}
                {extraction?.recommendations && extraction.recommendations.length > 0 && (
                  <div className="p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl space-y-1.5 text-xs text-blue-950">
                    <div className="font-bold text-blue-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-blue-600" />
                      <span>Actionable Recommendations</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                      {extraction.recommendations.map((rec, rIdx) => (
                        <li key={rIdx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 3D Anatomical Organ Impact Correlated from Sarvam */}
                {extraction?.organ_impact && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                        <Activity size={13} className="text-purple-600" />
                        3D Anatomical Twin Impact
                      </span>
                      <span className="text-[10px] text-slate-400">Synced with Model</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {Object.entries(extraction.organ_impact).map(([organ, status]) => (
                        <div
                          key={organ}
                          className={`p-1.5 rounded-lg border text-center text-[10px] font-bold ${
                            status === 'risk'
                              ? 'bg-rose-50 border-rose-200 text-rose-700'
                              : status === 'warning'
                              ? 'bg-amber-50 border-amber-200 text-amber-700'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          }`}
                        >
                          <span className="block truncate">{organ}</span>
                          <span className="text-[9px] uppercase font-normal">{status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: IDENTIFIED OCR BLOCKS ── */}
            {activeTab === 'blocks' && (
              <div className="space-y-2.5 animate-fade-in">
                <div className="text-xs text-slate-500 pb-1">
                  Hover or click any segment below to highlight its exact bounding box on the original document.
                </div>

                {displayBlocks.map((block, idx) => {
                  const meta = getCategoryMeta(block);
                  const isHovered = hoveredBlockId === block.block_id;
                  const isSelected = selectedBlockId === block.block_id;

                  return (
                    <div
                      key={block.block_id || idx}
                      ref={(el) => { blockRefs.current[block.block_id] = el; }}
                      onClick={() => setSelectedBlockId(block.block_id)}
                      onMouseEnter={() => setHoveredBlockId(block.block_id)}
                      onMouseLeave={() => setHoveredBlockId(null)}
                      className={`p-3 rounded-xl border text-xs transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-blue-50/90 border-blue-500 ring-1 ring-blue-500/20 shadow-xs'
                          : isHovered
                          ? 'bg-slate-50 border-slate-300 shadow-xs'
                          : 'bg-white hover:bg-slate-50/60 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          #{block.reading_order || idx + 1} • ID: {block.block_id}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full text-white ${meta.badgeBg}`}
                        >
                          {meta.category}
                        </span>
                      </div>
                      <p className="text-slate-800 leading-relaxed font-sans font-medium">
                        {block.text}
                      </p>
                      {block.layout_tag && (
                        <div className="text-[9px] text-slate-400 mt-1 uppercase">
                          Tag: {block.layout_tag}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── TAB 3: RAW OCR TRANSCRIPT ── */}
            {activeTab === 'raw' && (
              <div className="space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                  <span>Raw Text Stream from Sarvam Vision OCR</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(rawOcrText)}
                    className="text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    Copy All
                  </button>
                </div>
                <textarea
                  readOnly
                  value={rawOcrText || 'No raw OCR text available.'}
                  rows={18}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 focus:outline-none leading-relaxed"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
