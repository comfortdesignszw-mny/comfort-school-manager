import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Plus, X, Trash2, Edit2, Shield, User } from 'lucide-react';
import type { Staff as StaffType } from '../types';

export default function StaffView() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffType | null>(null);

  const staffList = useLiveQuery(() => db.staff.toArray(), []) || [];

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      await db.staff.delete(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Staff Section</h2>
          <p className="text-gray-500 mt-1">Manage school teachers, administrators, and other staff members.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/95 transition-colors shadow-lg shadow-cyan-500/10"
        >
          <Plus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-500 bg-white dark:bg-slate-900/40 rounded-xl border border-dashed border-gray-300 dark:border-cyan-900/40">
            <User className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-lg font-medium">No staff members found</p>
            <p className="text-sm text-gray-400">Click "Add Staff Member" to get started.</p>
          </div>
        ) : (
          staffList.map(member => (
            <div key={member.id} className="glass-card flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-500">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{member.fullName}</h3>
                      <span className="inline-block bg-primary/10 text-primary dark:bg-cyan-500/20 dark:text-cyan-400 px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1">
                        {member.title}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    member.status === 'Active' 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400' 
                      : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-500/10 dark:text-zinc-400'
                  }`}>
                    {member.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {member.contact && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Phone:</span>
                      <span className="font-medium text-gray-950">{member.contact}</span>
                    </div>
                  )}
                  {member.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="font-medium text-gray-950 truncate max-w-[150px]">{member.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-cyan-900/10 flex justify-end gap-3">
                <button 
                  onClick={() => setEditingStaff(member)}
                  className="p-1 px-2.5 rounded text-gray-400 hover:text-cyan-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-medium"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button 
                  onClick={() => member.id && handleDelete(member.id)}
                  className="p-1 px-2.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-500/5 transition-colors flex items-center gap-1 text-xs font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {(isAdding || editingStaff) && (
        <StaffFormModal 
          staff={editingStaff} 
          onClose={() => {
            setIsAdding(false);
            setEditingStaff(null);
          }} 
        />
      )}
    </div>
  );
}

interface StaffFormModalProps {
  staff?: StaffType | null;
  onClose: () => void;
}

function StaffFormModal({ staff, onClose }: StaffFormModalProps) {
  const [fullName, setFullName] = useState(staff?.fullName || '');
  const [title, setTitle] = useState(staff?.title || 'Teacher');
  const [contact, setContact] = useState(staff?.contact || '');
  const [email, setEmail] = useState(staff?.email || '');
  const [status, setStatus] = useState<'Active' | 'Inactive'>(staff?.status || 'Active');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: StaffType = {
      fullName,
      title,
      contact,
      email,
      status,
    };

    if (staff && staff.id) {
      await db.staff.update(staff.id, data);
    } else {
      await db.staff.add(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border dark:border-cyan-900/30 rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4.5 border-b dark:border-cyan-900/10 bg-gray-50/50 dark:bg-slate-950/20">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
            {staff ? 'Edit Staff Member' : 'Add Staff Member'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-650 dark:hover:text-cyan-400 cursor-pointer p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0">
          <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0 text-left">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-cyan-100/70 mb-1">Full Name</label>
              <input 
                required 
                type="text" 
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
                className="input-field" 
                placeholder="e.g. John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-cyan-100/70 mb-1">Title / Designation</label>
              <select 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="input-field"
              >
                <option value="Teacher">Teacher</option>
                <option value="Lecturer">Lecturer</option>
                <option value="Principal">Principal</option>
                <option value="Dean">Dean</option>
                <option value="Administrator">Administrator</option>
                <option value="Librarian">Librarian</option>
                <option value="Support Staff">Support Staff</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-cyan-100/70 mb-1">Contact Number</label>
                <input 
                  type="text" 
                  value={contact} 
                  onChange={e => setContact(e.target.value)} 
                  className="input-field" 
                  placeholder="e.g. +123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-cyan-100/70 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="input-field" 
                  placeholder="e.g. john@school.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-cyan-100/70 mb-1">Status</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="status" 
                    value="Active" 
                    checked={status === 'Active'} 
                    onChange={() => setStatus('Active')} 
                    className="text-primary focus:ring-cyan-500 h-4 w-4"
                  />
                  <span className="text-sm font-medium text-gray-750 dark:text-gray-300">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="status" 
                    value="Inactive" 
                    checked={status === 'Inactive'} 
                    onChange={() => setStatus('Inactive')} 
                    className="text-primary focus:ring-cyan-500 h-4 w-4"
                  />
                  <span className="text-sm font-medium text-gray-750 dark:text-gray-300">Inactive</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-5 border-t dark:border-cyan-900/10 bg-gray-50/50 dark:bg-slate-950/10 shrink-0">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border border-gray-300 dark:border-cyan-900/50 rounded-lg text-gray-750 dark:text-cyan-155/70 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/95 transition-colors cursor-pointer"
            >
              Save Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
