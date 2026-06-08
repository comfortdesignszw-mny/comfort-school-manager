import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from '../db';
import { Plus, X } from 'lucide-react';
import type { Class } from '../types';

export default function Classes() {
  const [isAdding, setIsAdding] = useState(false);
  const classes = useLiveQuery(() => db.classes.toArray(), []) || [];
  const settings = getSettings();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Manage {settings.systemMode === 'Tertiary' ? 'Programs' : 'Classes'}</h2>
          <p className="text-gray-500 mt-1">
            Setting up for <span className="font-semibold text-primary">{settings.systemMode} Mode</span>
          </p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {settings.systemMode === 'Tertiary' ? 'Create Program' : 'Create Class'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white dark:bg-slate-900/40 rounded-xl border border-dashed border-gray-300 dark:border-cyan-900/40">
            No {settings.systemMode === 'Tertiary' ? 'programs' : 'classes'} created yet. Click "Create {settings.systemMode === 'Tertiary' ? 'Program' : 'Class'}" to get started.
          </div>
        ) : (
          classes.map(cls => (
            <div key={cls.id} className="glass-card flex flex-col">
              <h3 className="font-bold text-xl text-gray-900 mb-4">{cls.name}</h3>
              
              <div className="flex-1 space-y-3 text-sm">
                {settings.systemMode === 'Primary' ? (
                  <div>
                    <span className="block text-gray-500 mb-1">Class Teacher</span>
                    <span className="font-medium text-gray-900">{cls.assignedTeacherName || 'Not Assigned'}</span>
                  </div>
                ) : settings.systemMode === 'Secondary' ? (
                  <div>
                    <span className="block text-gray-500 mb-2">Subject Teachers</span>
                    {(!cls.subjectTeachers || cls.subjectTeachers.length === 0) ? (
                      <span className="text-gray-400 italic">No subjects assigned</span>
                    ) : (
                      <ul className="space-y-1">
                        {cls.subjectTeachers.map((st, i) => (
                          <li key={i} className="flex justify-between bg-gray-50 px-2 py-1 rounded">
                            <span className="text-gray-600">{st.subject}</span>
                            <span className="font-medium text-gray-900">{st.teacherName}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div>
                    <span className="block text-gray-500 mb-2">Program Courses</span>
                    {(!cls.courses || cls.courses.length === 0) ? (
                      <span className="text-gray-400 italic">No courses assigned</span>
                    ) : (
                      <ul className="space-y-1">
                        {cls.courses.map((c, i) => (
                          <li key={i} className="flex flex-col bg-gray-50 px-2 py-1.5 rounded">
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-900">{c.code}</span>
                              <span className="text-xs text-primary">{c.credits} cr</span>
                            </div>
                            <span className="text-gray-600 truncate">{c.title}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-cyan-900/30 flex justify-between items-center">
                <span className="text-xs text-gray-500">ID: {cls.id}</span>
                <button className="text-primary text-sm font-medium hover:underline">Edit</button>
              </div>
            </div>
          ))
        )}
      </div>

      {isAdding && <ClassModal onClose={() => setIsAdding(false)} systemMode={settings.systemMode} />}
    </div>
  );
}

function ClassModal({ onClose, systemMode }: { onClose: () => void, systemMode: 'Primary' | 'Secondary' | 'Tertiary' }) {
  const [name, setName] = useState('');
  const [teacher, setTeacher] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.classes.add({
      name,
      assignedTeacherName: systemMode === 'Primary' ? teacher : undefined,
      subjectTeachers: [],
      courses: []
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border dark:border-cyan-900/30">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-cyan-900/30">
          <h3 className="font-bold text-lg text-gray-900">Create New {systemMode === 'Tertiary' ? 'Program' : 'Class'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-cyan-400"><X className="w-5 h-5"/></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{systemMode === 'Tertiary' ? 'Program Name (e.g. BSc Accounting)' : 'Class Name (e.g. Form 1A)'}</label>
            <input required type="text" value={name} onChange={e=>setName(e.target.value)} className="input-field" />
          </div>
          {systemMode === 'Primary' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Class Teacher</label>
              <input type="text" value={teacher} onChange={e=>setTeacher(e.target.value)} className="input-field" placeholder="Teacher Name" />
            </div>
          )}
          <div className="pt-4 flex justify-end gap-3">
            <button onClick={onClose} type="button" className="px-4 py-2 border border-gray-300 dark:border-cyan-900/50 rounded-lg text-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
