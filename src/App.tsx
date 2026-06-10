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

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('themePreference') === 'dark';
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

