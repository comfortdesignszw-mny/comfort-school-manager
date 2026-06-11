import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { CalendarEvent, Notice, FeeTransaction } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Trash2, 
  AlertCircle, 
  BookOpen, 
  Sparkles, 
  X,
  CreditCard,
  Volume2,
  Megaphone
} from 'lucide-react';
import Tooltip from './Tooltip';

export default function DashboardCalendar() {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // June (0-indexed 5)
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [selectedDayToCreate, setSelectedDayToCreate] = useState<number | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // New event modal fields
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'exam' | 'event' | 'deadline'>('exam');

  // Query database stores
  const notices = useLiveQuery(() => db.notices.toArray(), []) || [];
  const fees = useLiveQuery(() => db.fees.toArray(), []) || [];
  const customEvents = useLiveQuery(() => db.calendarEvents.toArray(), []) || [];

  // Helper arrays
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Get days metrics
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOffset = (year: number, month: number) => new Date(year, month, 1).getDay();

  const totalDays = getDaysInMonth(currentYear, currentMonth);
  const startOffset = getFirstDayOffset(currentYear, currentMonth);

  // Create grid arrays
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    calendarCells.push(d);
  }

  // Format YYYY-MM-DD helper to match dates with DB stores
  const formatDateString = (day: number) => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${currentYear}-${mm}-${dd}`;
  };

  // Get active events for a specific day
  const getEventsForDay = (day: number) => {
    const formattedDate = formatDateString(day);
    const dayEvents: { id?: number; type: 'exam' | 'event' | 'deadline'; source: 'notice' | 'fee' | 'custom'; title: string; colorClass: string }[] = [];

    // 1. Noticeboard items (treated as events)
    notices.forEach(n => {
      if (n.date === formattedDate) {
        dayEvents.push({
          id: n.id,
          type: 'event',
          source: 'notice',
          title: `📢 Notice: ${n.title}`,
          colorClass: 'bg-cyan-550 border-cyan-300 text-cyan-700 dark:text-cyan-400'
        });
      }
    });

    // 2. Unpaid student fee deadlines (billing date as deadline key)
    fees.forEach(f => {
      // Show unpaid billing sessions as visual deadline pressure
      if (f.date === formattedDate && f.status === 'Unpaid') {
        dayEvents.push({
          id: f.id,
          type: 'deadline',
          source: 'fee',
          title: `💳 Fee Due: ${f.studentName} ($${f.amount})`,
          colorClass: 'bg-red-500 border-red-450 text-rose-700 dark:text-rose-400'
        });
      }
    });

    // 3. Persistent custom calendar events & exams
    customEvents.forEach(e => {
      if (e.date === formattedDate) {
        dayEvents.push({
          id: e.id,
          type: e.type,
          source: 'custom',
          title: e.type === 'exam' ? `📝 Exam: ${e.title}` : `🌟 ${e.title}`,
          colorClass: e.type === 'exam' 
            ? 'bg-amber-500 border-amber-450 text-amber-700 dark:text-amber-400' 
            : 'bg-indigo-500 border-indigo-400 text-indigo-700 dark:text-indigo-400'
        });
      }
    });

    return dayEvents;
  };

  // Quick Seed scheduler data defaults
  const handleSeedSchedules = async () => {
    setIsSeeding(true);
    try {
      const targetMonthStr = String(currentMonth + 1).padStart(2, '0');
      const seedData: CalendarEvent[] = [
        { title: 'Mathematics Midterm Theory Paper 1', date: `${currentYear}-${targetMonthStr}-08`, type: 'exam' },
        { title: 'Secondary English Essay Writing Assessment', date: `${currentYear}-${targetMonthStr}-15`, type: 'exam' },
        { title: 'Primary Science Lab Practical Demonstration', date: `${currentYear}-${targetMonthStr}-18`, type: 'exam' },
        { title: 'Comfort Designs School Open House Day Assembly', date: `${currentYear}-${targetMonthStr}-24`, type: 'event' },
        { title: 'Annual General Assembly meeting with Guardians', date: `${currentYear}-${targetMonthStr}-28`, type: 'event' },
      ];

      for (const item of seedData) {
        // avoid duplicating seed records
        const exists = await db.calendarEvents.where('title').equals(item.title).and(e => e.date === item.date).first();
        if (!exists) {
          await db.calendarEvents.add(item);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  // Add custom event handle
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDayToCreate || !newTitle.trim()) return;

    try {
      const eventDate = formatDateString(selectedDayToCreate);
      await db.calendarEvents.add({
        title: newTitle.trim(),
        date: eventDate,
        type: newType
      });

      setNewTitle('');
      setIsAddingEvent(false);
      setSelectedDayToCreate(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async (id: number, type: 'custom' | 'fee' | 'notice') => {
    if (type !== 'custom') {
      alert("Noticeboard topics and Billing ledgers must be altered inside their respective directories.");
      return;
    }
    if (confirm("Are you sure you want to delete this custom scheduled calendar event?")) {
      await db.calendarEvents.delete(id);
    }
  };

  // Gather aggregate monthly calendar agenda summary
  const getMonthlyAggregateAgenda = () => {
    const agenda: { id?: number; dateStr: string; dayNum: number; title: string; origin: 'custom' | 'fee' | 'notice' }[] = [];
    for (let d = 1; d <= totalDays; d++) {
      const items = getEventsForDay(d);
      items.forEach(it => {
        agenda.push({
          id: it.id,
          dateStr: formatDateString(d),
          dayNum: d,
          title: it.title,
          origin: it.source
        });
      });
    }
    return agenda.sort((a,b) => a.dayNum - b.dayNum);
  };

  const monthlyAgenda = getMonthlyAggregateAgenda();

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-cyan-950/20 rounded-xl p-5 shadow-xs flex flex-col xl:flex-row gap-6">
      
      {/* LEFT PORTION: FULL CALENDAR INTERACTIVE GRID */}
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary dark:text-cyan-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-950 dark:text-white text-base">Continuous Assessment Scheduler</h3>
              <p className="text-xs text-gray-400 mt-0.5 font-medium uppercase tracking-wider">
                Interactive monthly exam logs &amp; fee collection goals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-950 border dark:border-cyan-950/30 rounded-lg">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-md text-gray-500 hover:text-gray-950 dark:hover:text-cyan-300 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-black text-gray-950 dark:text-white px-2.5 font-mono">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-md text-gray-500 hover:text-gray-950 dark:hover:text-cyan-300 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {monthlyAgenda.length === 0 && (
              <button
                disabled={isSeeding}
                onClick={handleSeedSchedules}
                className="px-3 py-1.5 bg-primary/15 hover:bg-primary/20 text-primary text-[10px] font-bold uppercase rounded border border-primary/25 cursor-pointer flex items-center gap-1 transition-all"
                title="Populate current month with standard scheduled curriculum"
              >
                <Sparkles className="w-3 h-3" />
                {isSeeding ? 'Seeding...' : 'Seed Calendar'}
              </button>
            )}
          </div>
        </div>

        {/* CALENDAR WEEK COLS HEADERS */}
        <div className="grid grid-cols-7 gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-t-lg border border-b-0 dark:border-cyan-950/20 text-center">
          {dayNames.map(dName => (
            <span key={dName} className="py-2 text-[10px] uppercase font-black tracking-widest text-gray-400">
              {dName}
            </span>
          ))}
        </div>

        {/* ACTIVE DAYS GRID OF CURRENT MONTH */}
        <div className="grid grid-cols-7 gap-1 border dark:border-cyan-950/20 p-1 rounded-b-lg min-h-[300px]">
          {calendarCells.map((day, cellIdx) => {
            if (day === null) {
              return (
                <div key={`empty-${cellIdx}`} className="bg-slate-50/25 dark:bg-slate-950/10 border border-transparent"></div>
              );
            }

            const dayEventsStr = getEventsForDay(day);
            const isToday = day === 11 && currentMonth === 5 && currentYear === 2026;

            return (
              <div
                key={`day-${day}`}
                onClick={() => {
                  setSelectedDayToCreate(day);
                  setIsAddingEvent(true);
                }}
                className={`group min-h-[54px] p-1.5 border hover:border-primary/45 rounded-lg transition-all relative flex flex-col justify-between scroll-smooth cursor-pointer bg-slate-55/20 ${
                  isToday 
                    ? 'border-primary ring-2 ring-primary/15 bg-primary/[0.04]' 
                    : 'border-gray-100 dark:border-cyan-950/20 hover:bg-slate-50/65 dark:hover:bg-slate-950/30'
                }`}
              >
                {/* Day Header */}
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    isToday ? 'bg-primary text-white font-extrabold shadow-sm' : 'text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white'
                  }`}>
                    {day}
                  </span>
                  <Tooltip content="Schedule an exam or custom curricular event">
                    <span className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 dark:text-cyan-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-900 transition-opacity">
                      <Plus className="w-3 h-3" />
                    </span>
                  </Tooltip>
                </div>

                {/* Day Events Dots/Mini badges */}
                <div className="space-y-0.5 mt-1 pointer-events-none select-none">
                  {dayEventsStr.slice(0, 2).map((item, idX) => (
                    <div 
                      key={idX} 
                      className="text-[8px] font-bold truncate leading-tight border border-b rounded px-1 max-w-full block bg-slate-50/50 dark:bg-slate-950/40" 
                      title={item.title}
                    >
                      {item.title}
                    </div>
                  ))}
                  {dayEventsStr.length > 2 && (
                    <div className="text-[7px] font-bold text-gray-400 uppercase tracking-widest text-center">
                      + {dayEventsStr.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PORTION: SELECTED MONTH CURRICRICULAR AGENDA LIST */}
      <div className="w-full xl:w-80 bg-slate-50/45 dark:bg-slate-950/15 border dark:border-cyan-950/15 p-4 rounded-xl flex flex-col justify-between h-auto xl:h-[370px]">
        <div>
          <h4 className="text-xs font-black text-gray-950 dark:text-white uppercase tracking-widest border-b dark:border-cyan-900/10 pb-2 mb-3">
            Monthly Agenda Calendar ({monthlyAgenda.length})
          </h4>

          <div className="overflow-y-auto space-y-2 h-[230px] pr-1">
            {monthlyAgenda.length === 0 ? (
              <div className="text-center py-10">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto opacity-55 mb-2" />
                <p className="text-xs text-gray-400 italic">No exams or events mapped for this month directory yet.</p>
                <p className="text-[10px] text-gray-400 mt-2 max-w-[200px] mx-auto">
                  Click on school calendar days to schedule upcoming evaluations or seed curricular defaults.
                </p>
              </div>
            ) : (
              monthlyAgenda.map((item, index) => {
                const isCustom = item.origin === 'custom';
                return (
                  <div 
                    key={index} 
                    className="p-2.5 bg-white dark:bg-slate-900 border dark:border-cyan-950/10 rounded-lg flex items-center justify-between gap-3 text-[11px]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-primary shrink-0">
                          Day {item.dayNum}
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                        <span className="text-[9px] text-gray-400 uppercase font-bold font-mono">
                          {item.origin}
                        </span>
                      </div>
                      <p className="font-bold text-gray-750 dark:text-gray-100 truncate mt-1">
                        {item.title}
                      </p>
                    </div>

                    {isCustom && item.id && (
                      <Tooltip content="Remove custom evaluation date">
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(item.id!, 'custom')}
                          className="p-1 hover:bg-rose-500/10 text-gray-400 hover:text-red-500 rounded cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="text-[9px] text-gray-400 dark:text-cyan-200/25 italic border-t dark:border-cyan-900/10 pt-2 text-center">
          Assess dates mapped visually from notices, unfulfilled invoice rosters, and manually scheduled exams.
        </div>
      </div>

      {/* RENDER MODAL TO CREATE EVENTS */}
      {isAddingEvent && selectedDayToCreate && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border dark:border-cyan-900/40 rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-cyan-900/10 bg-gray-50/50 dark:bg-slate-950/20">
              <h4 className="font-bold text-gray-950 dark:text-white">
                Schedule Event: {monthNames[currentMonth]} {selectedDayToCreate}, {currentYear}
              </h4>
              <button 
                onClick={() => {
                  setIsAddingEvent(false);
                  setSelectedDayToCreate(null);
                }} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-cyan-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-450 uppercase tracking-wider mb-1.5">Event or Exam Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics Final Exam, Class Sports Day"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-250 dark:border-cyan-950/20 bg-slate-50 dark:bg-slate-950/25 p-2 text-xs text-gray-950 dark:text-white focus:ring-1 focus:ring-primary focus:outline-none placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-450 uppercase tracking-wider mb-1.5">Scheduling Category</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as any)}
                  className="w-full rounded-lg border border-gray-250 dark:border-cyan-950/20 bg-slate-55/15 p-2 text-xs text-gray-950 dark:text-white focus:ring-1 focus:ring-primary"
                >
                  <option value="exam">📖 Exam / Academic Test</option>
                  <option value="event">🌟 Special Event / Assembly</option>
                  <option value="deadline">📅 General School Deadline</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-cyan-900/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingEvent(false);
                    setSelectedDayToCreate(null);
                  }}
                  className="px-3.5 py-1.5 border border-gray-300 dark:border-cyan-900/40 rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-primary text-white font-semibold rounded-lg text-xs hover:bg-primary/95 transition-colors cursor-pointer"
                >
                  Confirm Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
