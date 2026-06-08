import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Plus, Trash2 } from 'lucide-react';

export default function Noticeboard() {
  const [isAdding, setIsAdding] = useState(false);
  const notices = useLiveQuery(() => db.notices.reverse().toArray(), []) || [];

  const deleteNotice = async (id?: number) => {
    if (id) await db.notices.delete(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Noticeboard</h2>
          <p className="text-gray-500 mt-1">Broadcast messages to staff, students, and parents.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          New Notice
        </button>
      </div>

      <div className="grid gap-4">
        {notices.length === 0 ? (
          <div className="py-12 text-center text-gray-500 bg-white dark:bg-slate-900/40 rounded-xl border border-dashed border-gray-300 dark:border-cyan-900/40">
            No notices published.
          </div>
        ) : (
          notices.map(notice => (
            <div key={notice.id} className="glass-card relative group">
              <button 
                onClick={() => deleteNotice(notice.id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-cyan-300 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                  {notice.audience}
                </span>
                <span className="text-sm text-gray-400">{new Date(notice.date).toLocaleDateString()}</span>
                <span className="text-sm text-gray-400">• By {notice.author}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{notice.title}</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{notice.content}</p>
            </div>
          ))
        )}
      </div>

      {isAdding && <NoticeModal onClose={() => setIsAdding(false)} />}
    </div>
  );
}

function NoticeModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<'All'|'Parents'|'Teachers'|'Students'>('All');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.notices.add({
      title, content, audience,
      author: 'Admin',
      date: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border dark:border-cyan-900/30 rounded-xl shadow-xl w-full max-w-lg p-6">
        <h3 className="font-bold text-lg mb-4 text-gray-900">Post New Notice</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Title</label>
            <input required type="text" value={title} onChange={e=>setTitle(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Audience</label>
            <select value={audience} onChange={e=>setAudience(e.target.value as any)} className="input-field">
              <option value="All">All</option>
              <option value="Parents">Parents</option>
              <option value="Teachers">Teachers</option>
              <option value="Students">Students</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Content</label>
            <textarea required rows={5} value={content} onChange={e=>setContent(e.target.value)} className="input-field" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} type="button" className="px-4 py-2 border border-gray-300 dark:border-cyan-900/50 rounded-lg text-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">Publish Notice</button>
          </div>
        </form>
      </div>
    </div>
  );
}
