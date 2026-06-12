import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings } from '../db';
import { Plus, Download, CheckCircle, AlertCircle, HelpCircle, X, Search, Landmark, Edit2, Trash2, Share2, CheckSquare, Square } from 'lucide-react';
import { downloadPDF } from '../utils/pdf';
import Tooltip from '../components/Tooltip';

export default function Fees() {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Partial' | 'Unpaid'>('All');
  
  // State for quick marking paid
  const [markingTxId, setMarkingTxId] = useState<number | null>(null);
  const [markingTxStudentName, setMarkingTxStudentName] = useState('');
  const [quickReceiptNo, setQuickReceiptNo] = useState('');

  // Batch Selection and Action states
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [pendingAction, setPendingAction] = useState<'delete' | 'edit' | 'share' | 'select' | null>(null);
  const [batchEditTerm, setBatchEditTerm] = useState('');
  const [batchEditStatus, setBatchEditStatus] = useState<'Paid' | 'Unpaid' | 'Partial'>('Paid');
  const [batchEditAmount, setBatchEditAmount] = useState('');
  const [showBatchEditPanel, setShowBatchEditPanel] = useState(false);
  const [editingFee, setEditingFee] = useState<any | null>(null);

  const toggleSelectAll = () => {
    if (selectedIds.length === fees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(fees.map(f => f.id!).filter(Boolean));
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleTriggerAction = (action: 'delete' | 'edit' | 'share' | 'select') => {
    setIsSelectMode(true);
    setPendingAction(action);
    setSelectedIds([]); // reset selection
    setShowBatchEditPanel(false);
  };

  const deactivateSelectMode = () => {
    setIsSelectMode(false);
    setPendingAction(null);
    setSelectedIds([]);
    setShowBatchEditPanel(false);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      alert('Please check at least one record to delete.');
      return;
    }
    const count = selectedIds.length;
    if (confirm(`Are you absolutely sure you want to permanently delete ${count} selected record(s)?`)) {
      await db.fees.bulkDelete(selectedIds);
      alert(`Successfully deleted ${count} record(s).`);
      deactivateSelectMode();
    }
  };

  const handleBatchShare = () => {
    if (selectedIds.length === 0) {
      alert('Please check at least one record to share.');
      return;
    }
    const selectedRecords = fees.filter(f => selectedIds.includes(f.id!));
    const summaryHeader = `📋 *FEES AUDIT SUMMARY REPORT (${selectedRecords.length} Records)*\nGenerated on: ${new Date().toLocaleDateString()}\n-------------------------------\n`;
    const summaries = selectedRecords.map((f, i) => 
      `${i + 1}. Student: ${f.studentName} | Term: ${f.termOrMonth} | Status: ${f.status} | Amount: $${f.amount.toFixed(2)}${f.receiptNumber ? ` (Receipt: ${f.receiptNumber})` : ''}`
    ).join('\n');
    const footerText = `\n-------------------------------\nTotal Selected Paid: $${selectedRecords.filter(f => f.status === 'Paid').reduce((s, f) => s + f.amount, 0).toFixed(2)}\nGenerated via Comfort School Administration Hub`;
    const fullText = summaryHeader + summaries + footerText;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullText);
      alert('Selected billing records formatted summary copied to clipboard! You can paste and share it easily.');
    } else {
      alert(fullText);
    }
    deactivateSelectMode();
  };

  const handleBatchEditConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      alert('No records selected for editing.');
      return;
    }
    const count = selectedIds.length;
    
    const updateObj: any = {};
    if (batchEditTerm.trim()) updateObj.termOrMonth = batchEditTerm.trim();
    if (batchEditAmount.trim()) updateObj.amount = parseFloat(batchEditAmount) || 0;
    updateObj.status = batchEditStatus;

    if (batchEditStatus === 'Unpaid') {
      updateObj.receiptNumber = '';
    }

    try {
      for (const id of selectedIds) {
        await db.fees.update(id, updateObj);
      }
      alert(`Successfully applied batch edits across ${count} billing record(s).`);
      deactivateSelectMode();
    } catch (err) {
      alert('Failed to save batch updates.');
    }
  };

  const handleOpenIndividualEdit = () => {
    if (selectedIds.length !== 1) {
      alert('Please select exactly 1 record to edit details individually.');
      return;
    }
    const targetObj = fees.find(f => f.id === selectedIds[0]);
    if (targetObj) {
      setEditingFee(targetObj);
    }
  };

  const handleExportSelectedPDF = () => {
    if (selectedIds.length === 0) {
      alert('No records selected.');
      return;
    }
    const selectedRecords = fees.filter(f => selectedIds.includes(f.id!));
    const settings = getSettings();
    const selPaid = selectedRecords.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);
    const selUnpaid = selectedRecords.filter(f => f.status === 'Unpaid').reduce((sum, f) => sum + f.amount, 0);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Selected Financial Audit Record</title>
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
              ${settings.schoolMotto ? `<p style="font-style: italic">${settings.schoolMotto}</p>` : ''}
              <p>${[settings.schoolPhone, settings.schoolContact].filter(Boolean).join(' | ')}</p>
              ${settings.schoolAddress ? `<p>${settings.schoolAddress}</p>` : ''}
              <p style="margin-top: 10px; font-weight: bold; color: ${settings.themeColor}">Financial Export (Selected Selection) - ${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <h2>Fees Ledger Audit Selection</h2>

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
              ${selectedRecords.map(f => `
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
                <td colspan="4" style="text-align: right">Selected Total Paid</td>
                <td class="amount">$${selPaid.toFixed(2)}</td>
                <td></td>
              </tr>
              <tr class="total-row" style="color: #DC2626">
                <td colspan="4" style="text-align: right">Selected Total Unpaid</td>
                <td class="amount">$${selUnpaid.toFixed(2)}</td>
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

    downloadPDF(html, `Fee_Audit_Selection_${new Date().toISOString().split('T')[0]}.pdf`);
  };

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
              ${settings.schoolMotto ? `<p style="font-style: italic">${settings.schoolMotto}</p>` : ''}
              <p>${[settings.schoolPhone, settings.schoolContact].filter(Boolean).join(' | ')}</p>
              ${settings.schoolAddress ? `<p>${settings.schoolAddress}</p>` : ''}
              <p style="margin-top: 10px; font-weight: bold; color: ${settings.themeColor}">Financial Export - ${new Date().toLocaleDateString()}</p>
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

      <div className="table-container shadow-xs flex flex-col">
        {/* Main List Management Header & Selection Mode Workspace */}
        <div className="p-4 border-b border-gray-150 dark:border-slate-800 flex flex-col gap-3 bg-gray-50/50 dark:bg-slate-950/20">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-cyan-400/50 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search student or receipt..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-cyan-900/30 rounded-lg text-sm text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex gap-2">
              {(['All', 'Paid', 'Partial', 'Unpaid'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                    statusFilter === f 
                      ? 'bg-primary text-white shadow-xs' 
                      : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-cyan-950/20 text-gray-600 dark:text-cyan-100/75 hover:bg-gray-55 dark:hover:bg-slate-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Card Management Buttons row */}
          <div className="flex flex-wrap items-center gap-2 border-t border-gray-200/55 dark:border-slate-800/60 pt-3 mt-1">
            <span className="text-xs font-bold text-gray-400 dark:text-cyan-100/45 uppercase tracking-wider mr-2">Management Controls:</span>
            <Tooltip content="Prepare checkboxes to edit single/multiple ledger rows">
              <button 
                onClick={() => handleTriggerAction('edit')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-primary hover:text-white transition-all border border-gray-200 dark:border-cyan-900/30 cursor-pointer shadow-2xs"
                title="Click to prepare select boxes for bulk/single editing records"
              >
                <Edit2 className="w-3.5 h-3.5 text-primary" /> Edit Record(s)
              </button>
            </Tooltip>
            <Tooltip content="Prepare checkboxes to delete single/multiple ledger rows">
              <button 
                onClick={() => handleTriggerAction('delete')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-white dark:bg-slate-800 text-red-650 dark:text-red-400 hover:bg-rose-600 hover:text-white transition-all border border-gray-200 dark:border-cyan-900/30 cursor-pointer shadow-2xs"
                title="Click to prepare select boxes for bulk deleting records"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" /> Delete Record(s)
              </button>
            </Tooltip>
            <Tooltip content="Prepare checkboxes to copy billing report text for messaging">
              <button 
                onClick={() => handleTriggerAction('share')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-primary hover:text-white transition-all border border-gray-200 dark:border-cyan-900/30 cursor-pointer shadow-2xs"
                title="Click to prepare select boxes for copying formatted summaries to share"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-500" /> Share Report
              </button>
            </Tooltip>
            <Tooltip content="Prepare checkboxes to perform multiple batch operations">
              <button 
                onClick={() => handleTriggerAction('select')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-primary/10 dark:bg-cyan-500/10 text-primary dark:text-cyan-400 hover:bg-primary hover:text-white transition-all border border-primary/20 dark:border-cyan-900/35 cursor-pointer shadow-2xs"
                title="Activate full batch select workspace with all actions enabled"
              >
                <CheckSquare className="w-3.5 h-3.5" /> Batch Select
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Dynamic Selection Workspace Banner */}
        {isSelectMode && (
          <div className="bg-amber-500/5 dark:bg-cyan-950/20 border-b border-gray-250 dark:border-cyan-900/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox"
                  checked={fees.length > 0 && selectedIds.length === fees.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 dark:border-cyan-900 text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
                  title="Select All / Deselect All visible items"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-gray-900 dark:text-white tracking-wide">
                      Selection Workspace Active
                    </span>
                    <span className="bg-primary text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {selectedIds.length} Selected
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-cyan-200/50 mt-0.5">
                    {pendingAction === 'delete' && '🚨 Delete Mode: Mark rows on the left and click "Confirm Batch Delete" to execute.'}
                    {pendingAction === 'edit' && '✏️ Edit Mode: Select 1 item to edit its details, or check multiple to bulk update status, amount, or terms.'}
                    {pendingAction === 'share' && '📋 Share Mode: Select billing rows, then click to copy formatted summaries or download subset report PDF.'}
                    {pendingAction === 'select' && '⚡ Batch Action Mode: Choose rows and click any action on the right.'}
                  </p>
                </div>
              </div>

              {/* Action operations on top depending on pendingAction */}
              <div className="flex items-center flex-wrap gap-2">
                {/* Delete pending execution */}
                {pendingAction === 'delete' && (
                  <button
                    onClick={handleBatchDelete}
                    disabled={selectedIds.length === 0}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer text-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Confirm Batch Delete ({selectedIds.length})
                  </button>
                )}

                {/* Share pending execution */}
                {pendingAction === 'share' && (
                  <>
                    <button
                      onClick={handleBatchShare}
                      disabled={selectedIds.length === 0}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer text-sm"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Copy Format Summary ({selectedIds.length})
                    </button>
                    <button
                      onClick={handleExportSelectedPDF}
                      disabled={selectedIds.length === 0}
                      className="px-4 py-1.5 bg-primary text-white disabled:opacity-40 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer text-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> Selected PDF ({selectedIds.length})
                    </button>
                  </>
                )}

                {/* Edit pending execution */}
                {pendingAction === 'edit' && (
                  <>
                    {selectedIds.length === 1 && (
                      <button
                        onClick={handleOpenIndividualEdit}
                        className="px-4 py-1.5 bg-primary/20 dark:bg-cyan-500/10 text-primary dark:text-cyan-400 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer text-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit details individually
                      </button>
                    )}
                    <button
                      onClick={() => setShowBatchEditPanel(!showBatchEditPanel)}
                      disabled={selectedIds.length === 0}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer text-sm"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> {showBatchEditPanel ? 'Hide Group Edit Fields' : 'Open Group Edit Fields'} ({selectedIds.length})
                    </button>
                  </>
                )}

                {/* General select execution */}
                {pendingAction === 'select' && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={handleBatchDelete}
                      disabled={selectedIds.length === 0}
                      className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg disabled:opacity-40 hover:bg-rose-700 transition-all flex items-center gap-1 text-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                    <button
                      onClick={() => setShowBatchEditPanel(!showBatchEditPanel)}
                      disabled={selectedIds.length === 0}
                      className="px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg disabled:opacity-40 hover:bg-amber-600 transition-all flex items-center gap-1 text-sm"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Group
                    </button>
                    <button
                      onClick={handleBatchShare}
                      disabled={selectedIds.length === 0}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg disabled:opacity-40 hover:bg-emerald-700 transition-all flex items-center gap-1 text-sm"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                    <button
                      onClick={handleExportSelectedPDF}
                      disabled={selectedIds.length === 0}
                      className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg disabled:opacity-40 hover:bg-primary/95 transition-all flex items-center gap-1 text-sm"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={deactivateSelectMode}
                  className="px-3 py-1.5 text-gray-700 dark:text-cyan-200 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-300 dark:border-cyan-900/50 rounded-lg text-xs font-bold transition-all ml-1.5 cursor-pointer"
                >
                  Clear & Close
                </button>
              </div>
            </div>

            {/* Expandable Bulk Update Form Panel */}
            {showBatchEditPanel && selectedIds.length > 0 && (
              <form onSubmit={handleBatchEditConfirm} className="mt-4 p-4 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-950/30 rounded-xl space-y-4 shadow-xs animate-fadeIn">
                <h4 className="text-xs font-extrabold uppercase text-amber-600 tracking-wider flex items-center gap-1">
                  ⚡ Group Edit Options - Updating {selectedIds.length} Checked Record(s)
                </h4>
                <p className="text-[11px] text-gray-550 dark:text-cyan-200/50">Only supplied fields will be rewritten. Leave fields blank to keep current values.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-cyan-100/50 uppercase tracking-wide mb-1">Rewrite Term / Month</label>
                    <input 
                      type="text" 
                      value={batchEditTerm} 
                      onChange={e => setBatchEditTerm(e.target.value)}
                      className="input-field text-xs py-1.5 focus:ring-amber-500"
                      placeholder="e.g. Term 2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-cyan-100/50 uppercase tracking-wide mb-1">Rewrite Amount ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={batchEditAmount} 
                      onChange={e => setBatchEditAmount(e.target.value)}
                      className="input-field text-xs py-1.5 focus:ring-amber-500"
                      placeholder="e.g. 450"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-cyan-100/50 uppercase tracking-wide mb-1">Set General Status</label>
                    <select 
                      value={batchEditStatus} 
                      onChange={e => setBatchEditStatus(e.target.value as any)}
                      className="input-field text-xs py-1.5 focus:ring-amber-500"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Partial">Partial</option>
                      <option value="Unpaid">Unpaid</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-150 dark:border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => setShowBatchEditPanel(false)}
                    className="px-3 py-1.5 text-xs text-gray-500 font-semibold"
                  >
                    Close Group Options
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-extrabold transition-all shadow-xs cursor-pointer"
                  >
                    Apply Bulk Rewrite across {selectedIds.length} records
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="table-header">
              <tr>
                {isSelectMode && (
                  <th className="py-3 px-4 w-12 text-center">
                    <input 
                      type="checkbox"
                      checked={fees.length > 0 && selectedIds.length === fees.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 dark:border-cyan-900 text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
                    />
                  </th>
                )}
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Term/Month</th>
                <th className="py-3 px-4">Receipt No.</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-sm font-medium">
              {fees.length === 0 ? (
                <tr>
                  <td colSpan={isSelectMode ? 8 : 7} className="py-16 text-center">
                    <Landmark className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" strokeWidth={1} />
                    <h3 className="text-gray-900 dark:text-gray-200 font-bold text-lg mb-1">No billing records found</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto mb-4">No fees have been recorded yet or your search query yielded zero results.</p>
                    <button 
                      onClick={() => setIsAdding(true)}
                      className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-cyan-400 px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/20 transition-colors inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Record New Payment
                    </button>
                  </td>
                </tr>
              ) : (
                fees.map(fee => {
                  const isChecked = selectedIds.includes(fee.id!);
                  return (
                    <tr 
                      key={fee.id} 
                      className={`table-row transition-all ${isChecked ? 'bg-primary/5 dark:bg-cyan-950/10' : ''}`}
                    >
                      {isSelectMode && (
                        <td className="py-3.5 px-4 text-center">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectRow(fee.id!)}
                            className="rounded border-slate-300 dark:border-cyan-900 text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="py-3.5 px-4 text-gray-550 dark:text-slate-300">{new Date(fee.date).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4 font-bold text-gray-950 dark:text-white">{fee.studentName}</td>
                      <td className="py-3.5 px-4 text-gray-600 dark:text-slate-200">{fee.termOrMonth}</td>
                      <td className="py-3.5 px-4">
                        {fee.receiptNumber ? (
                          <span className="font-mono text-xs text-gray-600 dark:text-cyan-200 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-cyan-900/40 px-2 py-0.5 rounded">
                            {fee.receiptNumber}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-cyan-200/40 italic font-semibold flex items-center gap-1">
                            <HelpCircle className="w-3 h-3 text-rose-450 dark:text-rose-450" /> Auto Recorded Unpaid
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-gray-950 dark:text-white text-right">${fee.amount.toFixed(2)}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center
                          ${fee.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400' : ''}
                          ${fee.status === 'Partial' ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-cyan-400' : ''}
                          ${fee.status === 'Unpaid' ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400' : ''}
                        `}>
                          {fee.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Row Action: Mark as Paid for Unpaid records */}
                          {fee.status === 'Unpaid' && (
                            <button 
                              onClick={() => {
                                if (fee.id) {
                                  setMarkingTxId(fee.id);
                                  setMarkingTxStudentName(fee.studentName);
                                }
                              }}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2 py-1 rounded text-xs transition-colors shadow-2xs cursor-pointer h-7"
                              title="Mark this transaction as paid"
                            >
                              Mark Paid
                            </button>
                          )}

                          {/* Row Action: Edit single record */}
                          <button
                            onClick={() => setEditingFee(fee)}
                            className="p-1 px-1.5 rounded border border-gray-200 dark:border-cyan-900/40 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-300 hover:text-white hover:bg-primary dark:hover:bg-primary transition-all cursor-pointer h-7 flex items-center justify-center"
                            title="Edit this record details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Row Action: Share single record */}
                          <button
                            onClick={() => {
                              const t = `📢 School Fee Record: ${fee.studentName}\nTerm: ${fee.termOrMonth}\nAmount: $${fee.amount.toFixed(2)}\nStatus: ${fee.status}${fee.receiptNumber ? `\nReceipt No: ${fee.receiptNumber}` : ''}`;
                              if (navigator.clipboard) {
                                navigator.clipboard.writeText(t);
                                alert('Billing record details copied to clipboard with formatted copy!');
                              } else {
                                alert(t);
                              }
                            }}
                            className="p-1 px-1.5 rounded border border-gray-200 dark:border-cyan-900/40 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-300 hover:text-white hover:bg-emerald-650 dark:hover:bg-emerald-700 transition-all cursor-pointer h-7 flex items-center justify-center"
                            title="Copy record text to clipboard"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Row Action: Delete single record */}
                          <button
                            onClick={async () => {
                              if (fee.id && confirm(`Are you sure you want to delete the billing record for ${fee.studentName}?`)) {
                                await db.fees.delete(fee.id);
                                alert('Billing record deleted.');
                              }
                            }}
                            className="p-1 px-1.5 rounded border border-gray-200 dark:border-cyan-900/40 bg-white dark:bg-slate-800 text-red-500 hover:text-white hover:bg-rose-500 dark:hover:bg-rose-600 transition-all cursor-pointer h-7 flex items-center justify-center"
                            title="Delete this billing record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {editingFee && (
        <IndividualEditModal 
          fee={editingFee} 
          onClose={() => setEditingFee(null)} 
        />
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

function IndividualEditModal({ fee, onClose }: { fee: any; onClose: () => void }) {
  const [studentName, setStudentName] = useState(fee.studentName);
  const [term, setTerm] = useState(fee.termOrMonth);
  const [receipt, setReceipt] = useState(fee.receiptNumber || '');
  const [amount, setAmount] = useState(fee.amount.toString());
  const [status, setStatus] = useState<'Paid' | 'Partial' | 'Unpaid'>(fee.status);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return alert('Student Name is required.');

    const finalStatus = receipt.trim() === '' ? 'Unpaid' : status;

    await db.fees.update(fee.id, {
      studentName: studentName.trim(),
      termOrMonth: term.trim(),
      receiptNumber: receipt.trim(),
      amount: parseFloat(amount) || 0,
      status: finalStatus
    });

    alert('Billing record updated successfully.');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border dark:border-cyan-900/40 rounded-xl shadow-xl w-full max-w-md overflow-hidden relative">
        <div className="flex justify-between items-center p-4 border-b dark:border-cyan-900/10 bg-gray-50/50 dark:bg-slate-950/20">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-primary" /> Edit Billing Record
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-cyan-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-cyan-200/55 uppercase tracking-wider mb-1">Student Name</label>
            <input 
              required 
              type="text" 
              value={studentName} 
              onChange={e => setStudentName(e.target.value)} 
              className="input-field" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-cyan-200/55 uppercase tracking-wider mb-1">Term / Month</label>
              <input 
                required 
                type="text" 
                value={term} 
                onChange={e => setTerm(e.target.value)} 
                className="input-field" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-cyan-200/55 uppercase tracking-wider mb-1">Receipt Number</label>
              <input 
                type="text" 
                value={receipt} 
                onChange={e => setReceipt(e.target.value)} 
                className="input-field" 
                placeholder="Leave blank for unpaid"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-cyan-200/55 uppercase tracking-wider mb-1">Amount ($)</label>
              <input 
                required 
                type="number" 
                step="0.01" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                className="input-field" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 font-bold">Status</label>
              <select 
                value={status} 
                onChange={e => setStatus(e.target.value as any)} 
                className="input-field"
              >
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-cyan-900/10">
            <button onClick={onClose} type="button" className="px-4 py-2 border dark:border-cyan-900/30 rounded-lg text-sm text-gray-700 dark:text-slate-250 hover:bg-gray-55 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/95 transition-colors">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
