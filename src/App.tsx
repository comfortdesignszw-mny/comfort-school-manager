import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar, { type ViewType } from './components/Sidebar';
import Dashboard from './views/Dashboard';
import Students from './views/Students';
import Classes from './views/Classes';
import Fees from './views/Fees';
import Noticeboard from './views/Noticeboard';
import Settings from './views/Settings';
import StaffView from './views/Staff';
import LockScreen from './components/LockScreen';

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
        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-cyan-900/30 px-4 py-3 flex items-center gap-4 lg:hidden transition-colors">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-semibold text-gray-900 capitalize">{currentView}</span>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}


