import React, { useState, useEffect } from 'react';
import { getSettings } from '../db';
import { Lock, Delete, ShieldAlert, Key } from 'lucide-react';

interface LockScreenProps {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const settings = getSettings();

  const handleNumberClick = (num: number) => {
    if (pin.length < 4) {
      setError('');
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  // Keyboard entry support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleNumberClick(parseInt(e.key));
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  // Handle auto verification on 4 digits typed
  useEffect(() => {
    if (pin.length === 4) {
      const correctPIN = localStorage.getItem('app_lock_pin') || '';
      if (pin === correctPIN) {
        onUnlock();
      } else {
        // Pin mismatch: shake and clear
        setError('Incorrect security PIN. Please try again.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPin(''); // Reset
      }
    }
  }, [pin, onUnlock]);

  const handleResetAppHelp = () => {
    alert(
      `Forgot your PIN?\n\nPlease contact your School IT Administrator or clear your browser's Cache/Site Data to completely reset the application lock.`
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-[9999] flex flex-col items-center justify-center p-6 text-white overflow-y-auto">
      {/* Background ambient lighting */}
      <div 
        className="absolute inset-0 opacity-10 blur-[150px] pointer-events-none" 
        style={{
          background: `radial-gradient(circle, ${settings.themeColor || '#0ea5e9'} 0%, transparent 70%)`
        }}
      />

      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6 z-10">
        {/* School Identity */}
        <div className="space-y-2">
          {settings.schoolLogo ? (
            <img 
              referrerPolicy="no-referrer"
              src={settings.schoolLogo} 
              alt="School Logo" 
              className="h-16 w-16 mx-auto object-contain rounded-xl bg-white/10 p-2 border border-white/20" 
            />
          ) : (
            <div className="h-16 w-16 mx-auto bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              <Lock className="w-8 h-8 text-cyan-400" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-white tracking-tight">{settings.schoolName}</h1>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">{settings.schoolMotto || 'Academic Management Portal'}</p>
        </div>

        {/* Locked status banner */}
        <div className="flex items-center gap-2 bg-slate-900 border border-cyan-500/20 px-3.5 py-1.5 rounded-full text-xs text-cyan-300 font-semibold tracking-wide">
          <Key className="w-3.5 h-3.5" />
          SYSTEM IS LOCKED
        </div>

        {/* PIN circle preview */}
        <div className={`space-y-2 py-4 ${shake ? 'animate-shake' : ''}`}>
          <div className="flex justify-center gap-4">
            {[0, 1, 2, 3].map((index) => (
              <div 
                key={index}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                  pin.length > index 
                    ? 'bg-cyan-400 border-cyan-400 scale-110 shadow-[0_0_8px_rgb(34,211,238)]' 
                    : 'bg-transparent border-slate-600'
                }`}
              />
            ))}
          </div>
          {error ? (
            <p className="text-xs text-red-400 font-semibold mt-2 min-h-4 flex items-center justify-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> {error}
            </p>
          ) : (
            <p className="text-xs text-slate-400 min-h-4">Enter your 4-digit PIN to authenticate</p>
          )}
        </div>

        {/* Numerical dial keypad */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button 
              key={num}
              onClick={() => handleNumberClick(num)}
              className="h-14 w-14 mx-auto rounded-full bg-slate-900 hover:bg-slate-800 active:bg-cyan-500/20 text-xl font-bold border border-slate-800/60 hover:border-cyan-500/30 transition-all cursor-pointer flex items-center justify-center focus:outline-none"
            >
              {num}
            </button>
          ))}
          {/* Backspace / 0 */}
          <button 
            onClick={handleResetAppHelp}
            className="text-xs font-semibold text-slate-500 hover:text-cyan-400 transition-colors focus:outline-none"
          >
            Forgot PIN?
          </button>
          <button 
            onClick={() => handleNumberClick(0)}
            className="h-14 w-14 mx-auto rounded-full bg-slate-900 hover:bg-slate-800 active:bg-cyan-500/20 text-xl font-bold border border-slate-800/60 hover:border-cyan-500/30 transition-all cursor-pointer flex items-center justify-center focus:outline-none"
          >
            0
          </button>
          <button 
            onClick={handleBackspace}
            className="h-14 w-14 mx-auto text-slate-400 hover:text-red-400 active:scale-95 transition-all flex items-center justify-center focus:outline-none"
            title="Delete character"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Minimal info */}
        <div className="pt-4 text-[11px] text-slate-500 flex items-center gap-1.5 font-medium select-none">
          🛡️ Offline Privacy Protection. Active Activity monitors engaged.
        </div>
      </div>
    </div>
  );
}
