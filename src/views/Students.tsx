import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Search, Plus, X, Upload, Trash2, Edit2, Share2, Download, Users, CheckSquare, CreditCard, UserX, Image as ImageIcon } from 'lucide-react';
import type { Student, Guardian } from '../types';
import { getSettings } from '../db';
import { downloadPDF, downloadElementAsPDF, downloadElementAsImage } from '../utils/pdf';
import Tooltip from '../components/Tooltip';
import AttendanceTracker from './AttendanceTracker';
import StudentIDCard from '../components/StudentIDCard';

export default function Students() {
  const [activeTab, setActiveTab] = useState<'directory' | 'attendance'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [previewStudentId, setPreviewStudentId] = useState<number | null>(null);

  // Example subset fetch - usually you'd filter in query but dexie makes full text search a bit manual
  const students = useLiveQuery(
    async () => {
      const all = await db.students.reverse().toArray();
      if (!searchQuery) return all;
      const lowerQ = searchQuery.toLowerCase();
      return all.filter(s => 
        s.fullName.toLowerCase().includes(lowerQ) || 
        s.nationalId.toLowerCase().includes(lowerQ)
      );
    },
    [searchQuery]
  );

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudentIds(new Set(students?.map(s => s.id!).filter(Boolean) || []));
    } else {
      setSelectedStudentIds(new Set());
    }
  };

  const toggleSelectStudent = (e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>, id: number) => {
    e.stopPropagation();
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStudentIds(newSet);
  };

  const handleBulkPrint = () => {
    const el = document.getElementById('bulk-print-container');
    if (el) {
      downloadElementAsPDF(el, `Bulk_Student_ID_Cards.pdf`, false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Students &amp; Attendance</h2>
          <p className="text-gray-500 mt-1">Manage student profiles, guardians, and daily attendance logs.</p>
        </div>
        {activeTab === 'directory' && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.print()}
              className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-cyan-900/40 text-gray-750 dark:text-gray-300 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              Print List
            </button>
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Student
            </button>
          </div>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-gray-200 dark:border-cyan-900/15 print:hidden">
        <button
          onClick={() => setActiveTab('directory')}
          className={`py-2 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'directory' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-gray-400 hover:text-gray-750 dark:hover:text-cyan-300'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Students Directory
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`py-2 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'attendance' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-gray-400 hover:text-gray-750 dark:hover:text-cyan-300'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          Attendance Tracking
        </button>
      </div>

      {activeTab === 'directory' ? (
        <>
          <div className="table-container print:border-none print:shadow-none">
            <div className="p-4 border-b border-gray-250 dark:border-cyan-900/20 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-cyan-500/50 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search by name or ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-950/45 border border-gray-150 dark:border-cyan-900/30 rounded-lg text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-gray-550 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>
              {selectedStudentIds.size > 0 && (
                <button
                  onClick={handleBulkPrint}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-primary/90 flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" /> Print {selectedStudentIds.size} IDs
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="table-header sticky top-0">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                        checked={students?.length ? selectedStudentIds.size === students.length : false}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="py-3 px-4 font-semibold">Name</th>
                    <th className="py-3 px-4 font-semibold">Student ID</th>
                    <th className="py-3 px-4 font-semibold">Gender</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-cyan-900/10 text-sm">
                  {students?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <UserX className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" strokeWidth={1} />
                        <h3 className="text-gray-900 dark:text-gray-200 font-bold text-lg mb-1">No students registered</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto mb-4">You haven't added any students yet. Register your first student or use the CSV bulk importer in the Settings view.</p>
                        <button 
                          onClick={() => setIsAdding(true)}
                          className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-cyan-400 px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/20 transition-colors inline-flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Add your first student
                        </button>
                      </td>
                    </tr>
                  ) : (
                    students?.map(student => (
                      <tr 
                        key={student.id} 
                        onClick={() => setSelectedStudent(student)}
                        className="table-row cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            checked={student.id ? selectedStudentIds.has(student.id) : false}
                            onChange={(e) => { e.stopPropagation(); toggleSelectStudent(e as any, student.id!); }}
                          />
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-950 dark:text-white">{student.fullName}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-cyan-100/70">{student.nationalId}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-cyan-100/70">{student.gender}</td>
                        <td className="py-3 px-4 text-right">
                          <button 
                            className="p-1.5 text-gray-400 hover:text-primary dark:text-cyan-500 rounded bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors inline-flex"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewStudentId(student.id!);
                            }}
                            title="Preview ID Card"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {isAdding && (
            <StudentModal onClose={() => setIsAdding(false)} />
          )}

          {/* Off-screen Bulk Print Container */}
          <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}>
            <div id="bulk-print-container" className="flex flex-wrap items-start justify-start gap-4 p-4" style={{ width: '1024px', background: 'white' }}>
              {students?.filter(s => selectedStudentIds.has(s.id!)).map(student => (
                <div key={student.id} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <StudentIDCard id={`bulk-id-card-${student.id}`} student={student} />
                </div>
              ))}
            </div>
          </div>

          {editingStudent && (
            <StudentModal 
              initialData={editingStudent} 
              onClose={() => { setEditingStudent(null); setSelectedStudent(null); }} 
            />
          )}

          {previewStudentId && students && (
            <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewStudentId(null)}>
              <div 
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-cyan-900/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-8 flex items-center justify-center bg-gray-50/50 dark:bg-slate-950/20 border-r border-gray-200 dark:border-cyan-900/30" id="preview-id-wrapper">
                  <StudentIDCard id="preview-student-id-card" student={students.find(s => s.id === previewStudentId)!} style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }} />
                </div>
                <div className="p-8 flex flex-col justify-center min-w-[200px] gap-4">
                  <h3 className="font-black text-xl text-gray-900 dark:text-white mb-2">ID Card Preview</h3>
                  
                  <button 
                    onClick={() => {
                      const el = document.getElementById('preview-student-id-card');
                      if (el) downloadElementAsPDF(el, `${students.find(s => s.id === previewStudentId)!.fullName}_ID.pdf`, true);
                    }}
                    className="flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-bold shadow hover:bg-primary/90 transition-colors"
                  >
                    <Download className="w-5 h-5" /> Download PDF
                  </button>
                  
                  <button 
                    onClick={() => {
                      const el = document.getElementById('preview-student-id-card');
                      if (el) downloadElementAsImage(el, `${students.find(s => s.id === previewStudentId)!.fullName}_ID.jpg`);
                    }}
                    className="flex items-center gap-2 px-4 py-3 bg-cyan-600 text-white rounded-xl font-bold shadow hover:bg-cyan-700 transition-colors"
                  >
                    <Download className="w-5 h-5" /> Download JPEG
                  </button>

                  <button 
                    onClick={() => {
                      const el = document.getElementById('preview-student-id-card');
                      if (el) {
                        const win = window.open('', '_blank');
                        if (win) {
                          win.document.write('<html><head><title>Print ID Card</title>');
                          win.document.write('<style>@media print { body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; } } body { display: flex; justify-content: center; padding: 20px; background: #f0f0f0; }</style>');
                          win.document.write('</head><body>');
                          win.document.write(el.outerHTML);
                          win.document.write('<script>setTimeout(function() { window.print(); window.close(); }, 500);</script>');
                          win.document.write('</body></html>');
                          win.document.close();
                        }
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-xl font-bold shadow hover:bg-slate-900 transition-colors"
                  >
                    <CreditCard className="w-5 h-5" /> Print ID
                  </button>

                  <button 
                    onClick={() => setPreviewStudentId(null)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-cyan-100 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors mt-auto"
                  >
                    Close Preview
                  </button>
                </div>
                <button onClick={() => setPreviewStudentId(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-cyan-400 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {selectedStudent && !editingStudent && (
            <StudentDetailsModal 
              student={selectedStudent} 
              onClose={() => setSelectedStudent(null)} 
              onEdit={() => setEditingStudent(selectedStudent)}
            />
          )}
        </>
      ) : (
        <AttendanceTracker />
      )}
    </div>
  );
}

const SUBJECT_OPTIONS = [
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

function StudentModal({ onClose, initialData }: { onClose: () => void, initialData?: Student }) {
  const settings = getSettings();
  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [dob, setDob] = useState(initialData?.dob || '');
  const [gender, setGender] = useState<'Male'|'Female'|'Other'>(initialData?.gender || 'Male');
  const [nationalId, setNationalId] = useState(initialData?.nationalId || '');
  const [physicalAddress, setPhysicalAddress] = useState(initialData?.physicalAddress || '');
  const [profilePhoto, setProfilePhoto] = useState<string>(initialData?.profilePhoto || '');
  
  React.useEffect(() => {
    if (!initialData?.nationalId) {
      db.students.toArray().then(students => {
        let maxId = 0;
        students.forEach(s => {
          const match = s.nationalId?.match(/^STU-(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxId) maxId = num;
          }
        });
        const nextId = `STU-${String(maxId + 1).padStart(5, '0')}`;
        setNationalId(nextId);
      });
    }
  }, [initialData]);
  
  const [guardians, setGuardians] = useState<Guardian[]>(initialData?.guardianData?.length ? initialData.guardianData : [{ name: '', relation: '', contact: '', address: '' }]);
  const [classId, setClassId] = useState<string>(initialData?.schoolData?.classId?.toString() || '');
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>(initialData?.schoolData?.assignedSubjects || []);
  
  const classes = useLiveQuery(() => db.classes.toArray(), []) || [];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGuardianChange = (index: number, field: keyof Guardian, value: string) => {
    const updated = [...guardians];
    updated[index] = { ...updated[index], [field]: value };
    setGuardians(updated);
  };

  const addGuardian = () => {
    setGuardians([...guardians, { name: '', relation: '', contact: '', address: '' }]);
  };

  const removeGuardian = (index: number) => {
    setGuardians(guardians.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validGuardians = guardians.filter(g => g.name.trim() !== '');

    const studentData = {
      fullName, dob, gender, nationalId, physicalAddress,
      profilePhoto,
      guardianData: validGuardians, 
      schoolData: {
        classId: classId ? parseInt(classId) : undefined,
        assignedSubjects: settings.systemMode === 'Secondary' ? assignedSubjects : undefined
      }
    };

    if (initialData?.id) {
      await db.students.put({ ...studentData, id: initialData.id });
    } else {
      await db.students.add(studentData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border dark:border-cyan-900/30 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-cyan-900/40 bg-gray-50/50 dark:bg-slate-950/20">
          <h3 className="font-bold text-lg text-gray-950 dark:text-gray-100">Add New Student</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-cyan-400"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form id="student-form" onSubmit={handleSave} className="space-y-8">
            {/* Personal Information */}
            <section className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-950 dark:text-cyan-400 uppercase tracking-wider border-b border-gray-200 dark:border-cyan-900/20 pb-2">Personal Information</h4>
              
              <div className="flex gap-6 items-start">
                {/* Photo Upload */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-slate-950/40 border-2 border-dashed border-gray-300 dark:border-cyan-900/30 rounded-full flex flex-col items-center justify-center overflow-hidden relative group">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-6 h-6 text-gray-400 dark:text-cyan-300/60" />
                    )}
                    <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-10 text-xs font-medium">
                      <span>Upload</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-cyan-200/40">Profile Photo</span>
                </div>
 
                <div className="flex-1 space-y-4 min-w-0">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-cyan-100/70 mb-1">Full Name</label>
                    <input required type="text" value={fullName} onChange={e=>setFullName(e.target.value)} className="input-field" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-cyan-100/70 mb-1">Date of Birth</label>
                      <input required type="date" value={dob} onChange={e=>setDob(e.target.value)} className="input-field [color-scheme:light] dark:[color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-cyan-100/70 mb-1">Gender</label>
                      <select value={gender} onChange={e=>setGender(e.target.value as any)} className="input-field">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
 
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-cyan-100/70 mb-1">Student ID</label>
                <input required type="text" value={nationalId} onChange={e=>setNationalId(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-cyan-100/70 mb-1">Physical Address</label>
                <textarea required value={physicalAddress} onChange={e=>setPhysicalAddress(e.target.value)} className="input-field" rows={2} />
              </div>
            </section>
 
            {/* School Details */}
            <section className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-950 dark:text-cyan-400 uppercase tracking-wider border-b border-gray-200 dark:border-cyan-900/20 pb-2">School Details</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-cyan-100/70 mb-1">Assign Class</label>
                <select value={classId} onChange={e=>setClassId(e.target.value)} className="input-field">
                  <option value="">No Class Assigned</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
 
              {settings.systemMode === 'Secondary' && (
                <div className="pt-2">
                  <label className="block text-sm font-semibold text-gray-750 dark:text-cyan-100/90 mb-2">Assign Secondary Subjects</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 border border-gray-200 dark:border-cyan-900/30 rounded-lg bg-gray-50/55 dark:bg-slate-950/20">
                    {SUBJECT_OPTIONS.map(subj => {
                      const isChecked = assignedSubjects.includes(subj);
                      return (
                        <label key={subj} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-gray-150/50 dark:hover:bg-slate-800/50 rounded text-xs select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setAssignedSubjects(assignedSubjects.filter(s => s !== subj));
                              } else {
                                setAssignedSubjects([...assignedSubjects, subj]);
                              }
                            }}
                            className="rounded border-gray-300 dark:border-cyan-900/40 text-primary focus:ring-primary h-4 w-4"
                          />
                          <span className="text-gray-700 dark:text-cyan-100/85 font-medium">{subj}</span>
                        </label>
                      );
                    })}
                  </div>
                  <span className="text-xs text-gray-400 dark:text-cyan-200/40 mt-1 block">Checked subjects will be assigned to this secondary student.</span>
                </div>
              )}
            </section>
 
            {/* Guardian Data */}
            <section className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-cyan-900/20 pb-2">
                <h4 className="text-sm font-semibold text-gray-950 dark:text-cyan-400 uppercase tracking-wider">Guardian Data</h4>
                <button type="button" onClick={addGuardian} className="text-sm text-primary dark:text-cyan-400 font-semibold flex items-center gap-1 hover:underline">
                  <Plus className="w-4 h-4" /> Add Guardian
                </button>
              </div>
              
              {guardians.map((guardian, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-slate-950/20 rounded-lg border border-gray-200 dark:border-cyan-900/30 space-y-4 relative">
                  {guardians.length > 1 && (
                    <button type="button" onClick={() => removeGuardian(index)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-750 dark:text-cyan-100/70 mb-1">Guardian Name</label>
                      <input required type="text" value={guardian.name} onChange={e=>handleGuardianChange(index, 'name', e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-750 dark:text-cyan-100/70 mb-1">Relation</label>
                      <input required type="text" placeholder="e.g. Mother, Father" value={guardian.relation} onChange={e=>handleGuardianChange(index, 'relation', e.target.value)} className="input-field" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-750 dark:text-cyan-100/70 mb-1">Contact Number</label>
                      <input required type="text" value={guardian.contact} onChange={e=>handleGuardianChange(index, 'contact', e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-750 dark:text-cyan-100/70 mb-1">Physical Address</label>
                      <input required type="text" value={guardian.address} onChange={e=>handleGuardianChange(index, 'address', e.target.value)} className="input-field" />
                    </div>
                  </div>
                </div>
              ))}
            </section>
          </form>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-cyan-900/30 bg-gray-50 dark:bg-slate-950/20 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} type="button" className="px-4 py-2 text-gray-650 dark:text-cyan-150/70 font-medium hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
          <button form="student-form" type="submit" className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm">Save Student</button>
        </div>
      </div>
    </div>
  );
}

function StudentDetailsModal({ student, onClose, onEdit }: { student: Student, onClose: () => void, onEdit: () => void }) {
  const settings = getSettings();
  const classes = useLiveQuery(() => db.classes.toArray(), []) || [];
  const assignedClass = classes.find(c => c.id === student.schoolData.classId);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this student record?')) {
      if (student.id) {
        await db.students.delete(student.id);
        onClose();
      }
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Student: ${student.fullName}`,
          text: `Student Details:\nName: ${student.fullName}\nStudent ID: ${student.nationalId}\nClass: ${assignedClass?.name || 'Unassigned'}`,
        });
      } else {
        alert('Sharing is not supported on this browser.');
      }
    } catch (err) {
      console.log('Share failed', err);
    }
  };

  const generatePDF = () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${student.fullName} - Student Profile</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #111; line-height: 1.5; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { display: flex; align-items: center; border-bottom: 2px solid #EEE; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { height: 80px; width: 80px; object-fit: contain; margin-right: 20px; }
            .school-info h1 { margin: 0 0 5px 0; font-size: 24px; color: ${settings.themeColor}; }
            .school-info p { margin: 0; color: #555; font-size: 14px; }
            .section { margin-bottom: 30px; page-break-inside: avoid; }
            .section h2 { font-size: 16px; border-bottom: 1px solid #EEE; padding-bottom: 5px; margin-bottom: 15px; color: #333; text-transform: uppercase; letter-spacing: 1px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 2px; }
            .value { font-size: 16px; font-weight: 500; }
            .guardian-card { background: #F9F9F9; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #EEE; }
            .prof-photo { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin-bottom: 15px; border: 3px solid #EEE; }
            .footer { margin-top: 40px; border-top: 1px solid #EEE; padding-top: 20px; text-align: center; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            ${settings.schoolLogo ? `<img src="${settings.schoolLogo}" class="logo" />` : ''}
            <div class="school-info">
              <h1>${settings.schoolName}</h1>
              <p>${settings.schoolMotto}</p>
              <p>${settings.schoolContact} | ${settings.schoolAddress}</p>
            </div>
          </div>

          <div style="text-align: center;">
             ${student.profilePhoto ? `<img src="${student.profilePhoto}" class="prof-photo" />` : ''}
             <h2 style="font-size: 28px; margin: 0 0 5px 0;">${student.fullName}</h2>
             <p style="margin: 0 0 20px 0; color: #666; font-size: 16px;">Student ID: ${student.nationalId}</p>
          </div>

          <div class="section">
            <h2>Personal Information</h2>
            <div class="grid">
              <div><div class="label">Date of Birth</div><div class="value">${student.dob}</div></div>
              <div><div class="label">Gender</div><div class="value">${student.gender}</div></div>
              <div style="grid-column: 1 / -1"><div class="label">Physical Address</div><div class="value">${student.physicalAddress}</div></div>
            </div>
          </div>

           <div class="section">
            <h2>School Data</h2>
            <div class="grid">
              <div><div class="label">Assigned Class</div><div class="value">${assignedClass?.name || 'Not Assigned'}</div></div>
              ${settings.systemMode === 'Secondary' ? `
                <div style="grid-column: 1 / -1; margin-top: 10px;">
                  <div class="label">Assigned Subjects</div>
                  <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px;">
                    ${(student.schoolData?.assignedSubjects || []).map(subj => `<span style="background: #E0F2FE; color: ${settings.themeColor}; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">${subj}</span>`).join('')}
                    ${(!student.schoolData?.assignedSubjects || student.schoolData.assignedSubjects.length === 0) ? '<span style="color: #999; font-style: italic;">None Assigned</span>' : ''}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="section">
            <h2>Guardian Data</h2>
            ${student.guardianData.map(g => `
              <div class="guardian-card">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                  <span style="font-weight: bold; font-size: 16px;">${g.name}</span>
                  <span style="color: ${settings.themeColor}; font-weight: 500;">${g.relation}</span>
                </div>
                <div style="font-size: 14px; margin-bottom: 2px;">${g.contact}</div>
                <div style="font-size: 14px; color: #666;">${g.address}</div>
              </div>
            `).join('')}
            ${student.guardianData.length === 0 ? '<p style="color: #666;">No guardians recorded.</p>' : ''}
          </div>

          <div class="footer">
            Generated by Comfort School Manager &bull; ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;

    downloadPDF(html, `${student.fullName.replace(/\s+/g, '_')}_Profile.pdf`);
  };

  const generateIDCard = () => {
    const el = document.getElementById(`student-id-card-${student.id || 'new'}`);
    if (el) {
      downloadElementAsPDF(el, `${student.fullName.replace(/\s+/g, '_')}_IDCard.pdf`, true);
    }
  };

  const generateIDCardImage = () => {
    const el = document.getElementById(`student-id-card-${student.id || 'new'}`);
    if (el) {
      downloadElementAsImage(el, `${student.fullName.replace(/\s+/g, '_')}_IDCard.jpg`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Hidden ID Card for PDF Generation */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}>
        <StudentIDCard id={`student-id-card-${student.id || 'new'}`} student={{ ...student, schoolData: { ...student.schoolData, assignedClass: assignedClass?.name } }} />
      </div>

      <div className="bg-white dark:bg-slate-900 border dark:border-cyan-900/30 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-gray-200 dark:border-cyan-900/30 bg-gray-50/50 dark:bg-slate-950/20 relative gap-4">
          <div className="flex gap-4 items-center pr-8 sm:pr-0 width-full">
            <div className="w-16 h-16 bg-gray-200 dark:bg-slate-950/40 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-gray-300 dark:border-cyan-900/30">
              {student.profilePhoto ? (
                <img src={student.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-gray-500 dark:text-cyan-300 font-bold">{student.fullName.charAt(0)}</span>
              )}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-950 dark:text-white leading-tight">{student.fullName}</h2>
              <p className="text-sm text-gray-500 dark:text-cyan-100/50">Student ID: {student.nationalId || 'N/A'}</p>
            </div>
          </div>
          
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-cyan-400 bg-gray-200 dark:bg-slate-800 rounded-full transition-colors z-10 hover:bg-gray-300 shadow-sm cursor-pointer">
            <X className="w-4 h-4"/>
          </button>
          
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-gray-200 dark:border-cyan-900/30">
            <Tooltip content="Edit student details & assignments">
              <button onClick={onEdit} className="p-2.5 sm:p-2 text-gray-700 dark:text-cyan-200 hover:text-primary dark:hover:text-cyan-400 bg-white sm:bg-gray-100 dark:bg-slate-800 border sm:border-none border-gray-200 dark:border-cyan-900/40 rounded-xl sm:rounded-full transition-all shadow-sm sm:shadow-none min-w-[44px] flex justify-center cursor-pointer" title="Edit Student">
                <Edit2 className="w-5 h-5 sm:w-4 sm:h-4"/>
              </button>
            </Tooltip>
            <Tooltip content="Copy student sharing text summary">
              <button onClick={handleShare} className="p-2.5 sm:p-2 text-gray-700 dark:text-cyan-200 hover:text-primary dark:hover:text-cyan-400 bg-white sm:bg-gray-100 dark:bg-slate-800 border sm:border-none border-gray-200 dark:border-cyan-900/40 rounded-xl sm:rounded-full transition-all shadow-sm sm:shadow-none min-w-[44px] flex justify-center cursor-pointer" title="Share Student Record">
                <Share2 className="w-5 h-5 sm:w-4 sm:h-4"/>
              </button>
            </Tooltip>
            <Tooltip content="Download Printable ID Card (PDF)">
              <button onClick={generateIDCard} className="p-2.5 sm:p-2 text-gray-700 dark:text-cyan-200 hover:text-primary dark:hover:text-cyan-400 bg-white sm:bg-gray-100 dark:bg-slate-800 border sm:border-none border-gray-200 dark:border-cyan-900/40 rounded-xl sm:rounded-full transition-all shadow-sm sm:shadow-none min-w-[44px] flex justify-center cursor-pointer" title="Download ID Card (PDF)">
                <CreditCard className="w-5 h-5 sm:w-4 sm:h-4"/>
              </button>
            </Tooltip>
            <Tooltip content="Download Printable ID Card (JPEG)">
              <button onClick={generateIDCardImage} className="p-2.5 sm:p-2 text-gray-700 dark:text-cyan-200 hover:text-primary dark:hover:text-cyan-400 bg-white sm:bg-gray-100 dark:bg-slate-800 border sm:border-none border-gray-200 dark:border-cyan-900/40 rounded-xl sm:rounded-full transition-all shadow-sm sm:shadow-none min-w-[44px] flex justify-center cursor-pointer" title="Download ID Card (JPEG)">
                <ImageIcon className="w-5 h-5 sm:w-4 sm:h-4"/>
              </button>
            </Tooltip>
            <Tooltip content="Export full profile as PDF report">
              <button onClick={generatePDF} className="p-2.5 sm:p-2 text-gray-700 dark:text-cyan-200 hover:text-primary dark:hover:text-cyan-400 bg-white sm:bg-gray-100 dark:bg-slate-800 border sm:border-none border-gray-200 dark:border-cyan-900/40 rounded-xl sm:rounded-full transition-all shadow-sm sm:shadow-none min-w-[44px] flex justify-center cursor-pointer" title="Download PDF">
                <Download className="w-5 h-5 sm:w-4 sm:h-4"/>
              </button>
            </Tooltip>
            <Tooltip content="Delete student record permanently">
              <button onClick={handleDelete} className="p-2.5 sm:p-2 text-gray-700 dark:text-red-400 hover:text-red-650 bg-white sm:bg-gray-100 dark:bg-slate-800 hover:bg-red-50 sm:hover:bg-red-50 dark:hover:bg-red-950/50 border sm:border-none border-gray-200 dark:border-red-900/30 rounded-xl sm:rounded-full transition-all shadow-sm sm:shadow-none min-w-[44px] flex justify-center cursor-pointer" title="Delete Student">
                <Trash2 className="w-5 h-5 sm:w-4 sm:h-4"/>
              </button>
            </Tooltip>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-8">
          <section>
            <h3 className="text-sm font-semibold text-gray-950 dark:text-cyan-400 uppercase tracking-wider mb-4 border-b border-gray-200 dark:border-cyan-900/20 pb-2">Personal Information</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div><span className="block text-xs font-bold text-gray-400 dark:text-cyan-100/40 uppercase tracking-wider mb-1">Date of Birth</span><span className="font-semibold text-gray-955 dark:text-cyan-100/90">{student.dob}</span></div>
              <div><span className="block text-xs font-bold text-gray-400 dark:text-cyan-100/40 uppercase tracking-wider mb-1">Gender</span><span className="font-semibold text-gray-955 dark:text-cyan-100/90">{student.gender}</span></div>
              <div className="col-span-2"><span className="block text-xs font-bold text-gray-400 dark:text-cyan-100/40 uppercase tracking-wider mb-1">Physical Address</span><span className="font-semibold text-gray-955 dark:text-cyan-100/90">{student.physicalAddress}</span></div>
            </div>
          </section>
 
          <section>
            <h3 className="text-sm font-semibold text-gray-950 dark:text-cyan-400 uppercase tracking-wider mb-4 border-b border-gray-200 dark:border-cyan-900/20 pb-2">Guardian Data</h3>
            {student.guardianData.length === 0 ? (
              <p className="text-sm text-gray-550 dark:text-cyan-200/40 italic">No guardians recorded.</p>
            ) : (
              <div className="space-y-4">
                {student.guardianData.map((g, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-slate-950/20 border border-gray-150 dark:border-cyan-900/20 p-4 rounded-lg flex flex-col gap-1 text-sm">
                    <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                      <span>{g.name}</span>
                      <span className="text-primary dark:text-cyan-400 text-xs px-2.5 py-0.5 rounded-full bg-primary/5 dark:bg-cyan-500/10 font-bold uppercase">{g.relation}</span>
                    </div>
                    <div className="text-gray-650 dark:text-cyan-100/70 mt-1 font-medium"><span className="text-xs text-gray-400 dark:text-cyan-200/40 font-bold block uppercase">Phone Contact</span>{g.contact}</div>
                    <div className="text-gray-650 dark:text-cyan-100/70 mt-1 font-medium"><span className="text-xs text-gray-400 dark:text-cyan-200/40 font-bold block uppercase font-medium">Residence Address</span>{g.address}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
 
          <section>
            <h3 className="text-sm font-semibold text-gray-955 dark:text-cyan-400 uppercase tracking-wider mb-4 border-b border-gray-200 dark:border-cyan-900/20 pb-2">School Data</h3>
            <div className="text-sm space-y-4">
              <div className="bg-gray-50 dark:bg-slate-950/20 border border-gray-150 dark:border-cyan-900/20 p-4 rounded-lg">
                <span className="text-xs font-bold text-gray-400 dark:text-cyan-200/40 uppercase tracking-wider block mb-1">Assigned Class</span>
                <span className="font-bold text-base text-gray-950 dark:text-white">{assignedClass?.name || 'Not Assigned'}</span>
              </div>
              
              {settings.systemMode === 'Secondary' && (
                <div>
                  <span className="block text-xs font-bold text-gray-400 dark:text-cyan-200/40 uppercase tracking-wider mb-2">Assigned Subjects</span>
                  {(!student.schoolData?.assignedSubjects || student.schoolData.assignedSubjects.length === 0) ? (
                    <span className="text-gray-400 dark:text-cyan-200/40 italic font-medium">No subjects assigned yet.</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {student.schoolData.assignedSubjects.map(subj => (
                        <span key={subj} className="bg-primary/5 dark:bg-cyan-500/10 text-primary dark:text-cyan-400 border border-primary/20 dark:border-cyan-500/20 px-2.5 py-1 rounded-md text-xs font-bold">
                          {subj}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
