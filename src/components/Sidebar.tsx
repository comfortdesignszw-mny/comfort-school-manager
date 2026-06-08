import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, GraduationCap, Banknote, ClipboardList, Settings as SettingsIcon, Sun, Moon } from 'lucide-react';
import { getSettings } from '../db';
import type { AppSettings } from '../types';

export type ViewType = 'dashboard' | 'students' | 'classes' | 'fees' | 'notices' | 'settings';

interface SidebarProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
  isOpen: boolean;
  onClose: () => void;
  toggleTheme: () => void;
  isDark: boolean;
}

export default function Sidebar({ currentView, onChangeView, isOpen, onClose, toggleTheme, isDark }: SidebarProps) {
  const [settings, setSettings] = useState<AppSettings>(getSettings());

  useEffect(() => {
    const interval = setInterval(() => {
      setSettings(getSettings());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'classes', label: 'Classes', icon: GraduationCap },
    { id: 'fees', label: 'Fees', icon: Banknote },
    { id: 'notices', label: 'Noticeboard', icon: ClipboardList },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ] as const;

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-cyan-900/30 transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="p-6 border-b border-gray-200 dark:border-cyan-900/30 flex flex-col gap-1">
          <h1 className="font-extrabold text-xl text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
            Comfort SM
          </h1>
          <p className="text-xs text-gray-500 dark:text-cyan-400 font-medium">Manage your School like a Pro</p>
        </div>

        {(settings.schoolName || settings.schoolLogo) && (
          <div className="px-6 py-4 flex items-center gap-3 border-b border-gray-200 dark:border-cyan-900/30 bg-gray-50/50 dark:bg-slate-800/30">
            {settings.schoolLogo ? (
              <img src={settings.schoolLogo} alt="Logo" className="w-8 h-8 object-contain shrink-0 bg-white rounded shadow-sm" />
            ) : (
              <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center font-bold shrink-0 shadow-sm text-sm">
                {settings.schoolName.charAt(0) || 'S'}
              </div>
            )}
            <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate leading-tight line-clamp-2">
              {settings.schoolName}
            </div>
          </div>
        )}
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onChangeView(item.id as ViewType);
                      onClose();
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-primary/10 text-primary dark:bg-cyan-500/20 dark:text-cyan-400' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-100'}
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-cyan-900/30">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-cyan-800/50 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? (
              <><Sun className="w-4 h-4 text-amber-500" /> Light Mode</>
            ) : (
              <><Moon className="w-4 h-4 text-slate-700" /> Dark Mode</>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
