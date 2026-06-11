import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from '../db';
import type { Student, Class, Attendance } from '../types';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  Users, 
  TrendingUp, 
  CheckSquare, 
  X, 
  AlertCircle, 
  Search, 
  TrendingDown, 
  Sliders
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import Tooltip from '../components/Tooltip';

export default function AttendanceTracker() {
  const settings = getSettings();
  const classes = useLiveQuery(() => db.classes.toArray(), []) || [];
  
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  // Set initial selected class
  useEffect(() => {
    if (classes.length > 0 && selectedClassId === null) {
      setSelectedClassId(classes[0].id || null);
    }
  }, [classes]);

  // Query actual students in the selected class
  const students = useLiveQuery(
    () => (selectedClassId ? db.students.where('schoolData.classId').equals(selectedClassId).toArray() : []),
    [selectedClassId]
  ) || [];

  // Query existing attendance for the class + date
  const existingAttendance = useLiveQuery(
    async () => {
      if (!selectedDate) return [];
      return db.attendance.where('date').equals(selectedDate).toArray();
    },
    [selectedDate]
  ) || [];

  // Query ALL attendance records for historical trends and metrics
  const allAttendance = useLiveQuery(() => db.attendance.toArray(), []) || [];

  // In-memory sheet of marking state: studentId -> 'Present' | 'Absent' | 'Late' | null
  const [sheet, setSheet] = useState<{ [studentId: number]: 'Present' | 'Absent' | 'Late' }>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Populate sheet when existingAttendance or students list changes
  useEffect(() => {
    const newSheet: { [studentId: number]: 'Present' | 'Absent' | 'Late' } = {};
    students.forEach(s => {
      if (s.id) {
        const record = existingAttendance.find(a => a.studentId === s.id);
        newSheet[s.id] = record ? record.status : 'Present'; // default to Present for convenience
      }
    });
    setSheet(newSheet);
    setSaveStatus('idle');
  }, [students, existingAttendance]);

  const handleUpdateStatus = (studentId: number, status: 'Present' | 'Absent' | 'Late') => {
    setSheet(prev => ({
      ...prev,
      [studentId]: status
    }));
    setSaveStatus('idle');
  };

  const handleBulkMark = (status: 'Present' | 'Absent' | 'Late') => {
    const newSheet = { ...sheet };
    students.forEach(s => {
      if (s.id) newSheet[s.id] = status;
    });
    setSheet(newSheet);
  };

  const handleSaveSheet = async () => {
    if (!selectedClassId) return;
    try {
      const recordsToSave: Attendance[] = [];
      students.forEach(s => {
        if (s.id) {
          recordsToSave.push({
            date: selectedDate,
            studentId: s.id,
            status: sheet[s.id] || 'Present'
          });
        }
      });

      // Execute bulk transaction to avoid slow writes. Overwrite existing records
      await db.transaction('rw', db.attendance, async () => {
        for (const record of recordsToSave) {
          // Check if record exists for primary index [date+studentId] or matching filters
          const existing = await db.attendance
            .where('date').equals(record.date)
            .and(item => item.studentId === record.studentId)
            .first();

          if (existing && existing.id) {
            await db.attendance.update(existing.id, { status: record.status });
          } else {
            await db.attendance.add(record);
          }
        }
      });

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  // Seeding test historical data for a complete charts visualization
  const [isGeneratingMock, setIsGeneratingMock] = useState(false);
  const handleSeedHistoricalData = async () => {
    if (students.length === 0) {
      alert('Please make sure you have students in this class before seeding history.');
      return;
    }
    setIsGeneratingMock(true);
    try {
      const dates: string[] = [];
      const today = new Date();
      // Generates 10 sessions of attendance logs
      for (let i = 1; i <= 10; i++) {
        const past = new Date();
        past.setDate(today.getDate() - i);
        // Skip weekend
        if (past.getDay() === 0 || past.getDay() === 6) continue;
        const yyyy = past.getFullYear();
        const mm = String(past.getMonth() + 1).padStart(2, '0');
        const dd = String(past.getDate()).padStart(2, '0');
        dates.push(`${yyyy}-${mm}-${dd}`);
      }

      await db.transaction('rw', db.attendance, async () => {
        for (const date of dates) {
          for (const student of students) {
            if (!student.id) continue;
            // Weighted random status
            const rand = Math.random();
            const status = rand > 0.88 ? 'Absent' : rand > 0.78 ? 'Late' : 'Present';
            
            const existing = await db.attendance
              .where('date').equals(date)
              .and(item => item.studentId === student.id)
              .first();

            if (existing && existing.id) {
              await db.attendance.update(existing.id, { status });
            } else {
              await db.attendance.add({ date, studentId: student.id, status });
            }
          }
        }
      });

      alert('Successfully seeded 10 days of historic academic attendance records for this class!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingMock(false);
    }
  };

  // Calculate stats for current class/students across all history
  const classStudentsIds = students.map(s => s.id).filter(id => id !== undefined) as number[];
  const classAttendanceRecords = allAttendance.filter(a => classStudentsIds.includes(a.studentId));

  const totalSessions = Array.from(new Set(classAttendanceRecords.map(r => r.date))).length;
  const totalRecordEntries = classAttendanceRecords.length;
  const presentCount = classAttendanceRecords.filter(r => r.status === 'Present').length;
  const lateCount = classAttendanceRecords.filter(r => r.status === 'Late').length;
  const absentCount = classAttendanceRecords.filter(r => r.status === 'Absent').length;

  const averageAttendanceRate = totalRecordEntries > 0 
    ? Math.round(((presentCount + lateCount * 0.5) / totalRecordEntries) * 100) 
    : 0;

  // Recharts Chart Data Processing
  const getTrendData = () => {
    const dates = Array.from(new Set(classAttendanceRecords.map(r => r.date))).sort();
    // take the last 15 active attendance sessions to avoid overcrowding
    const visualDates = dates.slice(-15);
    
    return visualDates.map(dKey => {
      const recordsForDay = classAttendanceRecords.filter(r => r.date === dKey);
      const dayPresent = recordsForDay.filter(r => r.status === 'Present').length;
      const dayLate = recordsForDay.filter(r => r.status === 'Late').length;
      const rate = recordsForDay.length > 0 
        ? Math.round(((dayPresent + dayLate * 0.5) / recordsForDay.length) * 100) 
        : 0;

      return {
        date: dKey.substring(5), // showing MM-DD
        'Attendance Rate (%)': rate
      };
    });
  };

  const chartData = getTrendData();

  return (
    <div className="space-y-6">
      {/* Settings Row */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-cyan-950/20 p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="w-full sm:w-64">
            <label className="block text-xs font-bold text-gray-500 dark:text-cyan-200/50 uppercase tracking-widest mb-1.5">Selected Class</label>
            <select
              value={selectedClassId || ''}
              onChange={e => setSelectedClassId(Number(e.target.value) || null)}
              className="w-full rounded-lg border border-gray-200 dark:border-cyan-900/30 bg-slate-50 dark:bg-slate-950/50 p-2 text-sm text-gray-950 dark:text-gray-100 font-medium focus:ring-1 focus:ring-primary"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-48">
            <label className="block text-xs font-bold text-gray-500 dark:text-cyan-200/50 uppercase tracking-widest mb-1.5">Session Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-cyan-900/30 bg-slate-50 dark:bg-slate-950/50 p-2 text-sm text-gray-950 dark:text-gray-100 font-bold focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex items-end justify-start gap-2 pt-2 md:pt-0">
          <button
            disabled={isGeneratingMock}
            onClick={handleSeedHistoricalData}
            className="px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950/45 text-slate-800 dark:text-cyan-400 hover:bg-gray-100 dark:hover:bg-slate-900 border border-gray-200 dark:border-cyan-900/40 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer select-none transition-all"
            title="Seed simulated past registrations to populated analytical widgets"
          >
            <Sliders className="w-3.5 h-3.5" />
            {isGeneratingMock ? 'Generating logs...' : '⚡ Seed Trend Data'}
          </button>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border dark:border-cyan-950/20 rounded-xl p-12 text-center text-gray-500">
          <Users className="w-12 h-12 mx-auto text-gray-400 dark:text-cyan-400/40 mb-3" />
          <p className="text-base font-bold text-gray-900 dark:text-white">No Students found in selected class.</p>
          <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
            Please register students and assign them to this class code using the Student Directory database first.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* DAILY ROLL CALL WORKSPACE */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-gray-200 dark:border-cyan-950/20 rounded-xl shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-4 bg-gray-50/50 dark:bg-slate-950/15 border-b border-gray-150 dark:border-cyan-900/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-extrabold text-gray-950 dark:text-white text-base">Daily Attendance Sheet</h3>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium uppercase tracking-wider">
                    Click status tabs to customize today's roll call list
                  </p>
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleBulkMark('Present')}
                    className="p-1 px-2.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white rounded text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    Check All Present
                  </button>
                  <button
                    onClick={() => handleBulkMark('Absent')}
                    className="p-1 px-2.5 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white rounded text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    Mark All Absent
                  </button>
                </div>
              </div>

              {/* Attendance Sheet List */}
              <div className="divide-y divide-gray-100 dark:divide-cyan-900/10 max-h-[480px] overflow-y-auto">
                {students.map((student, idx) => {
                  const studentId = student.id;
                  if (!studentId) return null;
                  const currentStatus = sheet[studentId] || 'Present';

                  return (
                    <div 
                      key={studentId} 
                      className="p-3 px-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[11px] font-mono text-gray-400 font-bold min-w-[18px]">
                          {idx + 1}.
                        </span>
                        {student.profilePhoto ? (
                          <img 
                            src={student.profilePhoto} 
                            alt={student.fullName} 
                            className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-cyan-500/10 text-primary dark:text-cyan-300 font-extrabold flex items-center justify-center text-xs shrink-0">
                            {student.fullName ? student.fullName.charAt(0) : '?'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-gray-950 dark:text-gray-100 text-xs block truncate">
                            {student.fullName}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium font-mono">
                            ID: {student.nationalId || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Status Toggle Switch Group */}
                      <div className="flex rounded-lg bg-gray-100 dark:bg-slate-950/80 p-0.5 border dark:border-cyan-950/20">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(studentId, 'Present')}
                          className={`flex items-center gap-1 p-1.5 px-3 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            currentStatus === 'Present'
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-750 dark:hover:text-cyan-200'
                          }`}
                        >
                          <CheckCircle className="w-3 h-3" />
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(studentId, 'Late')}
                          className={`flex items-center gap-1 p-1.5 px-3 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            currentStatus === 'Late'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-750 dark:hover:text-cyan-200'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          Late
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(studentId, 'Absent')}
                          className={`flex items-center gap-1 p-1.5 px-3 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            currentStatus === 'Absent'
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-750 dark:hover:text-cyan-200'
                          }`}
                        >
                          <XCircle className="w-3 h-3" />
                          Absent
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save Button Drawer */}
            <div className="p-4 bg-gray-50/50 dark:bg-slate-950/15 border-t border-gray-150 dark:border-cyan-900/10 flex items-center justify-between gap-4">
              <div className="text-xs">
                {saveStatus === 'success' && (
                  <span className="text-emerald-500 font-bold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Attendance saved successfully!
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-rose-500 font-bold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> Encountered database write error.
                  </span>
                )}
                {saveStatus === 'idle' && (
                  <span className="text-gray-400 font-medium">
                    {Object.keys(sheet).length} records ready for updates
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleSaveSheet}
                className="px-5 py-2 bg-primary text-white font-bold text-xs rounded-lg hover:bg-primary/95 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <CheckSquare className="w-4 h-4" />
                Submit Session Roll Call
              </button>
            </div>
          </div>

          {/* ATTENDANCE PERSISTENCE STATS & CHARTS */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* OVERALL METRICS CARD */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-cyan-950/20 rounded-xl p-5 shadow-xs">
              <h4 className="text-sm font-extrabold text-gray-950 dark:text-white mb-4">Class Performance History</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-950/20 p-3 rounded-xl border border-gray-100 dark:border-cyan-900/10">
                  <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Attendance Rate</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-gray-950 dark:text-white">{averageAttendanceRate}%</span>
                    {averageAttendanceRate >= 85 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/20 p-3 rounded-xl border border-gray-100 dark:border-cyan-900/10">
                  <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Logs</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-gray-950 dark:text-white">{totalSessions}</span>
                    <span className="text-[10px] text-gray-450 font-bold font-mono">sessions</span>
                  </div>
                </div>
              </div>

              {/* Split Ratios */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 tracking-wider uppercase">
                  <span>Aggregate roll calls split</span>
                  <span>{totalRecordEntries} entries</span>
                </div>
                
                <div className="h-2 rounded-full w-full bg-gray-150 dark:bg-slate-800 flex overflow-hidden">
                  <Tooltip content={`Present: ${presentCount}`}>
                    <div className="bg-emerald-500 h-full" style={{ width: `${totalRecordEntries > 0 ? (presentCount/totalRecordEntries)*100 : 0}%` }}></div>
                  </Tooltip>
                  <Tooltip content={`Late: ${lateCount}`}>
                    <div className="bg-amber-500 h-full" style={{ width: `${totalRecordEntries > 0 ? (lateCount/totalRecordEntries)*100 : 0}%` }}></div>
                  </Tooltip>
                  <Tooltip content={`Absent: ${absentCount}`}>
                    <div className="bg-rose-500 h-full" style={{ width: `${totalRecordEntries > 0 ? (absentCount/totalRecordEntries)*100 : 0}%` }}></div>
                  </Tooltip>
                </div>

                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-450 dark:text-cyan-200/50 mt-1">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Present ({presentCount})</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Late ({lateCount})</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Absent ({absentCount})</span>
                </div>
              </div>
            </div>

            {/* RECHARTS TREND VISUALIZER */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-cyan-950/20 rounded-xl p-5 shadow-xs">
              <h4 className="text-sm font-extrabold text-gray-950 dark:text-white mb-3">Academic Attendance Trend</h4>
              
              {chartData.length === 0 ? (
                <div className="py-12 text-center text-gray-400 italic text-xs">
                  Provide or seed historical logs to draw visual graphics.
                </div>
              ) : (
                <main className="space-y-4">
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={settings.themeColor || "#0056b3"} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={settings.themeColor || "#0056b3"} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="date" stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={9} domain={[0, 100]} tickLine={false} axisLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: '#0F172A', 
                            border: 'none', 
                            borderRadius: '8px', 
                            color: '#FFF',
                            fontSize: '11px'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="Attendance Rate (%)" 
                          stroke={settings.themeColor || "#0056b3"} 
                          fillOpacity={1} 
                          fill="url(#colorRate)" 
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-cyan-200/30 text-center font-medium italic">
                    Trend visualizer plotting active roll-call percent accuracy across previous active dates
                  </p>
                </main>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
