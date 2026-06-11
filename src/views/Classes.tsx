import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from '../db';
import { Plus, X, Trash2, Edit2, BookOpen, User, CreditCard, BarChart2, Award, Sparkles } from 'lucide-react';
import type { Class, Student } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import Tooltip from '../components/Tooltip';

export default function Classes() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [editingStudentMarks, setEditingStudentMarks] = useState<Student | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const classes = useLiveQuery(() => db.classes.toArray(), []) || [];
  const settings = getSettings();

  const getSubjectsForClass = (cls: Class, mode: string) => {
    if (mode === 'Primary') {
      return ['Mathematics', 'English', 'Science', 'Social Studies', 'Arts'];
    } else if (mode === 'Secondary') {
      const list = cls.subjectTeachers?.map(st => st.subject) || [];
      return list.length > 0 ? list : ['Mathematics', 'English', 'Geography', 'Physics', 'History'];
    } else {
      const list = cls.courses?.map(c => `${c.code}`) || [];
      return list.length > 0 ? list : ['COMP101', 'COMP102', 'MATH201', 'LIT301'];
    }
  };

  const activeClassId = selectedClassId ?? classes[0]?.id ?? null;
  const selectedClassObj = classes.find(c => c.id === activeClassId);

  const students = useLiveQuery(() => db.students.toArray(), []) || [];
  const classStudents = students.filter(s => s.schoolData?.classId === activeClassId);

  const handleSeedDemoData = async () => {
    if (!activeClassId || !selectedClassObj) return;
    setIsSeeding(true);
    try {
      const subjects = getSubjectsForClass(selectedClassObj, settings.systemMode);
      const demoNames = ['Alice Smith', 'Bob Johnson', 'Charlie Brown'];
      const firstNames = ['Alice', 'Bob', 'Charlie'];
      
      for (let i = 0; i < demoNames.length; i++) {
        const marks: { [key: string]: number } = {};
        for (const sub of subjects) {
          marks[sub] = Math.floor(Math.random() * 30) + 65; // random mark between 65 and 95
        }
        
        await db.students.add({
          fullName: demoNames[i],
          dob: '2012-05-15',
          gender: i === 1 ? 'Male' : 'Female',
          nationalId: `DEMO-00${i+1}-${Math.floor(Math.random() * 900 + 100)}`,
          physicalAddress: '123 School Rd',
          guardianData: [{ name: `Guardian of ${firstNames[i]}`, relation: 'Parent', contact: '+15550199', address: '123 School Rd' }],
          schoolData: {
            classId: activeClassId,
            assignedSubjects: settings.systemMode === 'Secondary' ? subjects : [],
            marks
          }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDeleteClass = async (id: number) => {
    if (confirm(`Are you sure you want to delete this ${settings.systemMode === 'Tertiary' ? 'Program' : 'Class'}?`)) {
      await db.classes.delete(id);
      if (selectedClassId === id) setSelectedClassId(null);
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
          <div className="col-span-full py-16 text-center border-dashed border-2 bg-gray-50/50 dark:bg-slate-900/40 rounded-xl border-gray-200 dark:border-cyan-900/20">
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" strokeWidth={1} />
            <h3 className="text-gray-900 dark:text-gray-200 font-bold text-lg mb-1">No {settings.systemMode === 'Tertiary' ? 'programs' : 'classes'} created yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto mb-4">You haven't set up the academic structure. Create your first class/program to begin adding students.</p>
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-cyan-400 px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/20 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create {settings.systemMode === 'Tertiary' ? 'Program' : 'Class'}
            </button>
          </div>
        ) : (
          classes.map(cls => {
            const isSelected = cls.id === activeClassId;
            return (
              <div 
                key={cls.id} 
                onClick={() => cls.id && setSelectedClassId(cls.id)}
                className={`glass-card flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                  isSelected 
                    ? 'ring-2 ring-primary bg-primary/[0.01] border-primary/50 shadow-md shadow-primary/5' 
                    : 'hover:border-gray-300 dark:hover:border-cyan-900/30'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">{cls.name}</h3>
                      {isSelected && (
                        <span className="bg-primary/15 text-primary text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono bg-gray-50 dark:bg-slate-800 border border-gray-150 px-2.5 py-0.5 rounded text-gray-500">
                      ID: {cls.id}
                    </span>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    {settings.systemMode === 'Primary' ? (
                      <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-100 dark:border-cyan-900/10">
                        <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Class Teacher</span>
                        <span className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" /> {cls.assignedTeacherName || 'Not Assigned'}
                        </span>
                      </div>
                    ) : settings.systemMode === 'Secondary' ? (
                      <div>
                        <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Subject Teachers Assignments</span>
                        {(!cls.subjectTeachers || cls.subjectTeachers.length === 0) ? (
                          <span className="text-gray-400 italic block py-2 bg-gray-50 dark:bg-slate-900/10 px-3 rounded">No subjects assigned yet</span>
                        ) : (
                          <ul className="space-y-1.5">
                            {cls.subjectTeachers.map((st, i) => (
                              <li key={i} className="flex justify-between items-center bg-gray-50 dark:bg-slate-900/10 px-2.5 py-1.5 rounded-lg border border-gray-100 dark:border-cyan-900/10">
                                <span className="text-gray-700 dark:text-gray-300 font-medium">{st.subject}</span>
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
                          <span className="text-gray-400 italic block py-2 bg-gray-50 dark:bg-slate-900/10 px-3 rounded">No courses assigned yet</span>
                        ) : (
                          <ul className="space-y-2">
                            {cls.courses.map((c, i) => (
                              <li key={i} className="flex flex-col bg-gray-50 dark:bg-slate-900/10 p-2.5 rounded-lg border border-gray-100 dark:border-cyan-900/10">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-gray-900 dark:text-white">{c.code}</span>
                                  <span className="text-xs text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded">{c.credits} Credits</span>
                                </div>
                                <span className="text-gray-700 dark:text-gray-300 font-medium truncate mt-1">{c.title}</span>
                                <span className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">Lecturer: <span className="text-gray-600 dark:text-gray-300 font-medium">{c.lecturer}</span></span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-150 dark:border-cyan-900/15 flex justify-end gap-3" onClick={e => e.stopPropagation()}>
                  <Tooltip content="Edit Class Info">
                    <button 
                      onClick={() => setEditingClass(cls)}
                      className="p-1 px-3 rounded text-gray-505 dark:text-cyan-200 hover:text-cyan-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Details
                    </button>
                  </Tooltip>
                  <Tooltip content="Delete Class Record">
                    <button 
                      onClick={() => cls.id && handleDeleteClass(cls.id)}
                      className="p-1 px-3 rounded text-gray-400 hover:text-red-500 hover:bg-red-500/5 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </Tooltip>
                </div>
              </div>
            );
          })
        )}
        </div>

      {activeClassId && selectedClassObj && (
        <div className="glass-card mt-8 p-6 space-y-6 border border-primary/10" id="class-performance-widget">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-150 dark:border-cyan-900/10 pb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-950 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-6 h-6 text-primary" />
                Class Performance Insights: <span className="text-primary">{selectedClassObj.name}</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">
                Average Student Marks &amp; Academic Scores for {settings.systemMode} Level
              </p>
            </div>
            
            {classStudents.length === 0 && (
              <button
                disabled={isSeeding}
                onClick={handleSeedDemoData}
                className="bg-primary/10 hover:bg-primary/20 text-primary dark:text-cyan-400 px-4 py-1.5 rounded-lg text-xs font-bold border border-primary/20 flex items-center gap-1.5 tracking-wide transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isSeeding ? 'Generating...' : '⚡ Seed Demo Students & Marks'}
              </button>
            )}
          </div>

          {classStudents.length === 0 ? (
            <div className="py-12 text-center text-gray-500 bg-gray-50/50 dark:bg-slate-950/25 border border-dashed rounded-xl border-gray-300 dark:border-cyan-900/30">
              <Award className="w-10 h-10 mx-auto text-gray-400 mb-2 opacity-60" />
              <p className="text-sm font-semibold text-gray-700 dark:text-cyan-200">No student marks directory exists for this class yet.</p>
              <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                Add real students and assign subjects to them inside the <span className="font-bold underline text-primary">Students Directory</span> or use the quick seed button to explore right away.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Recharts average marks bar chart */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-950/30 border border-gray-100 dark:border-cyan-950/20 p-4 rounded-xl flex flex-col justify-between min-h-[350px]">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-1.5">
                    Subject Average Marks (%)
                  </h4>
                </div>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getSubjectsForClass(selectedClassObj, settings.systemMode).map(subj => {
                        const matching = classStudents.filter(s => s.schoolData?.marks?.[subj] !== undefined);
                        const sum = matching.reduce((acc, s) => acc + (s.schoolData.marks?.[subj] || 0), 0);
                        const avg = matching.length > 0 ? Math.round(sum / matching.length) : 0;
                        return {
                          subject: subj,
                          Average: avg,
                          Count: matching.length
                        };
                      })}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis 
                        dataKey="subject" 
                        stroke="#94A3B8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(v) => v.length > 10 ? `${v.substring(0, 8)}..` : v}
                      />
                      <YAxis 
                        stroke="#94A3B8" 
                        fontSize={10} 
                        domain={[0, 100]} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: '#0F172A', 
                          border: 'none', 
                          borderRadius: '8px', 
                          color: '#FFF',
                          fontSize: '12px'
                        }} 
                      />
                      <Bar 
                        dataKey="Average" 
                        fill={settings.themeColor || "#0056b3"} 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={45}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[10px] text-gray-400 dark:text-cyan-200/30 italic text-center">
                  This chart displays real average score calculations computed dynamically from active student database.
                </div>
              </div>

              {/* Right Column: Manage Student Marks */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-950/30 border border-gray-100 dark:border-cyan-950/20 p-4 rounded-xl flex flex-col h-[350px]">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Students Registry ({classStudents.length})
                  </h4>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold font-mono">
                    Marks Registry
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {classStudents.map(student => {
                    const subjects = getSubjectsForClass(selectedClassObj, settings.systemMode);
                    const scores = subjects.map(s => student.schoolData?.marks?.[s]).filter(v => v !== undefined) as number[];
                    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a,b)=>a+b, 0) / scores.length) : null;
                    
                    return (
                      <div 
                        key={student.id} 
                        className="p-3 bg-gray-50/50 dark:bg-slate-900/10 border dark:border-cyan-950/10 rounded-lg flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <span className="font-bold text-gray-900 dark:text-gray-100 block truncate max-w-[150px]">{student.fullName}</span>
                          <span className="text-[10px] text-gray-400 mt-0.5 block">
                            {scores.length} / {subjects.length} subjects graded
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 block font-semibold">Average</span>
                            <span className={`font-mono font-bold text-sm ${
                              avgScore === null ? 'text-gray-450' : avgScore >= 75 ? 'text-emerald-500' : avgScore >= 50 ? 'text-amber-500' : 'text-rose-500'
                            }`}>
                              {avgScore !== null ? `${avgScore}%` : 'N/A'}
                            </span>
                          </div>
                          
                          <Tooltip content="Edit student grades">
                            <button
                              onClick={() => setEditingStudentMarks(student)}
                              className="p-1.5 hover:bg-primary/10 hover:text-primary dark:hover:bg-cyan-500/10 dark:hover:text-cyan-400 text-gray-500 rounded transition-all cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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

      {editingStudentMarks && (
        <StudentMarksModal
          student={editingStudentMarks}
          subjects={getSubjectsForClass(selectedClassObj!, settings.systemMode)}
          onClose={() => setEditingStudentMarks(null)}
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

function StudentMarksModal({ student, subjects, onClose }: { student: Student; subjects: string[]; onClose: () => void }) {
  const [marksState, setMarksState] = useState<{ [sub: string]: string }>(() => {
    const initial: { [sub: string]: string } = {};
    for (const sub of subjects) {
      initial[sub] = (student.schoolData?.marks?.[sub] ?? '').toString();
    }
    return initial;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedMarks: { [sub: string]: number } = {};
    for (const sub of subjects) {
      const val = parseFloat(marksState[sub]);
      updatedMarks[sub] = isNaN(val) ? 0 : Math.min(100, Math.max(0, val));
    }

    if (student.id) {
      const s = await db.students.get(student.id);
      if (s) {
        if (!s.schoolData) s.schoolData = {};
        s.schoolData.marks = updatedMarks;
        await db.students.put(s);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border dark:border-cyan-900/40 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-cyan-900/10 bg-gray-50/50 dark:bg-slate-950/20">
          <h4 className="font-bold text-gray-950 dark:text-white">Edit Academic Marks: {student.fullName}</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-cyan-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {subjects.map(sub => (
            <div key={sub} className="flex justify-between items-center bg-gray-50 dark:bg-slate-950/20 p-2.5 rounded-lg border border-gray-150 dark:border-cyan-950/10">
              <span className="text-xs font-bold text-gray-750 dark:text-cyan-200 uppercase tracking-wide">{sub}</span>
              <div className="flex items-center gap-1.5 flex-row">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={marksState[sub]}
                  onChange={e => setMarksState({ ...marksState, [sub]: e.target.value })}
                  className="w-16 text-center py-1.5 bg-white dark:bg-slate-900 border border-gray-250 dark:border-cyan-950/20 rounded text-xs text-gray-900 dark:text-white font-bold"
                  placeholder="e.g. 85"
                />
                <span className="text-xs text-gray-400 font-bold">%</span>
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-cyan-900/10">
            <button type="button" onClick={onClose} className="px-3 py-1.5 border border-gray-300 dark:border-cyan-900/45 rounded text-xs hover:bg-gray-55 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200">Cancel</button>
            <button type="submit" className="px-3 py-1.5 bg-primary text-white font-semibold rounded text-xs hover:bg-primary/95">Save Marks</button>
          </div>
        </form>
      </div>
    </div>
  );
}
