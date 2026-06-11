import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Search, Plus, X, Upload, Trash2, Edit2, Share2, Download, Users, CheckSquare, CreditCard, UserX } from 'lucide-react';
import type { Student, Guardian } from '../types';
import { getSettings } from '../db';
import { downloadPDF } from '../utils/pdf';
import Tooltip from '../components/Tooltip';
import AttendanceTracker from './AttendanceTracker';

export default function Students() {
  const [activeTab, setActiveTab] = useState<'directory' | 'attendance'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

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
            <div className="p-4 border-b border-gray-250 dark:border-cyan-900/20 flex items-center gap-3 print:hidden">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-cyan-500/50 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search by name or ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-950/45 border border-gray-150 dark:border-cyan-900/30 rounded-lg text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-gray-550 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="table-header sticky top-0">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Name</th>
                    <th className="py-3 px-4 font-semibold">Student ID</th>
                    <th className="py-3 px-4 font-semibold">Gender</th>
                    <th className="py-3 px-4 font-semibold">DOB</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-cyan-900/10 text-sm">
                  {students?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-16 text-center">
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
                        <td className="py-3 px-4 font-bold text-gray-950 dark:text-white">{student.fullName}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-cyan-100/70">{student.nationalId}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-cyan-100/70">{student.gender}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-cyan-100/70">{student.dob}</td>
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

          {editingStudent && (
            <StudentModal 
              initialData={editingStudent} 
              onClose={() => { setEditingStudent(null); setSelectedStudent(null); }} 
            />
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border dark:border-cyan-900/30 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${student.fullName} - ID Card</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
            
            body { 
              font-family: 'Inter', system-ui, -apple-system, sans-serif; 
              padding: 20px; 
              display: flex; 
              justify-content: center; 
              align-items: center;
              background: #f0f4f8;
              margin: 0;
            }
            .id-card { 
              width: 320px; 
              height: 480px; 
              background: white;
              border-radius: 16px; 
              position: relative; 
              overflow: hidden; 
              box-shadow: 0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05); 
              display: flex; 
              flex-direction: column;
              align-items: center;
              text-align: center;
              box-sizing: border-box;
            }
            .background-pattern {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 135px;
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              z-index: 1;
            }
            .background-pattern::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 6px;
              background: linear-gradient(90deg, #0ea5e9, #38bdf8);
            }
            .content-wrapper { 
              z-index: 2; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              padding: 20px 24px; 
              height: 100%; 
              width: 100%;
              box-sizing: border-box;
            }
            .school-header {
              display: flex;
              flex-direction: column;
              align-items: center;
              width: 100%;
              margin-bottom: 20px;
            }
            .school-logo { 
              width: 44px; 
              height: 44px; 
              object-fit: contain; 
              background: white; 
              border-radius: 10px; 
              padding: 4px; 
              box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
              margin-bottom: 6px; 
            }
            .school-name { 
              font-size: 14px; 
              font-weight: 800; 
              color: white; 
              text-transform: uppercase;
              letter-spacing: 0.5px;
              line-height: 1.2;
              width: 100%;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            
            .photo-container {
              position: relative;
              margin-bottom: 12px;
              margin-top: -5px;
            }
            .photo { 
              width: 100px; 
              height: 100px; 
              border-radius: 50%; 
              object-fit: cover; 
              border: 4px solid white; 
              box-shadow: 0 6px 12px rgba(0,0,0,0.15); 
              background: #f8fafc; 
            }
            
            .student-info {
              display: flex;
              flex-direction: column;
              align-items: center;
              width: 100%;
              margin-bottom: auto;
            }
            .name { 
              font-size: 20px; 
              font-weight: 800; 
              color: #0f172a; 
              line-height: 1.2; 
              margin-bottom: 4px;
              width: 100%;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            .role { 
              font-size: 11px; 
              color: #0ea5e9; 
              font-weight: 800; 
              text-transform: uppercase; 
              letter-spacing: 1.5px;
            }
            
            .info-grid { 
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              width: 100%; 
              background: #f8fafc;
              border-radius: 10px;
              padding: 10px;
              margin-bottom: 16px;
              border: 1px solid #e2e8f0;
            }
            .info-block { display: flex; flex-direction: column; align-items: center; max-width: 100%; }
            .info-label { font-size: 9px; color: #64748b; text-transform: uppercase; margin-bottom: 2px; font-weight: 700; letter-spacing: 0.5px;}
            .info-value { font-size: 12px; color: #0f172a; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; width: 100%;}
            
            .footer-section {
              display: flex;
              flex-direction: column;
              align-items: center;
              width: 100%;
            }
            .qr-code { 
              width: 90px; 
              height: 90px; 
              margin-bottom: 6px;
              border-radius: 8px;
              padding: 4px;
              background: white;
              border: 1px solid #e2e8f0;
            }
            .id-number {
              font-size: 11px;
              color: #64748b;
              font-variant-numeric: tabular-nums;
              font-weight: 600;
              letter-spacing: 1px;
            }
            .footer-strip {
              position: absolute; 
              bottom: 0; left: 0; width: 100%; height: 8px; 
              background: linear-gradient(90deg, #0ea5e9, #38bdf8);
            }
            @media print {
              body { background: white; padding: 0; }
              .id-card { box-shadow: none; border: 1px solid #e2e8f0; }
              .background-pattern { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .footer-strip { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .content-wrapper { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .qr-code, .photo, .info-grid { border-width: 1px; border-style: solid; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .photo { border-color: white; }
            }
          </style>
        </head>
        <body>
          <div class="id-card">
            <div class="background-pattern"></div>
            <div class="content-wrapper">
              <div class="school-header">
                ${settings.schoolLogo ? `<img src="${settings.schoolLogo}" class="school-logo" />` : ''}
                <div class="school-name">${settings.schoolName || 'School Name'}</div>
              </div>
              
              <div class="photo-container">
                  ${student.profilePhoto 
                    ? `<img src="${student.profilePhoto}" class="photo" />` 
                    : `<div class="photo" style="display:flex;align-items:center;justify-content:center;font-size:36px;color:#94a3b8;font-weight:800;">${student.fullName.charAt(0)}</div>`
                  }
              </div>
              
              <div class="student-info">
                <div class="name">${student.fullName}</div>
                <div class="role">Student</div>
              </div>

              <div class="info-grid">
                <div class="info-block">
                  <span class="info-label">Class</span>
                  <span class="info-value">${assignedClass?.name || 'Unassigned'}</span>
                </div>
                <div class="info-block">
                  <span class="info-label">Date of Birth</span>
                  <span class="info-value">${student.dob || '-'}</span>
                </div>
              </div>

              <div class="footer-section">
                ${student.nationalId 
                  ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=${encodeURIComponent(student.nationalId || student.id?.toString() || 'student')}" class="qr-code" crossorigin="anonymous" />`
                  : `<div style="width:90px;height:90px;background:#f1f5f9;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#94a3b8;margin-bottom:6px;">No ID</div>`
                }
                <div class="id-number">${student.nationalId || student.id || 'N/A'}</div>
              </div>
            </div>
            <div class="footer-strip"></div>
          </div>
        </body>
      </html>
    `;

    downloadPDF(html, `${student.fullName.replace(/\s+/g, '_')}_IDCard.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border dark:border-cyan-900/30 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-start p-6 border-b border-gray-200 dark:border-cyan-900/30 bg-gray-50/50 dark:bg-slate-950/20">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 bg-gray-200 dark:bg-slate-950/40 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-gray-300 dark:border-cyan-900/30">
              {student.profilePhoto ? (
                <img src={student.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-gray-500 dark:text-cyan-300 font-bold">{student.fullName.charAt(0)}</span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-950 dark:text-white">{student.fullName}</h2>
              <p className="text-sm text-gray-500 dark:text-cyan-100/50">Student ID: {student.nationalId}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip content="Edit student details & assignments">
              <button onClick={onEdit} className="p-2 text-gray-450 dark:text-cyan-200 hover:text-primary dark:hover:text-cyan-400 bg-gray-100 dark:bg-slate-800 rounded-full transition-colors cursor-pointer" title="Edit Student">
                <Edit2 className="w-4 h-4"/>
              </button>
            </Tooltip>
            <Tooltip content="Copy student sharing text summary">
              <button onClick={handleShare} className="p-2 text-gray-450 dark:text-cyan-200 hover:text-primary dark:hover:text-cyan-400 bg-gray-100 dark:bg-slate-800 rounded-full transition-colors cursor-pointer" title="Share Student Record">
                <Share2 className="w-4 h-4"/>
              </button>
            </Tooltip>
            <Tooltip content="Download Printable ID Card Card">
              <button onClick={generateIDCard} className="p-2 text-gray-450 dark:text-cyan-200 hover:text-primary dark:hover:text-cyan-400 bg-gray-100 dark:bg-slate-800 rounded-full transition-colors cursor-pointer" title="Download ID Card">
                <CreditCard className="w-4 h-4"/>
              </button>
            </Tooltip>
            <Tooltip content="Export full profile as PDF report">
              <button onClick={generatePDF} className="p-2 text-gray-450 dark:text-cyan-200 hover:text-primary dark:hover:text-cyan-400 bg-gray-100 dark:bg-slate-800 rounded-full transition-colors cursor-pointer" title="Download PDF">
                <Download className="w-4 h-4"/>
              </button>
            </Tooltip>
            <Tooltip content="Delete student record permanently">
              <button onClick={handleDelete} className="p-2 text-gray-450 dark:text-red-400 hover:text-red-650 bg-gray-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-full transition-colors cursor-pointer" title="Delete Student">
                <Trash2 className="w-4 h-4"/>
              </button>
            </Tooltip>
            <div className="w-px h-6 bg-gray-200 dark:bg-cyan-900/45 mx-1"></div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-cyan-400 bg-gray-100 dark:bg-slate-800 rounded-full transition-colors">
              <X className="w-4 h-4"/>
            </button>
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
