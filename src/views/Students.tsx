import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Search, Plus, X, Upload, Trash2, Edit2, Share2, Download } from 'lucide-react';
import type { Student, Guardian } from '../types';
import { getSettings } from '../db';
import { downloadPDF } from '../utils/pdf';

export default function Students() {
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Students Directory</h2>
          <p className="text-gray-500 mt-1">Manage student profiles, guardians, and academic data.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex-1 flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200 sticky top-0">
              <tr>
                <th className="py-3 px-4 font-medium">Name</th>
                <th className="py-3 px-4 font-medium">ID Number</th>
                <th className="py-3 px-4 font-medium">Gender</th>
                <th className="py-3 px-4 font-medium">DOB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {students?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    No students found.
                  </td>
                </tr>
              ) : (
                students?.map(student => (
                  <tr 
                    key={student.id} 
                    onClick={() => setSelectedStudent(student)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">{student.fullName}</td>
                    <td className="py-3 px-4 text-gray-600">{student.nationalId}</td>
                    <td className="py-3 px-4 text-gray-600">{student.gender}</td>
                    <td className="py-3 px-4 text-gray-600">{student.dob}</td>
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
    </div>
  );
}

function StudentModal({ onClose, initialData }: { onClose: () => void, initialData?: Student }) {
  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [dob, setDob] = useState(initialData?.dob || '');
  const [gender, setGender] = useState<'Male'|'Female'|'Other'>(initialData?.gender || 'Male');
  const [nationalId, setNationalId] = useState(initialData?.nationalId || '');
  const [physicalAddress, setPhysicalAddress] = useState(initialData?.physicalAddress || '');
  const [profilePhoto, setProfilePhoto] = useState<string>(initialData?.profilePhoto || '');
  
  const [guardians, setGuardians] = useState<Guardian[]>(initialData?.guardianData?.length ? initialData.guardianData : [{ name: '', relation: '', contact: '', address: '' }]);
  const [classId, setClassId] = useState<string>(initialData?.schoolData?.classId?.toString() || '');
  
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
        classId: classId ? parseInt(classId) : undefined
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-bold text-lg text-gray-900">Add New Student</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form id="student-form" onSubmit={handleSave} className="space-y-8">
            {/* Personal Information */}
            <section className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">Personal Information</h4>
              
              <div className="flex gap-6 items-start">
                {/* Photo Upload */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="w-24 h-24 bg-gray-100 border-2 border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center overflow-hidden relative group">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-6 h-6 text-gray-400" />
                    )}
                    <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-10 text-xs font-medium">
                      <span>Upload</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                  <span className="text-xs text-gray-500">Profile Photo</span>
                </div>

                <div className="flex-1 space-y-4 min-w-0">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input required type="text" value={fullName} onChange={e=>setFullName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input required type="date" value={dob} onChange={e=>setDob(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select value={gender} onChange={e=>setGender(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
                <input required type="text" value={nationalId} onChange={e=>setNationalId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
                <textarea required value={physicalAddress} onChange={e=>setPhysicalAddress(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" rows={2} />
              </div>
            </section>

            {/* School Details */}
            <section className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">School Details</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Class</label>
                <select value={classId} onChange={e=>setClassId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">No Class Assigned</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
            </section>

            {/* Guardian Data */}
            <section className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Guardian Data</h4>
                <button type="button" onClick={addGuardian} className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                  <Plus className="w-4 h-4" /> Add Guardian
                </button>
              </div>
              
              {guardians.map((guardian, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4 relative">
                  {guardians.length > 1 && (
                    <button type="button" onClick={() => removeGuardian(index)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
                      <input required type="text" value={guardian.name} onChange={e=>handleGuardianChange(index, 'name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                      <input required type="text" placeholder="e.g. Mother, Father" value={guardian.relation} onChange={e=>handleGuardianChange(index, 'relation', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                      <input required type="text" value={guardian.contact} onChange={e=>handleGuardianChange(index, 'contact', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
                      <input required type="text" value={guardian.address} onChange={e=>handleGuardianChange(index, 'address', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white" />
                    </div>
                  </div>
                </div>
              ))}
            </section>
          </form>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} type="button" className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button form="student-form" type="submit" className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors">Save Student</button>
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
          text: `Student Details:\nName: ${student.fullName}\nID: ${student.nationalId}\nClass: ${assignedClass?.name || 'Unassigned'}`,
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
             <p style="margin: 0 0 20px 0; color: #666; font-size: 16px;">ID: ${student.nationalId}</p>
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-gray-300">
              {student.profilePhoto ? (
                <img src={student.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-gray-500 font-bold">{student.fullName.charAt(0)}</span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{student.fullName}</h2>
              <p className="text-gray-500">{student.nationalId}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="p-2 text-gray-400 hover:text-primary bg-gray-50 hover:bg-primary/10 rounded-full transition-colors" title="Edit Student">
              <Edit2 className="w-5 h-5"/>
            </button>
            <button onClick={handleShare} className="p-2 text-gray-400 hover:text-primary bg-gray-50 hover:bg-primary/10 rounded-full transition-colors" title="Share Student Record">
              <Share2 className="w-5 h-5"/>
            </button>
            <button onClick={generatePDF} className="p-2 text-gray-400 hover:text-primary bg-gray-50 hover:bg-primary/10 rounded-full transition-colors" title="Download PDF">
              <Download className="w-5 h-5"/>
            </button>
            <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-full transition-colors" title="Delete Student">
              <Trash2 className="w-5 h-5"/>
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5"/>
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-8">
          <section>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Personal Information</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div><span className="block text-gray-500 mb-1">Date of Birth</span><span className="font-medium">{student.dob}</span></div>
              <div><span className="block text-gray-500 mb-1">Gender</span><span className="font-medium">{student.gender}</span></div>
              <div className="col-span-2"><span className="block text-gray-500 mb-1">Physical Address</span><span className="font-medium">{student.physicalAddress}</span></div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Guardian Data</h3>
            {student.guardianData.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No guardians recorded.</p>
            ) : (
              <div className="space-y-4">
                {student.guardianData.map((g, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-lg flex flex-col gap-1 text-sm">
                    <div className="flex justify-between font-medium"><span>{g.name}</span><span className="text-primary">{g.relation}</span></div>
                    <div className="text-gray-600">{g.contact}</div>
                    <div className="text-gray-600">{g.address}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">School Data</h3>
            <div className="text-sm space-y-2">
              <p className="text-gray-500">Class: <span className="font-medium text-gray-900">{assignedClass?.name || 'Not Assigned'}</span></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
