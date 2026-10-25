import { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Eye,
  UserCheck,
  Clock
} from 'lucide-react';

interface AccessManagerViewProps {
  patientAbha?: string;
}

export default function AccessManagerView({
  patientAbha = '91-3829-5512'
}: AccessManagerViewProps) {
  const [doctorAccess, setDoctorAccess] = useState(true);
  const [kioskAccess, setKioskAccess] = useState(true);
  const [emergencyAccess, setEmergencyAccess] = useState(true);

  const [logs] = useState([
    {
      id: 'l1',
      actor: 'Dr. Vaidya Ananya Sharma (Bay 04)',
      role: 'Presiding OPD Doctor',
      purpose: 'OPD Clinical Consultation & Wound Tagging',
      time: 'Today, 09:12 AM',
      status: 'Granted'
    },
    {
      id: 'l2',
      actor: 'Ayush Kiosk Scanner Terminal #04',
      role: 'Automated Diagnostic Kiosk',
      purpose: 'Prescription OCR Digitization & PII Scrubbing',
      time: 'Today, 08:58 AM',
      status: 'Granted'
    },
    {
      id: 'l3',
      actor: 'National Ayush Registry (ABHA Gateway)',
      role: 'Ayushman Bharat Health Account',
      purpose: 'EHR Token Verification & Integrity Hash Check',
      time: 'Sep 04, 2026, 06:30 PM',
      status: 'Granted'
    }
  ]);

  return (
    <div className="space-y-6 text-[#080331] animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white border border-[#4d4439]/10 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              ABHA M1 Consent Architecture
            </span>
            <span className="text-xs text-stone-400">•</span>
            <span className="text-xs text-stone-600 font-mono font-semibold">
              ABHA ID: {patientAbha}
            </span>
          </div>
          <h2 className="font-serif text-2xl text-[#080331] font-normal">Health Records Access &amp; Consent Manager</h2>
          <p className="text-xs text-stone-600 mt-1">
            Control which physicians and clinical bays can view your medical records and prescriptions.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <ShieldCheck size={16} />
          <span>DPDP Act 2023 Compliant</span>
        </div>
      </div>

      {/* Permissions Toggles Grid */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#4d4439]/10 shadow-sm space-y-4">
        <h3 className="font-serif text-lg text-[#080331] font-normal mb-2">Active Consent Permissions</h3>

        {/* Permission 1 */}
        <div className="p-4 rounded-2xl bg-[#faf7f2] border border-[#4d4439]/10 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#4865ff] shadow-xs shrink-0">
              <UserCheck size={18} />
            </div>
            <div>
              <div className="font-semibold text-xs text-[#080331]">
                Presiding Doctor Access (Dr. Vaidya Ananya Sharma, Bay 04)
              </div>
              <p className="text-[11px] text-stone-600 mt-0.5">
                Allows reading uploaded prescriptions, lab reports, and tagging 3D anatomical lesions during OPD consult.
              </p>
            </div>
          </div>
          <button
            onClick={() => setDoctorAccess(!doctorAccess)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              doctorAccess
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-stone-200 text-stone-600'
            }`}
          >
            {doctorAccess ? 'Allowed' : 'Revoked'}
          </button>
        </div>

        {/* Permission 2 */}
        <div className="p-4 rounded-2xl bg-[#faf7f2] border border-[#4d4439]/10 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#328a3b] shadow-xs shrink-0">
              <Eye size={18} />
            </div>
            <div>
              <div className="font-semibold text-xs text-[#080331]">
                Ayush Kiosk Local OCR &amp; Vitals Terminal Access
              </div>
              <p className="text-[11px] text-stone-600 mt-0.5">
                Permits the local terminal to perform on-device OCR transcription and PII redaction.
              </p>
            </div>
          </div>
          <button
            onClick={() => setKioskAccess(!kioskAccess)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              kioskAccess
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-stone-200 text-stone-600'
            }`}
          >
            {kioskAccess ? 'Allowed' : 'Revoked'}
          </button>
        </div>

        {/* Permission 3 */}
        <div className="p-4 rounded-2xl bg-[#faf7f2] border border-[#4d4439]/10 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#ff6d39] shadow-xs shrink-0">
              <Lock size={18} />
            </div>
            <div>
              <div className="font-semibold text-xs text-[#080331]">
                Emergency Critical Care Break-Glass Access
              </div>
              <p className="text-[11px] text-stone-600 mt-0.5">
                Enables verified emergency trauma clinicians to view severe drug allergies (e.g. Sulfa drugs) if patient is unresponsive.
              </p>
            </div>
          </div>
          <button
            onClick={() => setEmergencyAccess(!emergencyAccess)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              emergencyAccess
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-stone-200 text-stone-600'
            }`}
          >
            {emergencyAccess ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#4d4439]/10 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-[#4865ff]" />
          <h3 className="font-serif text-lg text-[#080331] font-normal">Recent Record Access Audit Trail</h3>
        </div>

        <div className="space-y-2.5">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-2xl bg-[#faf7f2] border border-[#4d4439]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
            >
              <div>
                <div className="font-semibold text-[#080331]">{log.actor}</div>
                <div className="text-[11px] text-stone-500">{log.role} • Purpose: {log.purpose}</div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-[10px] font-mono text-stone-500">{log.time}</span>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {log.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
