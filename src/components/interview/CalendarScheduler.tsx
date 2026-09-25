import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Globe, 
  ShieldCheck, 
  AlertCircle, 
  Download, 
  ExternalLink,
  CalendarCheck,
  RefreshCw,
  XCircle,
  Sparkles,
  Info
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface CalendarSchedulerProps {
  candidate: any;
  session?: any;
  onSlotBooked?: (schedule: any) => void;
  onBack?: () => void;
}

interface SlotItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  displayTime: string;
  period: 'morning' | 'afternoon' | 'evening';
  durationMinutes: number;
  isAvailable: boolean;
  roundType: string;
}

interface DayItem {
  date: string;
  dayOfWeek: number;
  dayName: string;
  formattedDate: string;
  availableCount: number;
  totalCount: number;
}

const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London, Edinburgh (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris, Berlin, Amsterdam (CET)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore, Hong Kong (SGT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney, Melbourne (AEST)' },
];

const ROUND_TYPES = [
  { id: 'ai_technical', title: 'AI Technical Assessment', duration: '45 mins', desc: 'Real-time adaptive technical, coding & architecture inquiry.' },
  { id: 'system_architecture', title: 'System Architecture & Data', duration: '45 mins', desc: 'High-throughput architecture trade-offs & database modeling.' },
  { id: 'hr_behavioral', title: 'Leadership & Behavioral Round', duration: '45 mins', desc: 'STAR methodology evaluation with HR evaluation engine.' },
];

export default function CalendarScheduler({ candidate, session, onSlotBooked, onBack }: CalendarSchedulerProps) {
  const { addToast } = useToast();

  // Detect user local timezone or fallback to UTC
  const detectedTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

  const [selectedTz, setSelectedTz] = useState(detectedTz);
  const [selectedRound, setSelectedRound] = useState('ai_technical');
  const [notes, setNotes] = useState('');
  
  // Calendar Navigation
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);

  // Data states
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [cancellingLoading, setCancellingLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<SlotItem[]>([]);
  const [daysSummary, setDaysSummary] = useState<DayItem[]>([]);
  const [activeBooking, setActiveBooking] = useState<any | null>(null);
  const [bookedConfirmation, setBookedConfirmation] = useState<{ schedule: any; icsContent?: string } | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Fetch candidate's existing schedule on mount
  useEffect(() => {
    fetchCandidateSchedule();
  }, [candidate?.id]);

  // Fetch slots whenever timezone or roundType changes
  useEffect(() => {
    fetchSlots();
  }, [selectedTz, selectedRound]);

  const fetchCandidateSchedule = async () => {
    try {
      const token = localStorage.getItem('ravengard_uid') || candidate?.id;
      const res = await fetch(`/api/candidate/scheduling/my-schedule?candidateId=${encodeURIComponent(candidate?.id || '')}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const active = (data.schedules || []).find(
          (s: any) => s.status === 'confirmed' && new Date(s.scheduledAt) > new Date()
        );
        setActiveBooking(active || null);
      }
    } catch (err) {
      console.warn('Could not fetch existing schedule', err);
    }
  };

  const fetchSlots = async () => {
    setLoadingSlots(true);
    setBookingError(null);
    try {
      const token = localStorage.getItem('ravengard_uid') || candidate?.id;
      const res = await fetch(
        `/api/candidate/scheduling/slots?days=21&timezone=${encodeURIComponent(selectedTz)}&roundType=${encodeURIComponent(selectedRound)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (res.ok) {
        const data = await res.json();
        setAvailableSlots(data.slots || []);
        setDaysSummary(data.days || []);

        // Default to first day with available slots if no date is selected
        if (!selectedDateStr && data.days?.length > 0) {
          const firstAvailableDay = data.days.find((d: DayItem) => d.availableCount > 0);
          if (firstAvailableDay) {
            setSelectedDateStr(firstAvailableDay.date);
          } else {
            setSelectedDateStr(data.days[0].date);
          }
        }
      } else {
        throw new Error('Failed to load slots');
      }
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Failed to retrieve available interview slots.');
    } finally {
      setLoadingSlots(false);
    }
  };

  // Calendar matrix calculation for current month
  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{
      date: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isPast: boolean;
      isWeekend: boolean;
      availableCount: number;
    }> = [];

    const todayStr = new Date().toISOString().split('T')[0];

    // Padding for days before start of month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({
        date: '',
        dayNumber: 0,
        isCurrentMonth: false,
        isToday: false,
        isPast: true,
        isWeekend: false,
        availableCount: 0,
      });
    }

    // Days in current month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = dateStr === todayStr;
      const isPast = new Date(d.setHours(23, 59, 59, 999)) < new Date();

      const daySummary = daysSummary.find((s) => s.date === dateStr);
      const availableCount = daySummary ? daySummary.availableCount : 0;

      days.push({
        date: dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday,
        isPast,
        isWeekend,
        availableCount,
      });
    }

    return days;
  }, [currentMonthDate, daysSummary]);

  // Slots for the currently selected date
  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDateStr) return [];
    return availableSlots.filter((s) => s.date === selectedDateStr);
  }, [selectedDateStr, availableSlots]);

  const handlePrevMonth = () => {
    const now = new Date();
    const newMonth = new Date(currentMonthDate);
    newMonth.setMonth(newMonth.getMonth() - 1);
    // Don't navigate to past months
    if (newMonth.getFullYear() < now.getFullYear() || (newMonth.getFullYear() === now.getFullYear() && newMonth.getMonth() < now.getMonth())) {
      return;
    }
    setCurrentMonthDate(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonthDate);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonthDate(newMonth);
  };

  const handleSelectSlot = (slot: SlotItem) => {
    if (!slot.isAvailable) return;
    setSelectedSlot(slot);
    setBookingError(null);
  };

  const handleBookSlot = async () => {
    if (!selectedSlot) return;

    setBookingLoading(true);
    setBookingError(null);

    try {
      const token = localStorage.getItem('ravengard_uid') || candidate?.id;
      const res = await fetch('/api/candidate/scheduling/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          candidateId: candidate?.id,
          sessionId: session?.id,
          scheduledAt: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          timezone: selectedTz,
          roundType: selectedRound,
          notes: notes.trim(),
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        addToast('success', 'Interview slot successfully reserved!');
        setBookedConfirmation({
          schedule: data.schedule,
          icsContent: data.icsContent
        });
        setActiveBooking(data.schedule);
        if (onSlotBooked) {
          onSlotBooked(data.schedule);
        }
        // Refresh slots in background
        fetchSlots();
      } else {
        setBookingError(data.error || 'Failed to reserve slot. It may have just been claimed.');
        addToast('error', data.error || 'Failed to book slot.');
      }
    } catch (err: any) {
      console.error(err);
      setBookingError('Network error while reserving slot.');
      addToast('error', 'Network error.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!activeBooking) return;
    if (!window.confirm('Are you sure you want to cancel this scheduled interview? The slot will be released.')) {
      return;
    }

    setCancellingLoading(true);
    try {
      const token = localStorage.getItem('ravengard_uid') || candidate?.id;
      const res = await fetch('/api/candidate/scheduling/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          scheduleId: activeBooking.id,
          reason: 'Candidate requested cancellation via scheduling portal.'
        })
      });

      if (res.ok) {
        addToast('info', 'Interview appointment cancelled.');
        setActiveBooking(null);
        setBookedConfirmation(null);
        fetchSlots();
      } else {
        const data = await res.json();
        addToast('error', data.error || 'Failed to cancel appointment.');
      }
    } catch (err) {
      addToast('error', 'Network error cancelling slot.');
    } finally {
      setCancellingLoading(false);
    }
  };

  const downloadIcsFile = () => {
    const ics = bookedConfirmation?.icsContent;
    if (!ics) return;
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `RavenGard-Interview-${selectedRound}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getGoogleCalendarUrl = (schedule: any) => {
    if (!schedule) return '#';
    const startIso = new Date(schedule.scheduledAt).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endIso = new Date(schedule.endTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const title = encodeURIComponent(`RavenGard AI Assessment: ${schedule.roundType.replace('_', ' ').toUpperCase()}`);
    const details = encodeURIComponent(`RavenGard Automated Enterprise Assessment.\nMeeting Link: ${window.location.origin}${schedule.meetingLink || '/interview/engine'}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=RavenGard+AI+Virtual+Room`;
  };

  const monthName = currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-[1100px] mx-auto w-full py-4 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-violet-400 bg-violet-950/60 border border-violet-800/60 px-2.5 py-0.5 rounded-md">
              <CalendarIcon className="w-3.5 h-3.5" />
              Autonomous Assessment Scheduler
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-md">
              <ShieldCheck className="w-3 h-3" />
              Verified Slots
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Schedule Your Interview
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Reserve a guaranteed 45-minute evaluation window with RavenGard’s autonomous recruiter node. All slots are synchronized directly with enterprise review engines.
          </p>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="self-start md:self-auto text-xs font-mono text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 bg-slate-900/60 px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Return to Gateway
          </button>
        )}
      </div>

      {/* Existing Active Booking Banner */}
      {activeBooking && (
        <div className="glass-panel border border-emerald-500/30 bg-emerald-950/20 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-medium text-white">Confirmed Appointment Active</h3>
                  <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                    Confirmed
                  </span>
                </div>
                <p className="text-slate-300 text-sm mt-1 font-mono">
                  {new Date(activeBooking.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                  {new Date(activeBooking.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Round: <strong className="text-slate-200 capitalize">{activeBooking.roundType.replace('_', ' ')}</strong> (45 Minutes) • Timezone: {activeBooking.timezone}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={getGoogleCalendarUrl(activeBooking)}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-300" /> Google Calendar
              </a>
              <button
                onClick={handleCancelBooking}
                disabled={cancellingLoading}
                className="text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/60 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                {cancellingLoading ? 'Cancelling...' : 'Cancel Slot'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Confirmation Celebration View */}
      {bookedConfirmation && (
        <div className="glass-panel border border-violet-500/40 bg-violet-950/20 p-6 sm:p-8 rounded-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Interview Confirmed and Logged to Database</h2>
              <p className="text-slate-300 text-xs">
                Your reservation is secured in the persistent evaluation pipeline with record ID{' '}
                <span className="font-mono text-violet-300">{bookedConfirmation.schedule.id.slice(0, 14)}...</span>
              </p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <p className="text-slate-400 uppercase tracking-wider">Scheduled Date & Time</p>
              <p className="text-white font-medium text-sm mt-0.5">
                {new Date(bookedConfirmation.schedule.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-slate-400">
                {new Date(bookedConfirmation.schedule.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
              </p>
            </div>
            <div>
              <p className="text-slate-400 uppercase tracking-wider">Assessment Format</p>
              <p className="text-white font-medium text-sm mt-0.5 capitalize">
                {bookedConfirmation.schedule.roundType.replace('_', ' ')}
              </p>
              <p className="text-emerald-400">45 Minutes • Live Telemetry</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase tracking-wider">Platform Channel</p>
              <p className="text-white font-medium text-sm mt-0.5">RavenGard Virtual Room</p>
              <p className="text-slate-400">Timezone: {bookedConfirmation.schedule.timezone}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={getGoogleCalendarUrl(bookedConfirmation.schedule)}
              target="_blank"
              rel="noreferrer"
              className="bg-white hover:bg-slate-100 text-slate-950 font-medium text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Add to Google Calendar
            </a>
            <button
              onClick={downloadIcsFile}
              className="bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" /> Download iCal (.ics)
            </button>
            <button
              onClick={() => setBookedConfirmation(null)}
              className="text-xs text-slate-400 hover:text-white px-3 py-2 transition-colors cursor-pointer"
            >
              Book or View Another Slot
            </button>
          </div>
        </div>
      )}

      {/* Preferences Bar: Round Type & Timezone */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Round Type Selector */}
        <div className="md:col-span-2 glass-panel p-4 rounded-xl border border-slate-800/80 bg-slate-900/50">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-2.5">
            1. Select Assessment Track
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {ROUND_TYPES.map((rt) => {
              const isSelected = selectedRound === rt.id;
              return (
                <button
                  key={rt.id}
                  type="button"
                  onClick={() => {
                    setSelectedRound(rt.id);
                    setSelectedSlot(null);
                  }}
                  className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-violet-500 bg-violet-950/40 text-white shadow-sm ring-1 ring-violet-500/40'
                      : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white">{rt.title}</span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      {rt.duration}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{rt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timezone Selector */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                2. Timezone
              </label>
              <span className="text-[10px] text-emerald-400 font-mono">Auto-detected</span>
            </div>
            <select
              value={selectedTz}
              onChange={(e) => {
                setSelectedTz(e.target.value);
                setSelectedSlot(null);
              }}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">
            Current system time: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: selectedTz })}
          </p>
        </div>
      </div>

      {/* Main Grid: Calendar on Left, Time Slots on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Calendar Grid (7 columns) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-violet-400" />
              {monthName}
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] text-slate-400 uppercase tracking-wider py-1 border-b border-slate-800/60">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {calendarDays.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return <div key={`empty-${idx}`} className="h-14 rounded-lg bg-slate-950/20" />;
              }

              const isSelected = selectedDateStr === cell.date;
              const hasSlots = cell.availableCount > 0;
              const isDisabled = cell.isPast || cell.isWeekend || (!hasSlots && !cell.isToday);

              return (
                <button
                  key={cell.date}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    setSelectedDateStr(cell.date);
                    setSelectedSlot(null);
                  }}
                  className={`h-14 rounded-lg p-1.5 text-left flex flex-col justify-between transition-all relative cursor-pointer ${
                    isSelected
                      ? 'bg-violet-600 text-white font-semibold shadow-md shadow-violet-600/30 ring-2 ring-violet-400'
                      : isDisabled
                      ? 'bg-slate-950/30 text-slate-600 cursor-not-allowed border border-transparent'
                      : 'bg-slate-900/60 hover:bg-slate-800 text-slate-200 border border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs ${cell.isToday && !isSelected ? 'text-violet-400 font-bold' : ''}`}>
                      {cell.dayNumber}
                    </span>
                    {cell.isToday && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                    )}
                  </div>

                  <div className="flex items-center justify-between w-full">
                    {hasSlots && (
                      <span
                        className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                          isSelected
                            ? 'bg-violet-800/80 text-violet-100'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                        }`}
                      >
                        {cell.availableCount} slots
                      </span>
                    )}
                    {cell.isWeekend && (
                      <span className="text-[9px] font-mono text-slate-600">Off</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 pt-3 border-t border-slate-800/60">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Available Slots</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-400"></span>
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-600"></span>
              <span>Weekend / Unavailable</span>
            </div>
          </div>
        </div>

        {/* Right Column: Time Slots & Booking Form (5 columns) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Selected Date</p>
                <h3 className="text-base font-semibold text-white">
                  {selectedDateStr
                    ? new Date(`${selectedDateStr}T12:00:00Z`).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Select a Date'}
                </h3>
              </div>
              <span className="text-xs font-mono text-violet-300 bg-violet-950/50 border border-violet-800/50 px-2 py-1 rounded">
                {slotsForSelectedDate.filter((s) => s.isAvailable).length} open
              </span>
            </div>

            {loadingSlots ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-violet-400" />
                <span className="text-xs font-mono">Synchronizing enterprise availability...</span>
              </div>
            ) : slotsForSelectedDate.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs space-y-2 bg-slate-950/40 rounded-lg border border-slate-800 p-4">
                <Info className="w-6 h-6 mx-auto text-slate-500" />
                <p>No available assessment windows for this date.</p>
                <p className="text-slate-400">Please choose a highlighted weekday from the calendar grid.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {slotsForSelectedDate.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => handleSelectSlot(slot)}
                      className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-violet-500 bg-violet-950/50 ring-1 ring-violet-500 text-white'
                          : slot.isAvailable
                          ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 text-slate-200 hover:border-slate-700'
                          : 'border-slate-900 bg-slate-950/50 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className={`w-4 h-4 ${isSelected ? 'text-violet-400' : 'text-slate-500'}`} />
                        <div>
                          <p className="text-xs font-medium font-mono">
                            {new Date(slot.startTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: selectedTz,
                            })}{' '}
                            -{' '}
                            {new Date(slot.endTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: selectedTz,
                            })}
                          </p>
                          <span className="text-[10px] text-slate-400 capitalize">{slot.period} session</span>
                        </div>
                      </div>

                      <div>
                        {isSelected ? (
                          <span className="text-[10px] font-mono uppercase bg-violet-600 text-white px-2 py-0.5 rounded">
                            Selected
                          </span>
                        ) : slot.isAvailable ? (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                            Available
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-600 bg-slate-900 px-2 py-0.5 rounded">
                            Booked
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Candidate Notes Input */}
            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
                Session Notes / Accommodations (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Screen reader requirement, preferred programming language focus..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
              />
            </div>

            {bookingError && (
              <div className="mt-3 p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg flex items-start gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{bookingError}</span>
              </div>
            )}
          </div>

          {/* Confirm & Book CTA */}
          <div className="pt-2">
            <button
              type="button"
              disabled={!selectedSlot || bookingLoading}
              onClick={handleBookSlot}
              className={`w-full py-3 px-5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                !selectedSlot || bookingLoading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50'
              }`}
            >
              {bookingLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Reserving Slot in Database...
                </>
              ) : selectedSlot ? (
                <>
                  <CalendarCheck className="w-4 h-4" /> Confirm & Lock Slot
                </>
              ) : (
                'Select a Time Slot Above'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
