import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../db';
import { backupData, restoreData } from '../utils/backup';
import { Download, Upload, Lock, Unlock, ShieldCheck, Key, FilePlus } from 'lucide-react';
import type { AppSettings, Student } from '../types';
import Papa from 'papaparse';
import { db } from '../db';
import Tooltip from '../components/Tooltip';

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [isRestoring, setIsRestoring] = useState(false);
  const [isImportingCSV, setIsImportingCSV] = useState(false);

  // App Lock system states
  const [appLockEnabled, setAppLockEnabled] = useState(() => {
    return localStorage.getItem('app_lock_enabled') === 'true';
  });
  
  const [showLockSetup, setShowLockSetup] = useState(false);
  const [setupStep, setSetupStep] = useState<1 | 2>(1);
  const [pinEntry, setPinEntry] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [lockError, setLockError] = useState('');

  // Deactivate
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [deactivatePin, setDeactivatePin] = useState('');
  const [deactivateErr, setDeactivateErr] = useState('');

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const handleChange = (key: keyof AppSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const startSetup = () => {
    setShowLockSetup(true);
    setSetupStep(1);
    setPinEntry('');
    setPinConfirm('');
    setLockError('');
  };

  const handlePinInput = (val: string) => {
    const onlyNums = val.replace(/\D/g, '').slice(0, 4);
    if (setupStep === 1) {
      setPinEntry(onlyNums);
      setLockError('');
    } else {
      setPinConfirm(onlyNums);
      setLockError('');
    }
  };

  const proceedToConfirm = () => {
    if (pinEntry.length !== 4) {
      setLockError('PIN must be exactly 4 digits.');
      return;
    }
    setLockError('');
    setSetupStep(2);
  };

  const completeSetup = () => {
    if (pinConfirm.length !== 4) {
      setLockError('PIN must be exactly 4 digits.');
      return;
    }
    if (pinEntry !== pinConfirm) {
      setLockError('PIN codes do not match, please try again.');
      return;
    }
    
    // Configured
    localStorage.setItem('app_lock_enabled', 'true');
    localStorage.setItem('app_lock_pin', pinEntry);
    setAppLockEnabled(true);
    setShowLockSetup(false);
    alert('Security App Lock has been successfully activated & is now safeguarding this browser.');
  };

  const deactivateLock = () => {
    const actualPIN = localStorage.getItem('app_lock_pin') || '';
    if (deactivatePin === actualPIN) {
      localStorage.setItem('app_lock_enabled', 'false');
      localStorage.removeItem('app_lock_pin');
      setAppLockEnabled(false);
      setShowDeactivate(false);
      setDeactivatePin('');
      setDeactivateErr('');
      alert('Security App Lock deactivated successfully.');
    } else {
      setDeactivateErr('Incorrect PIN entered. Deactivation failed.');
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm('Warning: Restoring from a backup will overwrite all current school data. Proceed?')) {
      setIsRestoring(true);
      try {
        await restoreData(file);
        alert('Data restored successfully. The page will reload to apply changes.');
        window.location.reload();
      } catch (err) {
        alert('Failed to restore data. Please ensure the file is valid.');
      } finally {
        setIsRestoring(false);
      }
    }
    e.target.value = '';
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingCSV(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const insertedRecords = [];
          for (const row of results.data as any[]) {
            if (row.fullName && row.nationalId) {
              const newStudent = {
                fullName: row.fullName,
                nationalId: String(row.nationalId),
                dob: row.dob || 'Unknown',
                gender: ['Male', 'Female', 'Other'].includes(row.gender) ? row.gender : 'Other',
                physicalAddress: row.physicalAddress || 'Not Provided',
                profilePhoto: '',
                guardianData: row.guardianName ? [{
                  name: row.guardianName,
                  relation: row.guardianRelation || 'Unknown',
                  contact: row.guardianContact || 'Unknown',
                  address: row.guardianAddress || 'Unknown'
                }] : [],
                schoolData: {
                  assignedSubjects: []
                }
              };
              insertedRecords.push(newStudent);
            }
          }

          if (insertedRecords.length > 0) {
            await db.students.bulkAdd(insertedRecords as any);
            alert(`Success! Imported ${insertedRecords.length} student records from CSV.`);
          } else {
            alert('No valid student records found in the CSV. Make sure you have "fullName" and "nationalId" or "studentId" columns.');
          }
        } catch (err) {
          console.error(err);
          alert('Error importing CSV. Ensure the format is correct.');
        } finally {
          setIsImportingCSV(false);
        }
      },
      error: () => {
        alert('Failed to parse CSV file.');
        setIsImportingCSV(false);
      }
    });

    e.target.value = '';
  };

  return (
    <div className="max-w-3xl space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">System Settings</h2>
        <p className="text-gray-500 mt-1">Configure your school profile and data backup preferences.</p>
      </div>

      <section className="glass-card space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 dark:border-cyan-900/30 pb-2">School Profile</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
            <input 
              type="text" 
              value={settings.schoolName}
              onChange={e => handleChange('schoolName', e.target.value)}
              className="input-field" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School Motto</label>
            <input 
              type="text" 
              value={settings.schoolMotto}
              onChange={e => handleChange('schoolMotto', e.target.value)}
              className="input-field" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
            <input 
              type="text" 
              value={settings.schoolContact}
              onChange={e => handleChange('schoolContact', e.target.value)}
              className="input-field" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone Number</label>
            <input 
              type="text" 
              value={settings.schoolPhone || ''}
              onChange={e => handleChange('schoolPhone', e.target.value)}
              className="input-field" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
            <textarea 
              value={settings.schoolAddress || ''}
              onChange={e => handleChange('schoolAddress', e.target.value)}
              className="input-field"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Theme Color</label>
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                value={settings.themeColor}
                onChange={e => handleChange('themeColor', e.target.value)}
                className="h-10 w-14 p-1 border border-gray-300 dark:border-cyan-900/50 rounded cursor-pointer shrink-0 bg-transparent" 
              />
              <span className="text-sm font-mono text-gray-500 uppercase">{settings.themeColor}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School Logo</label>
            <div className="flex items-center gap-4">
              {settings.schoolLogo ? (
                <img src={settings.schoolLogo} alt="Logo" className="h-10 w-10 object-contain border dark:border-cyan-900/50 rounded shrink-0 bg-gray-50 dark:bg-slate-900/50" />
              ) : (
                <div className="h-10 w-10 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-cyan-900/50 rounded flex items-center justify-center shrink-0">
                  <span className="text-[10px] text-gray-400 font-medium">No Logo</span>
                </div>
              )}
              <div className="relative overflow-hidden w-full max-w-[200px]">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => handleChange('schoolLogo', reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button type="button" className="w-full text-center px-4 py-2 border border-gray-300 dark:border-cyan-900/50 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-55 dark:hover:bg-slate-800 transition-colors">
                  Upload Image
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 dark:border-cyan-900/30 pb-2">System Mode</h3>
        <p className="text-sm text-gray-650">
          Toggle the structural logic of the system. 
          <br/>- <strong>Primary Mode:</strong> Emphasizes Class Teachers.
          <br/>- <strong>Secondary Mode:</strong> Emphasizes Subject Teachers.
          <br/>- <strong>Tertiary Mode:</strong> Emphasizes Subject Majors and Professional Courses.
        </p>
        <div className="flex flex-col md:flex-row gap-4">
          <label className={`flex items-center gap-2 cursor-pointer p-4 border rounded-lg flex-1 relative transition-colors ${settings.systemMode === 'Primary' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-cyan-900/30'}`}>
            <input 
              type="radio" 
              name="systemMode" 
              value="Primary"
              checked={settings.systemMode === 'Primary'}
              onChange={() => handleChange('systemMode', 'Primary')}
              className="mt-0.5 text-primary focus:ring-primary h-4 w-4"
            />
            <span className={`font-medium ${settings.systemMode === 'Primary' ? 'text-gray-900' : 'text-gray-500'}`}>Primary School</span>
          </label>
          <label className={`flex items-center gap-2 cursor-pointer p-4 border rounded-lg flex-1 relative transition-colors ${settings.systemMode === 'Secondary' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-cyan-900/30'}`}>
            <input 
              type="radio" 
              name="systemMode" 
              value="Secondary"
              checked={settings.systemMode === 'Secondary'}
              onChange={() => handleChange('systemMode', 'Secondary')}
              className="mt-0.5 text-primary focus:ring-primary h-4 w-4"
            />
             <span className={`font-medium ${settings.systemMode === 'Secondary' ? 'text-gray-900' : 'text-gray-500'}`}>Secondary School</span>
          </label>
          <label className={`flex items-center gap-2 cursor-pointer p-4 border rounded-lg flex-1 relative transition-colors ${settings.systemMode === 'Tertiary' ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-cyan-900/30'}`}>
            <input 
              type="radio" 
              name="systemMode" 
              value="Tertiary"
              checked={settings.systemMode === 'Tertiary'}
              onChange={() => handleChange('systemMode', 'Tertiary')}
              className="mt-0.5 text-primary focus:ring-primary h-4 w-4"
            />
             <span className={`font-medium ${settings.systemMode === 'Tertiary' ? 'text-gray-900' : 'text-gray-500'}`}>Tertiary Education</span>
          </label>
        </div>
      </section>

      {/* App Interface Lock configuration section */}
      <section className="glass-card space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-cyan-900/30 pb-2">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" /> App & Interface Lock
          </h3>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${appLockEnabled ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'}`}>
            {appLockEnabled ? 'PROTECTION ON' : 'PROTECTION OFF'}
          </span>
        </div>

        <p className="text-sm text-gray-650 leading-relaxed">
          Restrict access to the school administration panels. When active, typing a 4-digit security PIN is required whenever the app is restarted, the device screen sleeps, or the app receives no interaction for 5 minutes.
        </p>

        {!appLockEnabled ? (
          <div>
            {!showLockSetup ? (
              <button 
                onClick={startSetup}
                className="px-5 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/95 transition-all text-sm flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                Setup App Security Lock
              </button>
            ) : (
              <div className="p-5 border border-primary/20 bg-primary/5 dark:bg-primary/5 rounded-xl space-y-4">
                <div className="flex justify-between items-center border-b border-primary/10 pb-2">
                  <h4 className="text-sm font-extrabold text-primary">
                    App Lock Configuration Wizard &mdash; Step {setupStep} of 2
                  </h4>
                  <button 
                    onClick={() => setShowLockSetup(false)} 
                    className="text-gray-400 hover:text-gray-600 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>

                {setupStep === 1 ? (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 font-medium">Please enter a new 4-digit PIN number. Real-time key presses are hidden securely.</p>
                    <div className="flex gap-2 justify-center py-2">
                      {[0, 1, 2, 3].map(idx => (
                        <div key={idx} className={`w-3.5 h-3.5 rounded-full border-2 ${pinEntry.length <= idx ? 'border-primary/30 bg-transparent' : 'border-primary bg-primary'}`}></div>
                      ))}
                    </div>
                    <div className="max-w-[200px] mx-auto">
                      <input 
                        type="password" 
                        maxLength={4} 
                        value={pinEntry}
                        onChange={e => handlePinInput(e.target.value)}
                        className="input-field text-center text-lg font-bold tracking-widest bg-transparent"
                        placeholder="••••"
                      />
                    </div>
                    {lockError && <p className="text-xs text-rose-500 text-center font-bold">{lockError}</p>}
                    <div className="flex justify-end pt-2">
                      <button 
                        onClick={proceedToConfirm}
                        disabled={pinEntry.length !== 4}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 disabled:opacity-50"
                      >
                        Proceed to Confirm
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 font-medium">Please type your 4-digit PIN again to confirm correct setup:</p>
                    <div className="flex gap-2 justify-center py-2">
                      {[0, 1, 2, 3].map(idx => (
                        <div key={idx} className={`w-3.5 h-3.5 rounded-full border-2 ${pinConfirm.length <= idx ? 'border-primary/30 bg-transparent' : 'border-primary bg-primary'}`}></div>
                      ))}
                    </div>
                    <div className="max-w-[200px] mx-auto">
                      <input 
                        type="password" 
                        maxLength={4} 
                        value={pinConfirm}
                        onChange={e => handlePinInput(e.target.value)}
                        className="input-field text-center text-lg font-bold tracking-widest bg-transparent"
                        placeholder="••••"
                      />
                    </div>
                    {lockError && <p className="text-xs text-rose-500 text-center font-bold">{lockError}</p>}
                    <div className="flex justify-between pt-2">
                      <button 
                        onClick={() => setSetupStep(1)}
                        className="px-3 py-2 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100"
                      >
                        Back
                      </button>
                      <button 
                        onClick={completeSetup}
                        disabled={pinConfirm.length !== 4}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 disabled:opacity-50"
                      >
                        Complete Setup
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            {!showDeactivate ? (
              <button 
                onClick={() => { setShowDeactivate(true); setDeactivatePin(''); setDeactivateErr(''); }}
                className="px-5 py-2.5 bg-rose-50 dark:bg-rose-950/20 text-red-650 dark:text-red-400 font-bold border border-red-200 dark:border-red-900/30 rounded-lg hover:bg-red-600 hover:text-white dark:hover:bg-red-600/90 transition-all text-sm flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Unlock className="w-4 h-4" />
                Deactivate Protected App Lock
              </button>
            ) : (
              <div className="p-5 border border-red-200 dark:border-red-900/20 bg-rose-500/5 rounded-xl space-y-4 max-w-sm">
                <h4 className="text-sm font-extrabold text-red-500 flex items-center gap-1.5 border-b border-rose-500/10 pb-2">
                  Verify current PIN code
                </h4>
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 font-medium">Please type your current 4-digit PIN to safely deactivate protection:</p>
                  <input 
                    type="password" 
                    maxLength={4} 
                    value={deactivatePin}
                    onChange={e => {
                      setDeactivatePin(e.target.value.replace(/\D/g, '').slice(0, 4));
                      setDeactivateErr('');
                    }}
                    className="input-field text-center text-lg font-bold tracking-widest bg-transparent"
                    placeholder="••••"
                  />
                  {deactivateErr && <p className="text-xs text-rose-500 font-bold text-center">{deactivateErr}</p>}
                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      onClick={() => setShowDeactivate(false)}
                      className="px-3 py-1.5 border border-gray-300 dark:border-cyan-900/40 rounded-lg text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={deactivateLock}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                    >
                      Verify & Disable
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Backup and restore with optimized contrast styles */}
      <section className="glass-card space-y-6">
        <h3 className="text-lg font-bold text-gray-950 dark:text-white border-b border-gray-100 dark:border-cyan-900/30 pb-2">Export / Import Database (JSON)</h3>
        <p className="text-sm text-gray-650 dark:text-cyan-100/70 leading-relaxed animate-none">
          This system runs entirely offline in your browser. Export the entire local database state as a JSON file to prevent data loss or import it back to restore the system state.
        </p>
        <div className="flex flex-wrap gap-4 pt-2">
          <button 
            onClick={backupData}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/95 transition-all shadow-xs cursor-pointer text-sm"
          >
            <Download className="w-4 h-4" />
            Export DB to JSON
          </button>
          
          <div className="relative">
             <input 
              type="file" 
              accept=".json"
              onChange={handleRestore}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed animate-none"
              disabled={isRestoring}
            />
            <button className={`flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-cyan-900/40 text-gray-750 dark:text-cyan-200 font-bold rounded-lg transition-all bg-white dark:bg-slate-800 text-sm ${isRestoring ? 'opacity-50' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
              <Upload className="w-4 h-4" />
              {isRestoring ? 'Restoring...' : 'Import DB from JSON'}
            </button>
          </div>

          <div className="relative">
             <input 
              type="file" 
              accept=".csv"
              onChange={handleCSVImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed animate-none flex-1"
              disabled={isImportingCSV}
            />
            <Tooltip content="Import student profiles via CSV. Must contain 'fullName' and 'nationalId' or 'studentId' columns.">
              <button className={`flex w-full items-center gap-2 px-5 py-2.5 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold rounded-lg transition-all bg-emerald-50 dark:bg-emerald-500/10 text-sm ${isImportingCSV ? 'opacity-50' : 'hover:bg-emerald-100 dark:hover:bg-emerald-500/20'}`}>
                <FilePlus className="w-4 h-4" />
                {isImportingCSV ? 'Importing...' : 'Bulk Import Students (CSV)'}
              </button>
            </Tooltip>
          </div>
        </div>
      </section>
    </div>
  );
}
