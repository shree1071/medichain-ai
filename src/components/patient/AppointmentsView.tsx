import React, { useState } from 'react';
import {
  Clock,
  Plus,
  X,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Phone,
  MessageSquare,
  User
} from 'lucide-react';

export interface Appointment {
  id: string;
  doctor_name: string;
  doctor_avatar?: string;
  doctor_specialty: string;
  department: string;
  bay: string;
  title: string;
  date: string; // YYYY-MM-DD
  dayNumber: number;
  month: number; // 0-indexed (2 = March, 8 = September)
  year: number;
  time: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  reason: string;
  location: string;
  phone: string;
  is_teleconsult: boolean;
  token_number?: string;
  theme?: 'salmon' | 'periwinkle' | 'default';
  secondaryPill?: string;
  hasNotificationDot?: boolean;
}

// Preset appointments matching the user's Pillio reference screenshot (March 2026) and active clinical records
const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-mar-02',
    doctor_name: 'Dr. Rameshwar Nath, BAMS',
    doctor_specialty: 'Internal Medicine & Vitals',
    department: 'General Ayush Medicine',
    bay: 'Bay 02',
    title: 'Blood pressure follow-up',
    date: '2026-03-02',
    dayNumber: 2,
    month: 2, // March
    year: 2026,
    time: '10:00-11:30',
    status: 'confirmed',
    reason: 'Blood pressure calibration and autonomic neuropathy review',
    location: 'Ayush OPD Clinic, Room 102 (Bay 02)',
    phone: '+91 98110 23546',
    is_teleconsult: false,
    token_number: 'AYUSH-12'
  },
  {
    id: 'apt-mar-06',
    doctor_name: 'Dr. Vaidya Ananya Sharma',
    doctor_specialty: 'Shalya Tantra (Wound Healing & DFU)',
    department: 'Wound Care OPD',
    bay: 'Bay 04',
    title: 'In-person visit',
    secondaryPill: 'Prescription update',
    date: '2026-03-06',
    dayNumber: 6,
    month: 2, // March
    year: 2026,
    time: '09:30-11:00',
    status: 'confirmed',
    reason: 'Plantar diabetic ulcer off-loading & wound debridement evaluation',
    location: 'City Health Clinic, 12 Green St, Room 204 (Bay 04)',
    phone: '+91 98110 23546',
    is_teleconsult: false,
    token_number: 'AYUSH-44',
    theme: 'salmon'
  },
  {
    id: 'apt-mar-08',
    doctor_name: 'Dr. Priya Kulkarni, MS',
    doctor_specialty: 'Ayush Panchakarma',
    department: 'Metabolic Detoxification',
    bay: 'Bay 05',
    title: 'In-person visit',
    date: '2026-03-08',
    dayNumber: 8,
    month: 2, // March
    year: 2026,
    time: '10:00-11:30',
    status: 'confirmed',
    reason: 'Panchavalkala Kashaya Parisheka herbal irrigation session',
    location: 'Wound Care Wellness Wing, Room 301',
    phone: '+91 94230 88219',
    is_teleconsult: false,
    hasNotificationDot: true
  },
  {
    id: 'apt-mar-14',
    doctor_name: 'Dr. Alexander Callman',
    doctor_specialty: 'Clinical Endocrinology',
    department: 'Diabetic Foot & Glycemic Control',
    bay: 'Bay 01',
    title: 'General check-up',
    secondaryPill: 'In-person visit',
    date: '2026-03-14',
    dayNumber: 14,
    month: 2, // March
    year: 2026,
    time: '11:00-12:30',
    status: 'confirmed',
    reason: 'Comprehensive glycemic stability and HbA1c review',
    location: 'City Health Clinic, 12 Green St, Room 108',
    phone: '+49 050 123 3546',
    is_teleconsult: false
  },
  {
    id: 'apt-mar-17',
    doctor_name: 'Dr. Alexander Callman',
    doctor_specialty: 'Attending Clinician & Podiatry Specialist',
    department: 'Outpatient Clinical Services',
    bay: 'Room 204',
    title: 'General check-up',
    date: '2026-03-17',
    dayNumber: 17,
    month: 2, // March
    year: 2026,
    time: '10:30-11:30',
    status: 'confirmed',
    reason: 'Wagner Grade 2 Ulceration inspection & sensory monofilament test',
    location: 'City Health Clinic, 12 Green St, Room 204',
    phone: '+49 050 123 3546',
    is_teleconsult: false,
    token_number: 'OPD-17',
    theme: 'periwinkle'
  },
  {
    id: 'apt-mar-21',
    doctor_name: 'Dr. Vaidya Ananya Sharma',
    doctor_specialty: 'Shalya Tantra (Wound Healing)',
    department: 'Wound Care OPD',
    bay: 'Bay 04',
    title: 'Planned consultation',
    date: '2026-03-21',
    dayNumber: 21,
    month: 2, // March
    year: 2026,
    time: '10:00-11:00',
    status: 'confirmed',
    reason: 'Jatyadi Taila dressing progress & granulation tissue assessment',
    location: 'Wound Care OPD, Room 204 (Bay 04)',
    phone: '+91 98110 23546',
    is_teleconsult: true
  },
  {
    id: 'apt-mar-30',
    doctor_name: 'Dr. Alexander Callman',
    doctor_specialty: 'Ayush Tele-Kiosk Specialist',
    department: 'Telemedicine Outpatient',
    bay: 'Virtual Bay',
    title: 'Video Consultation',
    date: '2026-03-30',
    dayNumber: 30,
    month: 2, // March
    year: 2026,
    time: '11:00-12:30',
    status: 'confirmed',
    reason: 'End-of-month digital wound perimeter re-scan via 3D Twin',
    location: 'Ayush Tele-Kiosk Stream Bay',
    phone: '+49 050 123 3546',
    is_teleconsult: true,
    hasNotificationDot: true
  }
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AppointmentsView() {
  // Navigation: default to March 2026 to match reference screenshot perfectly
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(2); // 2 = March

  // List of appointments
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);

  // Selected appointment for the floating popover card (default to March 17 card from screenshot!)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(
    INITIAL_APPOINTMENTS.find((a) => a.id === 'apt-mar-17') || INITIAL_APPOINTMENTS[0]
  );

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'monthly' | 'list'>('monthly');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // Booking Form State
  const [newTitle, setNewTitle] = useState('General check-up');
  const [newDoctor, setNewDoctor] = useState('Dr. Alexander Callman');
  const [newDate, setNewDate] = useState('2026-03-24');
  const [newTime, setNewTime] = useState('10:00-11:30');
  const [newReason, setNewReason] = useState('Routine clinical check-up');
  const [newIsTeleconsult, setNewIsTeleconsult] = useState(false);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Calendar matrix calculation (Monday-first grid)
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);
  const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1 < 0 ? 11 : currentMonth - 1);

  // Build grid items
  const calendarCells = [];

  // Trailing previous month days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    calendarCells.push({
      dayNumber: dayNum,
      isCurrentMonth: false,
      month: currentMonth - 1 < 0 ? 11 : currentMonth - 1,
      year: currentMonth - 1 < 0 ? currentYear - 1 : currentYear
    });
  }

  // Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    calendarCells.push({
      dayNumber: d,
      isCurrentMonth: true,
      month: currentMonth,
      year: currentYear
    });
  }

  // Next month leading days to complete grid
  const remaining = (7 - (calendarCells.length % 7)) % 7;
  for (let n = 1; n <= remaining; n++) {
    calendarCells.push({
      dayNumber: n,
      isCurrentMonth: false,
      month: currentMonth + 1 > 11 ? 0 : currentMonth + 1,
      year: currentMonth + 1 > 11 ? currentYear + 1 : currentYear
    });
  }

  // Filtered appointments
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      !searchQuery ||
      apt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateParts = newDate.split('-');
    const year = parseInt(dateParts[0]) || currentYear;
    const month = (parseInt(dateParts[1]) || 3) - 1;
    const day = parseInt(dateParts[2]) || 15;

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      doctor_name: newDoctor,
      doctor_specialty: newDoctor.includes('Callman') ? 'Clinical Endocrinology' : 'Shalya Tantra Specialist',
      department: 'Outpatient Services',
      bay: 'Room 204',
      title: newTitle,
      date: newDate,
      dayNumber: day,
      month: month,
      year: year,
      time: newTime,
      status: 'confirmed',
      reason: newReason,
      location: 'City Health Clinic, 12 Green St, Room 204',
      phone: '+49 050 123 3546',
      is_teleconsult: newIsTeleconsult,
      token_number: `OPD-${day}`,
      theme: 'default'
    };

    setAppointments((prev) => [...prev, newApt]);
    setSelectedAppointment(newApt);
    setIsBookModalOpen(false);
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in relative">
      
      {/* ─────────────────────────────────────────────────────────────
          1. TOP CONTROLS BAR (Matching Image 2: < Month Year > | Search | Filter | Monthly ▾)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Month Navigator */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            title="Previous month"
          >
            <ChevronLeft size={16} />
          </button>

          <h2 className="text-xl font-bold text-slate-900 min-w-[160px] text-center tracking-tight">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>

          <button
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            title="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Right Tools (Search, Filter, View Dropdown, Book Button) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black/5 w-32 sm:w-40 transition-all shadow-2xs"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setSearchQuery('')}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            title="Filters"
          >
            <SlidersHorizontal size={14} />
          </button>

          {/* View Dropdown (Monthly vs List) */}
          <div className="flex items-center bg-white border border-slate-200 rounded-full p-0.5 shadow-2xs text-xs font-medium">
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                viewMode === 'monthly' ? 'bg-black text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-black text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              List
            </button>
          </div>

          {/* Book Appointment CTA */}
          <button
            onClick={() => setIsBookModalOpen(true)}
            className="bg-black hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-full transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ml-1"
          >
            <Plus size={14} />
            <span>Book Visit</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MONTHLY CALENDAR GRID (Exact Layout & Visual Style of Image 2)
          ───────────────────────────────────────────────────────────── */}
      {viewMode === 'monthly' && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/70 shadow-sm relative overflow-hidden">
          
          {/* Weekday Header Row */}
          <div className="grid grid-cols-7 border-b border-slate-100 pb-3 mb-2 text-center text-xs font-medium text-slate-400">
            {WEEKDAY_NAMES.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          {/* Calendar Days Matrix (7 cols) */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarCells.map((cell, idx) => {
              const { dayNumber, isCurrentMonth, month, year } = cell;

              // Find appointments on this specific day
              const dayAppointments = filteredAppointments.filter(
                (a) =>
                  a.dayNumber === dayNumber &&
                  a.month === month &&
                  a.year === year
              );

              // Check if any appointment on this day has a special visual theme (like March 6 or 17 in Image 2)
              const hasSalmonTheme = dayAppointments.some((a) => a.theme === 'salmon');
              const hasPeriwinkleTheme = dayAppointments.some((a) => a.theme === 'periwinkle');
              const isSelectedDay = selectedAppointment?.dayNumber === dayNumber &&
                selectedAppointment?.month === month &&
                selectedAppointment?.year === year;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (dayAppointments.length > 0) {
                      setSelectedAppointment(dayAppointments[0]);
                    } else if (isCurrentMonth) {
                      setNewDate(`${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`);
                      setIsBookModalOpen(true);
                    }
                  }}
                  className={`min-h-[105px] sm:min-h-[120px] p-2 rounded-2xl transition-all relative flex flex-col justify-between cursor-pointer border ${
                    !isCurrentMonth
                      ? 'bg-slate-50/40 border-transparent text-slate-300'
                      : hasSalmonTheme
                      ? 'bg-[#f87171]/20 border-rose-300/80 shadow-xs'
                      : hasPeriwinkleTheme || isSelectedDay
                      ? 'bg-[#818cf8]/25 border-2 border-indigo-400 shadow-xs ring-2 ring-indigo-200/50'
                      : dayAppointments.length > 0
                      ? 'bg-slate-50/70 border-slate-200/70 hover:bg-slate-100/80 hover:border-slate-300'
                      : 'bg-white border-slate-100 hover:bg-slate-50/60 hover:border-slate-200'
                  }`}
                >
                  {/* Day Number and Optional Alert Dot */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        !isCurrentMonth
                          ? 'text-slate-300'
                          : hasSalmonTheme
                          ? 'text-rose-900 font-bold'
                          : hasPeriwinkleTheme
                          ? 'text-indigo-900 font-bold'
                          : 'text-slate-700'
                      }`}
                    >
                      {dayNumber}
                    </span>

                    {/* Notification dot (like on day 8 and 30 in reference image) */}
                    {dayAppointments.some((a) => a.hasNotificationDot) && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    )}
                  </div>

                  {/* Appointment Event Chips Inside the Cell */}
                  <div className="space-y-1 my-1">
                    {dayAppointments.map((apt) => {
                      if (hasSalmonTheme) {
                        return (
                          <div key={apt.id} className="space-y-1">
                            <div className="bg-white text-slate-900 px-2 py-0.5 rounded-full text-[10px] font-semibold truncate shadow-2xs flex items-center gap-1">
                              <User size={10} className="text-slate-500 shrink-0" />
                              <span className="truncate">{apt.title}</span>
                            </div>
                            {apt.secondaryPill && (
                              <div className="bg-white/95 text-slate-800 px-2 py-0.5 rounded-full text-[10px] font-medium truncate shadow-2xs flex items-center gap-1">
                                <span className="truncate">{apt.secondaryPill}</span>
                              </div>
                            )}
                          </div>
                        );
                      }

                      if (hasPeriwinkleTheme) {
                        return (
                          <div key={apt.id} className="space-y-0.5">
                            <div className="bg-white text-indigo-950 px-2 py-0.5 rounded-full text-[10px] font-bold truncate shadow-2xs flex items-center gap-1">
                              <User size={10} className="text-indigo-600 shrink-0" />
                              <span className="truncate">{apt.title}</span>
                            </div>
                            <div className="text-[10px] text-indigo-900 font-medium px-1">
                              {apt.time}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={apt.id}
                          className="bg-white text-slate-800 border border-slate-200/80 px-2 py-1 rounded-xl text-[10px] shadow-2xs"
                        >
                          <div className="font-semibold truncate flex items-center gap-1">
                            <User size={10} className="text-slate-400 shrink-0" />
                            <span className="truncate">{apt.title}</span>
                          </div>
                          <div className="text-slate-500 text-[9px] mt-0.5 font-medium truncate">
                            {apt.time}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom spacer */}
                  <div className="h-1"></div>
                </div>
              );
            })}
          </div>

          {/* ─────────────────────────────────────────────────────────
              3. FLOATING DETAIL CARD (Exact match to Image 2 popover card)
              ───────────────────────────────────────────────────────── */}
          {selectedAppointment && (
            <div className="mt-6 lg:mt-0 lg:absolute lg:bottom-6 lg:right-6 z-20 w-full lg:max-w-[340px] bg-white rounded-3xl p-5 border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-200">
              
              {/* Header: Avatar, Name, Status Badge, Close */}
              <div className="flex items-start justify-between gap-2.5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm shadow-2xs overflow-hidden">
                    {selectedAppointment.doctor_name.includes('Ananya') ? (
                      <img 
                        src="/portrait-female-pediatrician-work.webp" 
                        alt={selectedAppointment.doctor_name} 
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      selectedAppointment.doctor_name.split(' ')[1]?.charAt(0) || 'D'
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {selectedAppointment.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {selectedAppointment.doctor_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Confirmed
                  </span>
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Close preview"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Appointment Metadata with Icons */}
              <div className="space-y-2.5 my-4 text-xs text-slate-600">
                <div className="flex items-center gap-2.5">
                  <Clock size={15} className="text-slate-400 shrink-0" />
                  <span>
                    Thu, {selectedAppointment.dayNumber} {MONTH_NAMES[selectedAppointment.month]} • {selectedAppointment.time}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <MapPin size={15} className="text-slate-400 shrink-0" />
                  <span className="truncate">{selectedAppointment.location}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <Phone size={15} className="text-slate-400 shrink-0" />
                  <span>{selectedAppointment.phone}</span>
                </div>
              </div>

              {/* Action Button: Black Pill (Write a message / Join Tele-Kiosk) */}
              <div className="pt-2">
                <button
                  onClick={() => alert(`Opening secure message channel with ${selectedAppointment.doctor_name}...`)}
                  className="w-full bg-black hover:bg-slate-800 text-white text-xs font-semibold py-3 px-4 rounded-full transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare size={14} />
                  <span>Write a message</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. LIST VIEW MODE (Optional Alternative View for Patients)
          ───────────────────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-200 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-sm">
                  {apt.dayNumber}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{apt.title}</h3>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Confirmed
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{apt.doctor_name} • {apt.doctor_specialty}</p>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                    <span>{apt.date} • {apt.time}</span>
                    <span>{apt.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => alert(`Opening tele-consult with ${apt.doctor_name}...`)}
                  className="bg-black hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-full cursor-pointer"
                >
                  Write a message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. BOOK NEW APPOINTMENT MODAL
          ───────────────────────────────────────────────────────────── */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-base text-slate-900">Book OPD Visit</h3>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Consultation Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. General check-up, In-person visit"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-black/10"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Doctor &amp; Specialty</label>
                <select
                  value={newDoctor}
                  onChange={(e) => setNewDoctor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-black/10"
                >
                  <option value="Dr. Alexander Callman">Dr. Alexander Callman (Clinical Endocrinology - Room 204)</option>
                  <option value="Dr. Vaidya Ananya Sharma">Dr. Vaidya Ananya Sharma, MD (Wound Healing - Bay 04)</option>
                  <option value="Dr. Rameshwar Nath">Dr. Rameshwar Nath, BAMS (General Medicine - Bay 02)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-black/10"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Time Slot</label>
                  <select
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-black/10"
                  >
                    <option value="09:30-11:00">09:30 - 11:00 AM</option>
                    <option value="10:30-11:30">10:30 - 11:30 AM</option>
                    <option value="11:00-12:30">11:00 - 12:30 PM</option>
                    <option value="02:00-03:30">02:00 - 03:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Reason for Visit</label>
                <textarea
                  rows={2}
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Describe your symptoms or review purpose..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-black/10"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="teleconsult"
                  checked={newIsTeleconsult}
                  onChange={(e) => setNewIsTeleconsult(e.target.checked)}
                  className="rounded border-slate-300 text-black focus:ring-black"
                />
                <label htmlFor="teleconsult" className="text-xs text-slate-700 cursor-pointer">
                  Schedule as Video Tele-Consultation (Remote Kiosk Bay)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full text-xs bg-black hover:bg-slate-800 text-white font-semibold shadow-sm cursor-pointer"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
