import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from '../db';
import { Plus, X, Trash2, Edit2, BookOpen, User, CreditCard } from 'lucide-react';
import type { Class } from '../types';

export default function Classes() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const classes = useLiveQuery(() => db.classes.toArray(), []) || [];
  const settings = getSettings();

  const handleDeleteClass = async (id: number) => {
    if (confirm(`Are you sure you want to delete this ${settings.systemMode === 'Tertiary' ? 'Program' : 'Class'}?`)) {
      await db.classes.delete(id);
    }
  };

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
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/95 transition-colors shadow-lg shadow-cyan-500/10"
        >
          <Plus className="w-4 h-4" />
          {settings.systemMode === 'Tertiary' ? 'Create Program' : 'Create Class'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-500 bg-white dark:bg-slate-900/40 rounded-xl border border-dashed border-gray-300 dark:border-cyan-900/40">
            <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-lg font-medium">No {settings.systemMode === 'Tertiary' ? 'programs' : 'classes'} created yet.</p>
            <p className="text-sm text-gray-400">Click the button above to get started.</p>
          </div>
        ) : (
          classes.map(cls => (
            <div key={cls.id} className="glass-card flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-xl text-gray-900 tracking-tight">{cls.name}</h3>
                  <span className="text-xs font-mono bg-gray-50 dark:bg-slate-800 border border-gray-150 px-2.5 py-0.5 rounded text-gray-500">
                    ID: {cls.id}
                  </span>
                </div>
                
                <div className="space-y-3 text-sm">
                  {settings.systemMode === 'Primary' ? (
                    <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                      <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Class Teacher</span>
                      <span className="font-bold text-gray-900 flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" /> {cls.assignedTeacherName || 'Not Assigned'}
                      </span>
                    </div>
                  ) : settings.systemMode === 'Secondary' ? (
                    <div>
                      <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Subject Teachers Assignments</span>
                      {(!cls.subjectTeachers || cls.subjectTeachers.length === 0) ? (
                        <span className="text-gray-400 italic block py-2 bg-gray-50 px-3 rounded">No subjects assigned yet</span>
                      ) : (
                        <ul className="space-y-1.5">
                          {cls.subjectTeachers.map((st, i) => (
                            <li key={i} className="flex justify-between items-center bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                              <span className="text-gray-700 font-medium">{st.subject}</span>
                              <span className="font-semibold text-xs text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">{st.teacherName}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <div>
                      <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Program Degree Courses</span>
                      {(!cls.courses || cls.courses.length === 0) ? (
                        <span className="text-gray-400 italic block py-2 bg-gray-50 px-3 rounded">No courses assigned yet</span>
                      ) : (
                        <ul className="space-y-2">
                          {cls.courses.map((c, i) => (
                            <li key={i} className="flex flex-col bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-900">{c.code}</span>
                                <span className="text-xs text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded">{c.credits} Credits</span>
                              </div>
                              <span className="text-gray-700 font-medium truncate mt-1">{c.title}</span>
                              <span className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">Lecturer: <span className="text-gray-600 font-medium">{c.lecturer}</span></span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-150 flex justify-end gap-3">
                <button 
                  onClick={() => setEditingClass(cls)}
                  className="p-1 px-3 rounded text-gray-500 hover:text-cyan-500 hover:bg-slate-50 transition-colors flex items-center gap-1 text-xs font-semibold"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Details
                </button>
                <button 
                  onClick={() => cls.id && handleDeleteClass(cls.id)}
                  className="p-1 px-3 rounded text-gray-400 hover:text-red-500 hover:bg-red-500/5 transition-colors flex items-center gap-1 text-xs font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isAdding && (
        <ClassModal 
          onClose={() => setIsAdding(false)} 
          systemMode={settings.systemMode} 
        />
      )}

      {editingClass && (
        <ClassModal 
          classToEdit={editingClass} 
          onClose={() => setEditingClass(null)} 
          systemMode={settings.systemMode} 
        />
      )}
    </div>
  );
}

interface ClassModalProps {
  classToEdit?: Class | null;
  onClose: () => void;
  systemMode: 'Primary' | 'Secondary' | 'Tertiary';
}

const SECONDARY_SUBJECT_OPTIONS = [
  'English',
  'Geography',
  'Mathematics',
  'Physics',
  'Combined Science',
  'Commerce',
  'Business Studies',
  'Accounting',
  'Ndebele',
  'Shona',
  'History',
  'Chemistry',
  'Agriculture',
  'Biology',
  'Food and Nutrition',
  'Religious Studies',
  'Sociology',
  'Computer Science',
  'Literature',
  'Visual Arts'
];

function ClassModal({ classToEdit, onClose, systemMode }: ClassModalProps) {
  const [name, setName] = useState(classToEdit?.name || '');
  
  // Primary Teacher State
  const [teacher, setTeacher] = useState(classToEdit?.assignedTeacherName || '');

  // Secondary Subject-Teachers State
  const [subjectTeachers, setSubjectTeachers] = useState<{ subject: string; teacherName: string }[]>(classToEdit?.subjectTeachers || []);
  const [newSubject, setNewSubject] = useState(SECONDARY_SUBJECT_OPTIONS[0]);
  const [newSubjTeacher, setNewSubjTeacher] = useState('');

  // Tertiary Courses State
  const [courses, setCourses] = useState<{ code: string; title: string; lecturer: string; credits: number }[]>(classToEdit?.courses || []);
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseLecturer, setNewCourseLecturer] = useState('');
  const [newCourseCredits, setNewCourseCredits] = useState(3);

  // Fetch staff list to easily import assigned teachers
  const staff = useLiveQuery(() => db.staff.toArray(), []) || [];
  const teachersList = staff.filter(s => s.status === 'Active');

  const addSubjectTeacher = () => {
    if (!newSubjTeacher.trim()) {
      alert('Please enter or select a teacher name.');
      return;
    }
    // Prevent duplicated subject in same class
    if (subjectTeachers.some(st => st.subject === newSubject)) {
      alert(`Subject "${newSubject}" is already assigned to a teacher in this class. Remove the previous one first.`);
      return;
    }
    setSubjectTeachers([...subjectTeachers, { subject: newSubject, teacherName: newSubjTeacher }]);
    setNewSubjTeacher('');
  };

  const removeSubjectTeacher = (idx: number) => {
    setSubjectTeachers(subjectTeachers.filter((_, i) => i !== idx));
  };

  const addCourse = () => {
    if (!newCourseCode.trim() || !newCourseTitle.trim() || !newCourseLecturer.trim()) {
      alert('Please fill out all course details (Code, Title, Lecturer).');
      return;
    }
    setCourses([...courses, {
      code: newCourseCode.toUpperCase().trim(),
      title: newCourseTitle.trim(),
      lecturer: newCourseLecturer.trim(),
      credits: newCourseCredits
    }]);
    setNewCourseCode('');
    setNewCourseTitle('');
    setNewCourseLecturer('');
    setNewCourseCredits(3);
  };

  const removeCourse = (idx: number) => {
    setCourses(courses.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data: Class = {
      name: name.trim(),
      assignedTeacherName: systemMode === 'Primary' ? teacher : undefined,
      subjectTeachers: systemMode === 'Secondary' ? subjectTeachers : [],
      courses: systemMode === 'Tertiary' ? courses : []
    };

    if (classToEdit && classToEdit.id) {
      await db.classes.put({ ...data, id: classToEdit.id });
    } else {
      await db.classes.add(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden border dark:border-cyan-900/30 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-cyan-900/30">
          <h3 className="font-bold text-lg text-gray-900">
            {classToEdit ? 'Edit Details for' : 'Create New'} {systemMode === 'Tertiary' ? 'Program' : 'Class'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-cyan-400">
            <X className="w-5 h-5"/>
          </button>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {systemMode === 'Tertiary' ? 'Program Title (e.g. BSc Computer Science)' : 'Class / Grade Name (e.g. Form 1A)'}
            </label>
            <input required type="text" value={name} onChange={e=>setName(e.target.value)} className="input-field" placeholder={systemMode === 'Tertiary' ? 'e.g. Diploma in Arts' : 'e.g. Form 3 West'} />
          </div>

          {systemMode === 'Primary' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Class Teacher</label>
              <div className="flex gap-2">
                <select 
                  value={teacher} 
                  onChange={e => setTeacher(e.target.value)} 
                  className="input-field flex-1"
                >
                  <option value="">Select an Active Teacher</option>
                  {teachersList.map(t => (
                    <option key={t.id} value={t.fullName}>{t.fullName} ({t.title})</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  value={teacher} 
                  onChange={e => setTeacher(e.target.value)} 
                  placeholder="Or type name manually" 
                  className="input-field flex-1"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Select from staff dropdown or type manually if staff is not recorded yet.</p>
            </div>
          )}

          {systemMode === 'Secondary' && (
            <div className="space-y-4 border-t pt-4 border-gray-100">
              <div>
                <span className="block text-sm font-semibold text-gray-800 mb-2">Subject - Teacher Assignments</span>
                
                {subjectTeachers.length === 0 ? (
                  <p className="text-xs text-gray-400 italic bg-gray-50 p-2 rounded">No subject-teacher assignments added yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto mb-3">
                    {subjectTeachers.map((st, i) => (
                      <div key={i} className="flex justify-between items-center bg-gray-50 border p-2 rounded-lg text-xs">
                        <div>
                          <span className="font-bold text-gray-900">{st.subject}</span>
                          <span className="text-gray-400 mx-1">&bull;</span>
                          <span className="text-gray-600 font-medium">{st.teacherName}</span>
                        </div>
                        <button type="button" onClick={() => removeSubjectTeacher(i)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-md">
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-150 space-y-3">
                <span className="block text-xs font-bold text-gray-600">Assign Subject To Teacher</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Select Subject</label>
                    <select value={newSubject} onChange={e => setNewSubject(e.target.value)} className="input-field py-1 text-xs">
                      {SECONDARY_SUBJECT_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Assign Teacher</label>
                    <select value={newSubjTeacher} onChange={e=>setNewSubjTeacher(e.target.value)} className="input-field py-1 text-xs">
                      <option value="">Select Active Teacher</option>
                      {teachersList.map(t => (
                        <option key={t.id} value={t.fullName}>{t.fullName}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Or type teacher name manually" 
                    value={newSubjTeacher} 
                    onChange={e => setNewSubjTeacher(e.target.value)} 
                    className="input-field py-1 text-xs flex-1" 
                  />
                  <button type="button" onClick={addSubjectTeacher} className="px-3 bg-primary text-white font-medium rounded text-xs hover:bg-primary/95">
                    Assign
                  </button>
                </div>
              </div>
            </div>
          )}

          {systemMode === 'Tertiary' && (
            <div className="space-y-4 border-t pt-4 border-gray-100">
              <div>
                <span className="block text-sm font-semibold text-gray-800 mb-2">Program Degree Courses</span>
                
                {courses.length === 0 ? (
                  <p className="text-xs text-gray-400 italic bg-gray-50 p-2 rounded">No courses added to this program yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto mb-3">
                    {courses.map((c, i) => (
                      <div key={i} className="flex justify-between items-center bg-gray-50 border p-2 rounded-lg text-xs">
                        <div>
                          <span className="font-bold text-gray-900">[{c.code}] {c.title}</span>
                          <div className="text-gray-400 text-[10px]">Lecturer: <span className="text-gray-600 font-semibold">{c.lecturer}</span> &bull; {c.credits} Credits</div>
                        </div>
                        <button type="button" onClick={() => removeCourse(i)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-md">
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-150 space-y-3">
                <span className="block text-xs font-bold text-gray-600">Add Course Entry</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-semibold">Course Code</label>
                    <input type="text" placeholder="e.g. ENG101" value={newCourseCode} onChange={e=>setNewCourseCode(e.target.value)} className="input-field py-1 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-semibold">Credits</label>
                    <input type="number" min={1} max={12} value={newCourseCredits} onChange={e=>setNewCourseCredits(parseInt(e.target.value) || 3)} className="input-field py-1 text-xs" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] text-gray-400 uppercase font-semibold">Title</label>
                    <input type="text" placeholder="e.g. Advanced Literature" value={newCourseTitle} onChange={e=>setNewCourseTitle(e.target.value)} className="input-field py-1 text-xs" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] text-gray-400 uppercase font-semibold">Lecturer / Instructor</label>
                    <select value={newCourseLecturer} onChange={e=>setNewCourseLecturer(e.target.value)} className="input-field py-1 text-xs mb-1">
                      <option value="">Select Lecturer from staff list</option>
                      {teachersList.map(t => (
                        <option key={t.id} value={t.fullName}>{t.fullName}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Or type manually" value={newCourseLecturer} onChange={e=>setNewCourseLecturer(e.target.value)} className="input-field py-1 text-xs flex-1" />
                      <button type="button" onClick={addCourse} className="px-3 bg-primary text-white font-medium rounded text-xs hover:bg-primary/95">
                        Add Course
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 flex justify-end gap-3 shrink-0">
            <button onClick={onClose} type="button" className="px-4 py-2 border border-gray-300 dark:border-cyan-900/50 rounded-lg text-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/95 transition-colors">Save Details</button>
          </div>
        </form>
      </div>
    </div>
  );
}
