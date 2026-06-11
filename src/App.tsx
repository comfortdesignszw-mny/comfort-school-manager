import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar, { type ViewType } from './components/Sidebar';
import Dashboard from './views/Dashboard';
import Students from './views/Students';
import Classes from './views/Classes';
import Fees from './views/Fees';
import Noticeboard from './views/Noticeboard';
import Settings from './views/Settings';
import StaffView from './views/Staff';
import LockScreen from './components/LockScreen';
import GlobalSearch from './components/GlobalSearch';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('themePreference') === 'dark';
  });

  // App lock state: on app restart, if enabled, it defaults to locked
  const [isAppLocked, setIsAppLocked] = useState(() => {
    return localStorage.getItem('app_lock_enabled') === 'true';
  });

  // Footer document modal state
  const [activeDocModal, setActiveDocModal] = useState<'terms' | 'privacy' | null>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('themePreference', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('themePreference', 'light');
    }
  }, [isDark]);

  // Monitor screen sleeps/tab backgrounds and user inactivity
  useEffect(() => {
    const checkLockStatus = () => {
      const isLockEnabled = localStorage.getItem('app_lock_enabled') === 'true';
      return isLockEnabled;
    };

    if (!checkLockStatus()) {
      setIsAppLocked(false);
      return;
    }

    // 1. Lock when device screen sleeps or tab backgrounded
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && checkLockStatus()) {
        setIsAppLocked(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 2. Lock when open without activity for 5 minutes (300,000 ms)
    let idleTimer: NodeJS.Timeout;
    const FIVE_MINUTES_MS = 5 * 60 * 1000;

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (checkLockStatus() && !isAppLocked) {
        idleTimer = setTimeout(() => {
          setIsAppLocked(true);
        }, FIVE_MINUTES_MS);
      }
    };

    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, resetIdleTimer);
    });

    resetIdleTimer();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (idleTimer) clearTimeout(idleTimer);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, resetIdleTimer);
      });
    };
  }, [isAppLocked]);

  const toggleTheme = () => setIsDark(!isDark);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'students': return <Students />;
      case 'classes': return <Classes />;
      case 'staff': return <StaffView />;
      case 'fees': return <Fees />;
      case 'notices': return <Noticeboard />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {isAppLocked && <LockScreen onUnlock={() => setIsAppLocked(false)} />}

      <Sidebar 
        currentView={currentView}
        onChangeView={setCurrentView}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        toggleTheme={toggleTheme}
        isDark={isDark}
      />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-cyan-900/30 px-4 py-3 flex items-center justify-between gap-4 transition-colors z-10 print:hidden relative shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-semibold text-gray-900 dark:text-slate-100 capitalize hidden lg:block sm:block">{currentView.replace('-', ' ')}</span>
          </div>
          <div className="flex-1 max-w-sm lg:max-w-md w-full ml-auto">
            <GlobalSearch onNavigate={(view) => setCurrentView(view as ViewType)} />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 flex flex-col">
          <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col justify-between">
            <div className="w-full flex-1 relative">
              <div key={currentView} className="animate-view-enter h-full">
                {renderView()}
              </div>
            </div>

            {/* Global Styled Footnote */}
            <footer className="mt-16 pt-6 border-t border-gray-200 dark:border-cyan-900/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-gray-500 dark:text-cyan-200/40 w-full shrink-0 select-none pb-2">
              <div className="space-y-1">
                <p className="font-bold tracking-tight text-gray-750 dark:text-gray-300">
                  &copy; 2026 Comfort School Manager. All Rights Reserved.
                </p>
                <p className="text-[11px] text-gray-400 dark:text-cyan-200/25 font-medium">
                  Designed with ❤️ by Comfort Designs - +263772824132
                </p>
              </div>

              <div className="flex items-center gap-3.5 font-bold text-primary dark:text-cyan-400">
                <button 
                  onClick={() => setActiveDocModal('terms')} 
                  className="hover:underline hover:text-primary/80 transition-colors cursor-pointer"
                >
                  Terms of Use
                </button>
                <span className="text-gray-250 dark:text-cyan-900/30">|</span>
                <button 
                  onClick={() => setActiveDocModal('privacy')} 
                  className="hover:underline hover:text-primary/80 transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </div>
            </footer>
          </div>
        </div>
      </main>

      {/* Terms of Use & Privacy Overlays */}
      {activeDocModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border dark:border-cyan-900/45 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-150 dark:border-cyan-900/10 bg-gray-50/50 dark:bg-slate-950/25">
              <h4 className="font-extrabold text-gray-950 dark:text-white capitalize">
                {activeDocModal === 'terms' ? 'Terms of Use' : 'Privacy Policy'}
              </h4>
              <button 
                onClick={() => setActiveDocModal(null)}
                className="text-gray-400 hover:text-gray-650 dark:hover:text-cyan-400 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs leading-relaxed text-gray-600 dark:text-gray-300 max-h-[60vh] overflow-y-auto">
              {activeDocModal === 'terms' ? (
                <div className="space-y-3">
                  <p className="font-extrabold text-gray-900 dark:text-white text-sm">Agreement to Curricular Provisioning Terms</p>
                  <p>
                    Welcome to <strong>Comfort School Manager</strong>. By accessing or using our school administration systems, database portals, reporting templates, and attendance sheets, you explicitly agree to comply with and be bound by these Terms of Use.
                  </p>
                  <p>
                    These terms govern administrative operator workflows, teacher directory edits, financial invoice tracking, database backup configurations, and student record registries. Access permission lies solely with authorized school registry employees. Sharing account verification keys, or violating student confidentiality directories is strictly prohibited.
                  </p>
                  <p>
                    All diagnostic capabilities, continuous assessment calculators, visual calendar deadlines, and history log charts are offered on an "as-is" school provisioning basis without warranty.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-extrabold text-gray-900 dark:text-white text-sm">Privacy and Student Record Confidentially Agreement</p>
                  <p>
                    At <strong>Comfort School Manager</strong>, we prioritize the confidentiality of child dossiers, parent details, and billing ledgers. We conform to global modern student privacy mandates.
                  </p>
                  <p>
                    <strong>Database Confined Storage:</strong> All student directories, national IDs, photo uploads, guardian addresses, financial transaction logs, and class attendance registers reside directly within the application's secure container sandbox (locally cached using high-performance Dexie relational engines). No records are transmitted to third-party marketing networks or external telemetries.
                  </p>
                  <p>
                    <strong>User Rights:</strong> You retain absolute control over record additions, removals, database clear actions, and PDF layout rendering logs. Security compliance guidelines recommend periodic backup exports to avoid loss from container refreshes.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50/50 dark:bg-slate-950/20 border-t border-gray-150 dark:border-cyan-900/10 flex justify-end">
              <button
                onClick={() => setActiveDocModal(null)}
                className="px-4 py-2 bg-primary text-white font-bold text-xs rounded-lg hover:bg-primary/95 transition-all cursor-pointer"
              >
                Accept &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


