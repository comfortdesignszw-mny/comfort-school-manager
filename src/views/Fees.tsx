import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from '../db';
import { Plus, Download, CheckCircle, AlertCircle, HelpCircle, X, Search, Landmark } from 'lucide-react';
import { downloadPDF } from '../utils/pdf';

export default function Fees() {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Partial' | 'Unpaid'>('All');
  
  // State for quick marking paid
  const [markingTxId, setMarkingTxId] = useState<number | null>(null);
  const [markingTxStudentName, setMarkingTxStudentName] = useState('');
  const [quickReceiptNo, setQuickReceiptNo] = useState('');

  const fees = useLiveQuery(async () => {
    const list = await db.fees.reverse().toArray();
    return list.filter(f => {
      const matchesSearch = f.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || f.receiptNumber.includes(searchQuery);
      const matchesFilter = statusFilter === 'All' || f.status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, statusFilter]) || [];

  // Totals calculations
  const totalPaidSum = fees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);
  const totalUnpaidSum = fees.filter(f => f.status === 'Unpaid').reduce((sum, f) => sum + f.amount, 0);

  const handleExportCSV = () => {
    if (fees.length === 0) return alert('No records to export');
    const headers = ['Date', 'Student Name', 'Term/Month', 'Receipt No.', 'Amount', 'Status'];
    const rows = fees.map(f => [
      new Date(f.date).toLocaleDateString(),
      f.studentName,
      f.termOrMonth,
      f.receiptNumber || 'None',
      f.amount.toString(),
      f.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fee_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (fees.length === 0) return alert('No records to export');
    const settings = getSettings();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Financial Report</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #111; line-height: 1.5; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { display: flex; align-items: center; border-bottom: 2px solid #EEE; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { height: 60px; width: 60px; object-fit: contain; margin-right: 20px; }
            .school-info h1 { margin: 0 0 5px 0; font-size: 20px; color: ${settings.themeColor}; }
            .school-info p { margin: 0; color: #555; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { padding: 8px 10px; border: 1px solid #EEE; text-align: left; }
            th { background: #F9F9F9; font-weight: 600; text-transform: uppercase; color: #666; font-size: 11px; }
            td.amount { text-align: right; }
            .total-row { font-weight: bold; background: #F9F9F9; }
            .footer { margin-top: 40px; border-top: 1px solid #EEE; padding-top: 20px; text-align: center; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            ${settings.schoolLogo ? `<img src="${settings.schoolLogo}" class="logo" />` : ''}
            <div class="school-info">
              <h1>${settings.schoolName || 'School Manager'}</h1>
              <p>Financial Export - ${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <h2>Fees Ledger</h2>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Student Name</th>
                <th>Term/Month</th>
                <th>Receipt No.</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${fees.map(f => `
                <tr>
                  <td>${new Date(f.date).toLocaleDateString()}</td>
                  <td>${f.studentName}</td>
                  <td>${f.termOrMonth}</td>
                  <td>${f.receiptNumber || 'None'}</td>
                  <td class="amount">$${f.amount.toFixed(2)}</td>
                  <td>${f.status}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="4" style="text-align: right">Total Paid Intake</td>
                <td class="amount">$${totalPaidSum.toFixed(2)}</td>
                <td></td>
              </tr>
              <tr class="total-row" style="color: #DC2626">
                <td colspan="4" style="text-align: right">Total Unpaid Overdue</td>
                <td class="amount">$${totalUnpaidSum.toFixed(2)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            Generated by Comfort School Manager &bull; ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;

    downloadPDF(html, `Fee_Records_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const confirmMarkAsPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!markingTxId) return;
    if (!quickReceiptNo.trim()) {
      alert('Must provide a valid receipt number to mark as paid.');
      return;
    }

    await db.fees.update(markingTxId, {
      receiptNumber: quickReceiptNo.trim(),
      status: 'Paid'
    });

    setMarkingTxId(null);
    setMarkingTxStudentName('');
    setQuickReceiptNo('');
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Fees Ledger</h2>
          <p className="text-gray-500 mt-1">Manage school fee payments, issue receipts, and audit collections.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-primary border border-primary/20 hover:bg-primary/5 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button 
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-primary border border-primary/20 hover:bg-primary/5 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/95 transition-colors text-sm shadow-md"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">Total Fees Paid</span>
            <span className="text-xl font-bold text-gray-900">${totalPaidSum.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-rose-100 dark:bg-rose-500/10 text-rose-600 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-widest block">Total Unpaid Arrears</span>
            <span className="text-xl font-bold text-gray-900">${totalUnpaidSum.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-gray-150 flex flex-wrap gap-3 items-center justify-between bg-gray-50/50">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search student or receipt..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2">
            {(['All', 'Paid', 'Partial', 'Unpaid'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  statusFilter === f 
                    ? 'bg-primary text-white' 
                    : 'bg-white border text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Term/Month</th>
                <th className="py-3 px-4">Receipt No.</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {fees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 italic">
                    No matching billing records found.
                  </td>
                </tr>
              ) : (
                fees.map(fee => (
                  <tr key={fee.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-gray-500">{new Date(fee.date).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{fee.studentName}</td>
                    <td className="py-3.5 px-4 text-gray-600">{fee.termOrMonth}</td>
                    <td className="py-3.5 px-4">
                      {fee.receiptNumber ? (
                        <span className="font-mono text-xs text-gray-600 bg-gray-50 border px-2 py-0.5 rounded">
                          {fee.receiptNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic font-medium flex items-center gap-1">
                          <HelpCircle className="w-3 h-3" /> Auto Recorded Unpaid
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900 text-right">${fee.amount.toFixed(2)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center
                        ${fee.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : ''}
                        ${fee.status === 'Partial' ? 'bg-blue-100 text-blue-800' : ''}
                        ${fee.status === 'Unpaid' ? 'bg-rose-100 text-rose-800' : ''}
                      `}>
                        {fee.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {fee.status === 'Unpaid' && (
                        <button 
                          onClick={() => {
                            if (fee.id) {
                              setMarkingTxId(fee.id);
                              setMarkingTxStudentName(fee.studentName);
                            }
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-3 py-1 rounded text-xs transition-colors"
                        >
                          Mark as Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdding && <FeeModal onClose={() => setIsAdding(false)} />}

      {/* Quick Mark as Paid receipt entry popup */}
      {markingTxId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border dark:border-cyan-900/30 rounded-xl shadow-xl w-full max-w-sm p-6 overflow-hidden">
            <div className="flex justify-between items-center border-b pb-2 mb-4 dark:border-cyan-900/10">
              <h3 className="font-bold text-lg text-gray-900">Mark Transaction Paid</h3>
              <button onClick={() => setMarkingTxId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={confirmMarkAsPaid} className="space-y-4">
              <p className="text-sm text-gray-600">
                Confirm payment for <span className="font-bold text-gray-900">{markingTxStudentName}</span>. Please enter the receipt number below:
              </p>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Receipt Number</label>
                <input 
                  required 
                  type="text" 
                  value={quickReceiptNo} 
                  onChange={e => setQuickReceiptNo(e.target.value)} 
                  className="input-field" 
                  placeholder="e.g. REC-9824B"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t dark:border-cyan-900/10">
                <button 
                  type="button" 
                  onClick={() => setMarkingTxId(null)}
                  className="px-3.5 py-1.5 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600"
                >
                  Confirm as Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FeeModal({ onClose }: { onClose: () => void }) {
  const [studentName, setStudentName] = useState('');
  const [typeMode, setTypeMode] = useState<'import' | 'manual'>('import');
  
  const [term, setTerm] = useState('Term 1');
  const [receipt, setReceipt] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'Paid'|'Partial'|'Unpaid'>('Paid');
  const [selectedStudentId, setSelectedStudentId] = useState<number | 0>(0);

  const studentsList = useLiveQuery(() => db.students.toArray(), []) || [];

  const handleStudentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = parseInt(e.target.value);
    setSelectedStudentId(sId);
    const found = studentsList.find(s => s.id === sId);
    if (found) {
      setStudentName(found.fullName);
    } else {
      setStudentName('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      alert('Must select or type a Student Name.');
      return;
    }

    // MANDATE requirement: if receipt number is empty/blank, let system automatically record as Unpaid status!
    const effectiveReceipt = receipt.trim();
    const finalStatus = effectiveReceipt === '' ? 'Unpaid' : status;

    await db.fees.add({
      studentId: selectedStudentId,
      studentName: studentName.trim(),
      termOrMonth: term.trim(),
      receiptNumber: effectiveReceipt, // can be empty string
      amount: parseFloat(amount) || 0,
      status: finalStatus,
      date: new Date().toISOString()
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border dark:border-cyan-900/40 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b dark:border-cyan-900/10 bg-gray-50/50">
          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2"><Landmark className="w-5 h-5 text-primary" /> Record Tuition Fees</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="bg-gray-50 p-2.5 rounded-lg flex justify-between gap-2 border border-gray-150">
            <button 
              type="button" 
              onClick={() => { setTypeMode('import'); setSelectedStudentId(0); setStudentName(''); }}
              className={`flex-1 py-1 rounded text-xs font-semibold transition-colors ${
                typeMode === 'import' ? 'bg-primary text-white shadow-xs' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Import Registered Student
            </button>
            <button 
              type="button" 
              onClick={() => { setTypeMode('manual'); setSelectedStudentId(0); setStudentName(''); }}
              className={`flex-1 py-1 rounded text-xs font-semibold transition-colors ${
                typeMode === 'manual' ? 'bg-primary text-white shadow-xs' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Type Custom Name
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Student Name Source</label>
            {typeMode === 'import' ? (
              <select 
                required 
                value={selectedStudentId} 
                onChange={handleStudentSelect}
                className="input-field"
              >
                <option value="">-- Choose student from directory --</option>
                {studentsList.map(s => (
                  <option key={s.id} value={s.id}>{s.fullName} ({s.nationalId})</option>
                ))}
              </select>
            ) : (
              <input 
                required 
                type="text" 
                value={studentName} 
                onChange={e=>setStudentName(e.target.value)} 
                className="input-field" 
                placeholder="Enter new/unregistered student name"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Term / Month</label>
              <input required type="text" value={term} onChange={e=>setTerm(e.target.value)} className="input-field" placeholder="e.g. Term 1" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Receipt No. (Optional)</label>
              <input 
                type="text" 
                value={receipt} 
                onChange={e=>setReceipt(e.target.value)} 
                className="input-field" 
                placeholder="Leave blank for unpaid"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Amount ($)</label>
              <input required type="number" step="0.01" min={0} value={amount} onChange={e=>setAmount(e.target.value)} className="input-field" placeholder="e.g. 500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status</label>
              <select 
                disabled={receipt.trim() === ''}
                value={receipt.trim() === '' ? 'Unpaid' : status} 
                onChange={e=>setStatus(e.target.value as any)} 
                className="input-field disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
          </div>

          {receipt.trim() === '' && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 rounded-lg text-[11px] text-amber-700 leading-tight">
              <strong>Notice:</strong> Empty receipt number is detected. This transaction will automatically be registered as <strong>Unpaid</strong>. You can click 'Mark as Paid' later and enter a receipt.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-cyan-900/10">
            <button onClick={onClose} type="button" className="px-4 py-2 border dark:border-cyan-900/30 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/95 transition-colors">Save Record</button>
          </div>
        </form>
      </div>
    </div>
  );
}
