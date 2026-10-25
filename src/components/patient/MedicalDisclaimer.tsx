import { Shield } from 'lucide-react';

export default function MedicalDisclaimer() {
  return (
    <div className="rounded-2xl bg-stone-100/80 border border-[#4d4439]/15 p-5 text-xs text-stone-600 leading-relaxed shadow-2xs">
      <div className="flex items-center gap-2 font-semibold text-[#080331] mb-1.5">
        <Shield size={16} className="text-[#328a3b]" />
        <span>Clinical &amp; Regulatory Disclaimer • Ayush Clinical Decision Support System</span>
      </div>
      <p className="text-[11.5px] text-stone-600">
        AyushKiosk provides AI-assisted clinical triaging, OCR transcription, and integrative Ayush recommendations adhering to CCRAS (Central Council for Research in Ayurvedic Sciences) protocols. All outputs are designed to assist registered medical practitioners and do not substitute for in-person emergency examination or formal pathological biopsy. In case of acute chest pain, uncontrolled hemorrhage, or severe hypoglycemic collapse, immediately report to the nearest emergency casualty ward.
      </p>
      <div className="mt-2.5 pt-2 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-stone-500 font-mono">
        <span>Ministry of Ayush • Government of India</span>
        <span>ABHA M1 Encrypted Gateway • DPDP Act 2023</span>
      </div>
    </div>
  );
}
