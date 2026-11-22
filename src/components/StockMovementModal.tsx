"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Product, StockMovement } from '@/types';

type MovementType = 'in' | 'out';
const reasons = {
  in: ['Supplier delivery', 'Customer return', 'Stock correction', 'Other'],
  out: ['Sale / order', 'Damaged goods', 'Supplier return', 'Stock correction', 'Other'],
};

export default function StockMovementModal({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const changed = useRef(false);
  const [type, setType] = useState<MovementType>('in');
  const [balance, setBalance] = useState(product.quantity);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState(reasons.in[0]);
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState<StockMovement[]>([]);
  const [historyType, setHistoryType] = useState('all');
  const [historySearch, setHistorySearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const amount = Number(quantity);
  const maximum = type === 'out' ? balance : 2147483647 - balance;
  const valid = Number.isInteger(amount) && amount > 0 && amount <= maximum;
  const projected = valid ? balance + (type === 'in' ? amount : -amount) : null;
  const visibleHistory = history.filter(m => (historyType === 'all' || m.movement_type === historyType) && (m.notes || '').toLowerCase().includes(historySearch.trim().toLowerCase()));

  const loadHistory = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setHistoryError('');
    try {
      const response = await fetch('/api/stock-movements?product_id=' + product.id, { signal, cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load history');
      if (!signal?.aborted) setHistory(data);
    } catch (e) {
      if (!signal?.aborted) setHistoryError(e instanceof Error ? e.message : 'Failed to load history');
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [product.id]);

  useEffect(() => {
    dialog.current?.showModal();
    const controller = new AbortController();
    void loadHistory(controller.signal);
    return () => { controller.abort(); };
  }, [loadHistory]);

  function close() {
    if (submitting.current) return;
    if (changed.current) onSaved(); else onClose();
  }

  function changeType(next: MovementType) {
    setType(next); setReason(reasons[next][0]); setError(''); setSuccess('');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || !valid) return;
    submitting.current = true; setSaving(true); setError(''); setSuccess('');
    try {
      const response = await fetch('/api/stock-movements', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id, movement_type: type, quantity: amount, notes: reason + (notes.trim() ? ': ' + notes.trim() : '') }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to record stock movement');
      setBalance(data.quantity); changed.current = true;
      setSuccess('Stock ' + type + ' recorded: ' + amount + ' units. New balance: ' + data.quantity + '.');
      setQuantity(''); setNotes('');
      void loadHistory();
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to record stock movement'); }
    finally { submitting.current = false; setSaving(false); }
  }

  return <dialog ref={dialog} onCancel={event => { event.preventDefault(); close(); }} aria-labelledby="stock-title" className="m-auto w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700 bg-slate-800 p-6 text-white shadow-2xl backdrop:bg-black/75">
    <div className="flex items-start justify-between gap-4">
      <div><h2 id="stock-title" className="text-xl font-semibold">Manage stock</h2><p className="text-slate-300 mt-1">{product.name}</p></div>
      <button type="button" disabled={saving} onClick={close} className="rounded bg-slate-700 px-3 py-2 disabled:opacity-50">Close</button>
    </div>
    <div className="my-5 grid grid-cols-2 gap-3" aria-live="polite">
      <div className="rounded-lg bg-slate-900 p-4"><p className="text-sm text-slate-400">Available stock</p><p className="text-2xl font-bold">{balance} <span className="text-sm font-normal">units</span></p></div>
      <div className="rounded-lg bg-slate-900 p-4"><p className="text-sm text-slate-400">After this movement</p><p className="text-2xl font-bold">{projected ?? '—'} <span className="text-sm font-normal">units</span></p></div>
    </div>
    <form onSubmit={submit} className="space-y-4">
      <fieldset disabled={saving} className="space-y-4 disabled:opacity-60">
        <legend className="mb-2 text-sm text-slate-400">Movement type</legend>
        <div className="grid grid-cols-2 gap-3">{(['in', 'out'] as const).map(value => <button key={value} type="button" aria-pressed={type === value} onClick={() => changeType(value)} className={'rounded-lg border px-4 py-3 font-semibold ' + (type === value ? (value === 'in' ? 'border-green-400 bg-green-900/50 text-green-200' : 'border-orange-400 bg-orange-900/50 text-orange-200') : 'border-slate-600 text-slate-300')}>{value === 'in' ? '+ Stock in' : '− Stock out'}</button>)}</div>
        <p className="text-sm text-slate-400">{type === 'in' ? 'Add received or returned items to inventory.' : 'Remove sold, damaged, or returned items from inventory.'}</p>
        <label className="block">Quantity<input required autoFocus type="number" min="1" step="1" max={maximum} value={quantity} onChange={e => { setQuantity(e.target.value); setSuccess(''); }} aria-describedby="quantity-help" placeholder="Enter number of units" className="mt-1 block w-full rounded bg-slate-700 p-3" /></label>
        <p id="quantity-help" className="text-sm text-slate-400">{type === 'out' ? 'Maximum available: ' + balance + ' units.' : 'Enter a positive whole number.'}{quantity && !valid && <span className="block text-orange-300">{maximum === 0 ? 'No units available for this movement.' : 'Enter a whole number from 1 to ' + maximum + '.'}</span>}</p>
        <label className="block">Reason<select value={reason} onChange={e => setReason(e.target.value)} className="mt-1 block w-full rounded bg-slate-700 p-3">{reasons[type].map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="block">Notes / reference (optional)<textarea maxLength={900} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. delivery reference or order number" className="mt-1 block w-full rounded bg-slate-700 p-3" /></label>
      </fieldset>
      {error && <p role="alert" className="text-red-300">{error}</p>}
      {success && <p role="status" className="rounded bg-green-900/40 p-3 text-green-200">{success}</p>}
      <button disabled={saving || !valid} className={'w-full rounded-lg px-4 py-3 font-semibold disabled:opacity-50 ' + (type === 'in' ? 'bg-green-700 hover:bg-green-600' : 'bg-orange-700 hover:bg-orange-600')}>{saving ? 'Recording…' : 'Record stock ' + type + (valid ? ' · ' + amount + ' units' : '')}</button>
    </form>
    <div className="mt-7 border-t border-slate-700 pt-5">
      <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Movement history</h3><button type="button" disabled={loading || saving} onClick={() => void loadHistory()} className="text-sm text-sky-300 disabled:opacity-50">Refresh</button></div>
      <p className="mt-1 text-xs text-slate-400">Latest 100 movements · Times shown in Malaysia time</p>
      <div className="my-3 flex flex-wrap gap-2"><select aria-label="Filter movement history" value={historyType} onChange={e => setHistoryType(e.target.value)} className="rounded bg-slate-700 p-2"><option value="all">All movements</option><option value="in">Stock in</option><option value="out">Stock out</option></select><input aria-label="Search movement notes" value={historySearch} onChange={e => setHistorySearch(e.target.value)} placeholder="Search reasons or references…" className="min-w-0 flex-1 rounded bg-slate-700 p-2" /></div>
      {historyError ? <p role="alert" className="text-red-300">{historyError} Use Refresh to retry.</p> : loading ? <p role="status">Loading history…</p> : visibleHistory.length === 0 ? <p className="py-4 text-slate-400">{history.length ? 'No movements match these filters.' : 'No movements recorded yet.'}</p> : <ul className="divide-y divide-slate-700">{visibleHistory.map(m => <li key={m.id} className="py-3"><div className="flex justify-between gap-2"><span className={m.movement_type === 'in' ? 'text-green-300' : 'text-orange-300'}>{m.movement_type === 'in' ? '+' : '−'}{m.quantity} · Stock {m.movement_type}</span><span className="text-sm">Balance: {m.balance_after}</span></div><p className="mt-1 text-xs text-slate-400">{new Date(m.created_at).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}</p>{m.notes && <p className="mt-1 whitespace-pre-wrap break-words text-sm">{m.notes}</p>}</li>)}</ul>}
    </div>
  </dialog>;
}
