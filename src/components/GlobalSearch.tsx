import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Contact } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Student, Staff } from '../types';

interface GlobalSearchProps {
  onNavigate: (view: 'students' | 'staff') => void;
}

export default function GlobalSearch({ onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const students = useLiveQuery(() => db.students.toArray()) || [];
  const staff = useLiveQuery(() => db.staff.toArray()) || [];

  const filteredStudents = students.filter(s => s.fullName.toLowerCase().includes(query.toLowerCase()) || s.nationalId.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  const filteredStaff = staff.filter(s => s.fullName.toLowerCase().includes(query.toLowerCase()) || s.title.toLowerCase().includes(query.toLowerCase())).slice(0, 5);

  const hasResults = filteredStudents.length > 0 || filteredStaff.length > 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400 dark:text-cyan-500/50" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-cyan-900/30 rounded-lg bg-gray-50 dark:bg-slate-900/50 text-sm placeholder-gray-500 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          placeholder="Search students, staff..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.trim().length > 0);
          }}
          onFocus={() => setIsOpen(query.trim().length > 0)}
        />
      </div>

      {isOpen && query.trim().length > 0 && (
        <div className="absolute mt-1 w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-cyan-900/50 rounded-lg shadow-xl z-50 max-h-[80vh] overflow-y-auto">
          {hasResults ? (
            <div className="py-2">
              {filteredStudents.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1 text-xs font-bold text-gray-500 dark:text-cyan-400/70 uppercase tracking-wider bg-gray-50/50 dark:bg-slate-800/30">Students</div>
                  {filteredStudents.map(student => (
                    <button
                      key={student.id}
                      onClick={() => {
                        setIsOpen(false);
                        setQuery('');
                        onNavigate('students');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-start gap-3 transition-colors cursor-pointer"
                    >
                      <div className="bg-primary/10 dark:bg-cyan-500/10 p-1.5 rounded flex items-center justify-center text-primary dark:text-cyan-400">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{student.fullName}</div>
                        <div className="text-xs text-gray-500 dark:text-cyan-100/50">{student.nationalId}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {filteredStaff.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-xs font-bold text-gray-500 dark:text-cyan-400/70 uppercase tracking-wider bg-gray-50/50 dark:bg-slate-800/30">Staff</div>
                  {filteredStaff.map(member => (
                    <button
                      key={member.id}
                      onClick={() => {
                        setIsOpen(false);
                        setQuery('');
                        onNavigate('staff');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-start gap-3 transition-colors cursor-pointer"
                    >
                      <div className="bg-emerald-500/10 dark:bg-emerald-500/10 p-1.5 rounded flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Contact className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{member.fullName}</div>
                        <div className="text-xs text-gray-500 dark:text-cyan-100/50">{member.title}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-cyan-100/50">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
