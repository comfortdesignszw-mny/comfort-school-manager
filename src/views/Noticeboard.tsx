import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from '../db';
import { Plus, Trash2, Edit2, Share2, Download, AlertCircle } from 'lucide-react';
import { downloadPDF } from '../utils/pdf';

export default function Noticeboard() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any | null>(null);
  const notices = useLiveQuery(() => db.notices.reverse().toArray(), []) || [];

  const deleteNotice = async (id?: number) => {
    if (!id) return;
    if (confirm('Are you sure you want to permanently delete this notice?')) {
      await db.notices.delete(id);
    }
  };

  const shareNotice = (notice: any) => {
    const text = `📢 *SCHOOL NOTICE: ${notice.title}*\n\nAudience: ${notice.audience}\nDate: ${new Date(notice.date).toLocaleDateString()}\n\n${notice.content}\n\n---\nPublished via ${getSettings().schoolName}`;
    
    // Fallback standard text-copy
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert('Notice details copied to clipboard with successful formatting! You can now paste and share it.');
    } else {
      alert(`Notice text:\n\n${text}`);
    }
  };

  const downloadNoticePDF = (notice: any) => {
    const settings = getSettings();
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${notice.title}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #1E293B; line-height: 1.6; padding: 40px; max-width: 650px; margin: 0 auto; }
            .header { display: flex; align-items: center; border-bottom: 2px solid ${settings.themeColor || '#0056b3'}; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { height: 50px; width: 50px; object-fit: contain; margin-right: 15px; }
            .school-info h1 { margin: 0; font-size: 22px; color: ${settings.themeColor || '#0056b3'}; }
            .school-info p { margin: 3px 0 0 0; color: #64748B; font-size: 13px; }
            .metadata { font-size: 13px; color: #475569; background: #F8FAFC; padding: 12px 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${settings.themeColor || '#0056b3'}; }
            .content { font-size: 15px; color: #0F172A; white-space: pre-wrap; margin-top: 25px; line-height: 1.7; }
            .footer { margin-top: 50px; border-top: 1px solid #E2E8F0; padding-top: 20px; text-align: center; color: #94A3B8; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            ${settings.schoolLogo ? `<img src="${settings.schoolLogo}" class="logo" />` : ''}
            <div class="school-info">
              <h1>${settings.schoolName || 'School Manager'}</h1>
              <p>${settings.schoolMotto || 'Excellence in Education'}</p>
            </div>
          </div>
          <h2 style="font-size: 24px; color: #0F172A; font-weight: 800; margin-bottom: 10px;">${notice.title}</h2>
          <div class="metadata">
            <strong>Target Audience:</strong> ${notice.audience} &nbsp;&bull;&nbsp;
            <strong>Date Published:</strong> ${new Date(notice.date).toLocaleDateString()} &nbsp;&bull;&nbsp;
            <strong>Publisher:</strong> ${notice.author}
          </div>
          <div class="content">${notice.content}</div>
          <div class="footer">
            Generated via Comfort School Manager Noticeboard &bull; ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;
    downloadPDF(html, `Notice_${notice.title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-950 dark:text-white tracking-tight">Noticeboard</h2>
          <p className="text-sm text-gray-500 mt-1">Broadcast and manage messages to staff, students, and parents.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-primary/95 transition-all text-sm shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Notice
        </button>
      </div>

      <div className="grid gap-4">
        {notices.length === 0 ? (
          <div className="py-20 text-center text-gray-500 bg-white dark:bg-slate-900/40 rounded-xl border border-dashed border-gray-300 dark:border-cyan-900/40 font-semibold italic">
            No notices published. Create one to get started!
          </div>
        ) : (
          notices.map(notice => (
            <div key={notice.id} className="glass-card relative flex flex-col justify-between group">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-primary/10 dark:bg-cyan-500/15 text-primary dark:text-cyan-400 border border-primary/20 dark:border-cyan-500/25 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {notice.audience}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-cyan-100/40 font-semibold uppercase">{new Date(notice.date).toLocaleDateString()}</span>
                  <span className="text-xs text-gray-400 dark:text-cyan-100/40 font-semibold uppercase">• By {notice.author}</span>
                </div>
                <h3 className="text-lg font-extrabold text-gray-950 dark:text-white mb-2">{notice.title}</h3>
                <p className="text-sm text-gray-700 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">{notice.content}</p>
              </div>

              {/* Action operations shelf */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800/60 flex justify-end gap-2 shrink-0">
                <button 
                  onClick={() => setEditingNotice(notice)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-primary hover:text-white transition-colors border border-gray-200 dark:border-cyan-900/30"
                  title="Edit Notice"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button 
                  onClick={() => shareNotice(notice)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-primary hover:text-white transition-colors border border-gray-200 dark:border-cyan-900/30"
                  title="Copy formatted notice to clipboard"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                <button 
                  onClick={() => downloadNoticePDF(notice)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-primary hover:text-white transition-colors border border-gray-200 dark:border-cyan-900/30"
                  title="Download notice PDF"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                <div className="w-px h-6 bg-gray-200 dark:bg-slate-800 self-center mx-1"></div>
                <button 
                  onClick={() => deleteNotice(notice.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition-all"
                  title="Delete Notice"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {(isAdding || editingNotice) && (
        <NoticeModal 
          notice={editingNotice} 
          onClose={() => { 
            setIsAdding(false); 
            setEditingNotice(null); 
          }} 
        />
      )}
    </div>
  );
}

function NoticeModal({ onClose, notice }: { onClose: () => void; notice?: any }) {
  const [title, setTitle] = useState(notice?.title || '');
  const [content, setContent] = useState(notice?.content || '');
  const [audience, setAudience] = useState<'All'|'Parents'|'Teachers'|'Students'>(notice?.audience || 'All');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (notice?.id) {
      await db.notices.update(notice.id, {
        title: title.trim(),
        content: content.trim(),
        audience,
        date: notice.date || new Date().toISOString()
      });
    } else {
      await db.notices.add({
        title: title.trim(),
        content: content.trim(),
        audience,
        author: 'Admin',
        date: new Date().toISOString()
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border dark:border-cyan-900/30 rounded-xl shadow-xl w-full max-w-lg p-6 overflow-hidden">
        <h3 className="font-bold text-lg mb-4 text-gray-950 dark:text-white border-b dark:border-cyan-900/20 pb-2">
          {notice ? 'Edit Published Notice' : 'Post New Notice'}
        </h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-cyan-100/60 uppercase tracking-wider mb-1">Title</label>
            <input required type="text" value={title} onChange={e=>setTitle(e.target.value)} className="input-field" placeholder="e.g. Term end examinations schedule" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-cyan-100/60 uppercase tracking-wider mb-1">Audience</label>
            <select value={audience} onChange={e=>setAudience(e.target.value as any)} className="input-field">
              <option value="All">All Audiences</option>
              <option value="Parents">Parents ONLY</option>
              <option value="Teachers">Teachers ONLY</option>
              <option value="Students">Students ONLY</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-cyan-100/60 uppercase tracking-wider mb-1">Content message</label>
            <textarea required rows={5} value={content} onChange={e=>setContent(e.target.value)} className="input-field" placeholder="Write notice details..." />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t dark:border-cyan-900/10">
            <button onClick={onClose} type="button" className="px-4 py-2 border border-gray-300 dark:border-cyan-900/40 rounded-lg text-sm text-gray-700 dark:text-cyan-150/70 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
              {notice ? 'Save Changes' : 'Publish Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
