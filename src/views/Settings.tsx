import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../db';
import { backupData, restoreData } from '../utils/backup';
import { Download, Upload } from 'lucide-react';
import type { AppSettings } from '../types';

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const handleChange = (key: keyof AppSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email/Phone</label>
            <input 
              type="text" 
              value={settings.schoolContact}
              onChange={e => handleChange('schoolContact', e.target.value)}
              className="input-field" 
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
                <button type="button" className="w-full text-center px-4 py-2 border border-gray-300 dark:border-cyan-900/50 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  Upload Image
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 dark:border-cyan-900/30 pb-2">System Mode</h3>
        <p className="text-sm text-gray-600">
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

      <section className="bg-gray-900 dark:bg-slate-900 text-white p-6 rounded-xl border border-gray-800 dark:border-cyan-900/50 shadow-sm space-y-4">
        <h3 className="text-lg font-bold border-b border-gray-700 pb-2">Data Backup & Restore</h3>
        <p className="text-sm text-gray-400">
          This system runs entirely offline in your browser. It is critical to download a backup file regularly to prevent data loss.
        </p>
        <div className="flex flex-wrap gap-4 pt-2">
          <button 
            onClick={backupData}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Full Backup
          </button>
          
          <div className="relative">
             <input 
              type="file" 
              accept=".json"
              onChange={handleRestore}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              disabled={isRestoring}
            />
            <button className={`flex items-center gap-2 px-5 py-2.5 border border-gray-700 text-white font-medium rounded-lg transition-colors ${isRestoring ? 'opacity-50' : 'hover:bg-gray-800'}`}>
              <Upload className="w-4 h-4" />
              {isRestoring ? 'Restoring...' : 'Restore from File'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
