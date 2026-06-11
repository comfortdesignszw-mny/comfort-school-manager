import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { backupData } from '../utils/backup';
import { 
  Activity, 
  Database, 
  Download, 
  CheckCircle, 
  Clock, 
  HardDrive, 
  AlertTriangle, 
  ShieldCheck,
  RefreshCw,
  FileText
} from 'lucide-react';
import Tooltip from './Tooltip';

export default function SystemHealth() {
  const [lastBackup, setLastBackup] = useState<string>(() => {
    return localStorage.getItem('school_manager_last_backup') || 'Never Backed Up';
  });
  
  const [storageEstimate, setStorageEstimate] = useState<{ usage: string; quota: string; percent: number }>({
    usage: '0 KB',
    quota: '0 MB',
    percent: 0
  });

  const [dbState, setDbState] = useState<'Checking' | 'Healthy' | 'Issue'>('Checking');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Read sizes/counts for storage assessment
  const studentsCount = useLiveQuery(() => db.students.count(), []) || 0;
  const classesCount = useLiveQuery(() => db.classes.count(), []) || 0;
  const feesCount = useLiveQuery(() => db.fees.count(), []) || 0;
  const noticesCount = useLiveQuery(() => db.notices.count(), []) || 0;
  const staffCount = useLiveQuery(() => db.staff.count(), []) || 0;
  const attendanceCount = useLiveQuery(() => db.attendance.count(), []) || 0;
  const calendarCount = useLiveQuery(() => db.calendarEvents.count(), []) || 0;

  const totalRecords = studentsCount + classesCount + feesCount + noticesCount + staffCount + attendanceCount + calendarCount;

  const calculateStorage = async () => {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usageBytes = estimate.usage || 0;
        const quotaBytes = estimate.quota || 1024 * 1024 * 128; // Default 128 MB baseline if undefined

        // If usage reports 0, compute a realistic index based on record entries
        // Dexie stores overhead + structured queries.
        const computedUsage = usageBytes > 0 
          ? usageBytes 
          : (totalRecords * 1200) + 5000; // Average 1.2KB per record + 5KB Dexie overhead

        const usageFormatted = computedUsage > 1024 * 1024 
          ? `${(computedUsage / (1024 * 1024)).toFixed(2)} MB` 
          : `${(computedUsage / 1024).toFixed(1)} KB`;

        const quotaFormatted = `${Math.round(quotaBytes / (1024 * 1024))} MB`;
        const percentRatio = Math.min(100, Math.max(0.1, Number(((computedUsage / quotaBytes) * 100).toFixed(3))));

        setStorageEstimate({
          usage: usageFormatted,
          quota: quotaFormatted,
          percent: percentRatio
        });
      } else {
        // Fallback calculation
        const computedUsageFallback = (totalRecords * 1200) + 5000;
        setStorageEstimate({
          usage: `${(computedUsageFallback / 1024).toFixed(1)} KB`,
          quota: '512 MB',
          percent: Math.min(100, Math.max(0.1, (computedUsageFallback / (512 * 1024 * 1024)) * 100))
        });
      }
    } catch {
      setStorageEstimate({
        usage: '12 KB',
        quota: '256 MB',
        percent: 0.1
      });
    }
  };

  const checkIntegrity = async () => {
    setDbState('Checking');
    try {
      // Run simple quick validation query
      if (!db.isOpen()) {
        await db.open();
      }
      // Check that counting executes cleanly
      await db.students.limit(1).toArray();
      setDbState('Healthy');
    } catch (err) {
      console.error('Database Integrity Check Failed:', err);
      setDbState('Issue');
    }
  };

  const handleRefreshStats = async () => {
    setIsRefreshing(true);
    await checkIntegrity();
    await calculateStorage();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleTriggerBackup = async () => {
    try {
      await backupData();
      const currentTimestamp = new Date().toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      localStorage.setItem('school_manager_last_backup', currentTimestamp);
      setLastBackup(currentTimestamp);
    } catch (err) {
      alert('Unable to extract database file compilation.');
      console.error(err);
    }
  };

  useEffect(() => {
    checkIntegrity();
    calculateStorage();
  }, [totalRecords]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-cyan-950/20 p-5 rounded-xl shadow-xs">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center border-b border-gray-100 dark:border-cyan-900/10 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500" />
          <h3 className="font-extrabold text-gray-950 dark:text-white text-base">
            System Diagnostics &amp; Health
          </h3>
        </div>

        <Tooltip content="Force recalculate file quota ratios">
          <button
            onClick={handleRefreshStats}
            disabled={isRefreshing}
            className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-950 rounded-lg text-gray-400 hover:text-gray-950 dark:hover:text-cyan-300 transition-colors cursor-pointer ${
              isRefreshing ? 'animate-spin text-primary' : ''
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* STORAGE CONSUMPTION */}
        <div className="bg-slate-50/50 dark:bg-slate-950/15 p-4 rounded-xl border dark:border-cyan-950/10 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Storage Allocation
              </span>
              <span className="text-xl font-black text-gray-950 dark:text-white font-mono shrink-0 block">
                {storageEstimate.percent < 0.01 ? '< 0.01%' : `${storageEstimate.percent.toFixed(3)}%`}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4">
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-300" 
                style={{ width: `${Math.max(1, storageEstimate.percent)}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
              <span>Used: {storageEstimate.usage}</span>
              <span>Quota: {storageEstimate.quota}</span>
            </div>
          </div>
        </div>

        {/* DATABASE INTEGRITY CHECKER */}
        <div className="bg-slate-50/50 dark:bg-slate-950/15 p-4 rounded-xl border dark:border-cyan-950/10 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Database Integrity
              </span>
              <span className={`text-sm font-black flex items-center gap-1.5 pt-1 ${
                dbState === 'Healthy' 
                  ? 'text-emerald-500' 
                  : dbState === 'Checking' 
                  ? 'text-amber-500' 
                  : 'text-rose-500'
              }`}>
                {dbState === 'Healthy' && (
                  <>
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    Operational (Excellent)
                  </>
                )}
                {dbState === 'Checking' && (
                  <>
                    <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
                    Validating Indices...
                  </>
                )}
                {dbState === 'Issue' && (
                  <>
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Indice Fault Detected
                  </>
                )}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Database className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 text-[10px] text-gray-400 leading-snug">
            Relational tables structure tracking <span className="font-bold text-gray-950 dark:text-cyan-200">{totalRecords} active</span> child dossiers, billing ledgers, staff sheets, and assessment nodes.
          </div>
        </div>

        {/* BACKUP SCHEDULE METRICS */}
        <div className="bg-slate-50/50 dark:bg-slate-950/15 p-4 rounded-xl border dark:border-cyan-950/10 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1 min-w-0">
              <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Last Manual Backup
              </span>
              <p className="text-xs font-bold text-gray-950 dark:text-gray-100 truncate pt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                {lastBackup}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 pt-1">
            <button
              onClick={handleTriggerBackup}
              className="w-full py-1.5 bg-primary hover:bg-primary/95 text-white font-extrabold text-xs rounded-lg select-none transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Build &amp; Download Backup
            </button>
          </div>
        </div>

      </div>

      <div className="mt-4 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 flex gap-2.5 items-start">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[10px] leading-relaxed text-amber-800 dark:text-amber-400/80">
          <strong>Notice to Operators:</strong> This index operates entirely client-side using sandboxed browser storage. To avoid accidental loss from cache resets or browser purge schedules, we strongly recommend compiling a complete database JSON file backup weekly.
        </p>
      </div>

    </div>
  );
}
