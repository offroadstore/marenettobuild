import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListCallRequests, useUpdateCallRequest, useDeleteCallRequest, exportCallRequests, getListCallRequestsQueryKey,
  type CallRecord, type CallStatus, type CallProject, type CallLocale, type ListCallRequestsParams,
} from '@workspace/api-client-react';
import { ArrowDownToLine, ChevronDown, PhoneCall, Trash2 } from 'lucide-react';
import { CALL_LOCALES } from '@/content/call-request-copy';
import { callRequestExport } from '@/lib/call-request-export';

const STATUSES: CallStatus[] = ['new', 'contacted', 'survey', 'quote', 'closed'];
const STATUS_LABEL: Record<CallStatus, string> = { new: 'New', contacted: 'Contacted', survey: 'Site survey', quote: 'Quote', closed: 'Closed' };
const PROJECTS: CallProject[] = ['renovation', 'construction', 'concrete_furniture', 'other'];
const DELIVERY_LABEL: Record<string, string> = { pending_provider: 'Pending provider config', sending: 'Sending', sent: 'Sent', failed: 'Failed', uncertain: 'Uncertain', simulated: 'Simulated (preview)' };
const fmt = (s?: string) => (s ? new Date(s).toLocaleString() : '—');

function Row({ r }: { r: CallRecord }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(r.notes);
  const [confirm, setConfirm] = useState(false);
  const [saved, setSaved] = useState('');
  const init = useRef<number | null>(null);
  useEffect(() => { if (init.current !== r.id) { init.current = r.id; setNotes(r.notes); } }, [r.id, r.notes]);
  const update = useUpdateCallRequest();
  const del = useDeleteCallRequest();
  const refresh = () => qc.invalidateQueries({ queryKey: getListCallRequestsQueryKey() });
  const patch = (data: { status?: CallStatus; notes?: string; acquiredCustomer?: boolean }, msg: string) =>
    update.mutate({ id: r.id, data }, { onSuccess: () => { setSaved(msg); refresh(); } });
  const exportOne = () => {
    try {
      const file = callRequestExport(r);
      const url = URL.createObjectURL(new Blob([file.text], { type: 'application/json;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = file.filename;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      setSaved('Single-request export downloaded. Review before sharing; no email was sent.');
    } catch { setSaved('Export failed. Please retry.'); }
  };
  const d = r.data;
  const dirty = notes !== r.notes;
  const pairs: [string, string][] = [
    ['Email', d.email], ['Mobile', d.mobile], ['WhatsApp OK', d.whatsapp ? 'Yes' : 'No'], ['Project', d.project ?? '—'], ['Location', d.location ?? '—'],
    ['Budget', d.budget ?? '—'], ['Start', d.startWhen ?? '—'], ['Time slot', d.timeSlot ?? '—'], ['Preferred language', d.preferredLanguage ?? '—'],
    ['Marketing consent', d.marketingAccepted ? 'Yes' : 'No'], ['Privacy notice read', d.privacyAccepted ? 'Yes' : 'No'],
    ['Consent at', fmt(r.consentAt)], ['Privacy version', r.privacyVersion], ['Consent language', r.consentLanguage],
    ['Source path', d.sourcePath ?? '—'], ['utm_source', d.utm?.utm_source ?? '—'], ['utm_medium', d.utm?.utm_medium ?? '—'], ['utm_campaign', d.utm?.utm_campaign ?? '—'],
    ['Owner email', DELIVERY_LABEL[r.ownerDelivery] ?? r.ownerDelivery], ['Customer email', DELIVERY_LABEL[r.customerDelivery] ?? r.customerDelivery],
    ['Created', fmt(r.createdAt)], ['Updated', fmt(r.updatedAt)], ['Form opened', d.formOpenedAt ? new Date(d.formOpenedAt).toLocaleString() : '—'], ['Idempotency key', d.idempotencyKey],
  ];
  return <article className={`int-lead-row ${open ? 'expanded' : ''}`} data-testid={`row-call-${r.id}`}>
    <div className="int-lead-person"><span className="int-row-mark">{d.firstName.slice(0, 1)}</span><div><strong>{d.firstName} {d.lastName}{r.isSynthetic && <em className="int-muted"> · synthetic</em>}</strong><small>{r.code} · {d.mobile}</small></div></div>
    <div><strong>{d.project ?? 'Unspecified'}</strong><small>{d.location || '—'} · {r.consentLanguage.toUpperCase()}</small></div>
    <div className="int-date">{new Date(r.createdAt).toLocaleDateString()}</div>
    <div><select aria-label={`Status for ${r.code}`} value={r.status} disabled={update.isPending} onChange={e => patch({ status: e.target.value as CallStatus }, 'Status saved')} data-testid={`select-call-status-${r.id}`}>{STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div>
    <button className="int-row-open" onClick={() => setOpen(!open)} aria-expanded={open} data-testid={`button-open-call-${r.id}`}>{open ? 'Close' : 'Open'} <ChevronDown size={14} /></button>
    {open && <div className="int-lead-detail">
      <div><span className="int-kicker">MESSAGE</span><p>{d.message || 'No message.'}</p>
        <dl className="int-call-grid">{pairs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></div>
      <label className="int-call-toggle"><input type="checkbox" checked={r.acquiredCustomer} disabled={update.isPending} onChange={e => patch({ acquiredCustomer: e.target.checked }, e.target.checked ? 'Contractual relationship recorded' : 'Contractual exception removed')} data-testid={`check-call-acquired-${r.id}`} /> Rapporto contrattuale effettivo (escluso dalla cancellazione a 12 mesi; indipendente dallo stato)</label>
      <button type="button" className="int-small-button" onClick={exportOne} data-testid={`button-call-export-${r.id}`}><ArrowDownToLine size={13} /> Export this request</button>
      <label>Internal notes<textarea value={notes} maxLength={5000} onChange={e => { setNotes(e.target.value); setSaved(''); }} data-testid={`textarea-call-notes-${r.id}`} /></label>
      <div className="int-inline-actions">
        <button className="int-primary" disabled={!dirty || update.isPending} onClick={() => patch({ notes }, 'Notes saved')} data-testid={`button-call-save-notes-${r.id}`}>{update.isPending ? 'Saving…' : 'Save notes'}</button>
        {dirty && <button className="int-small-button" onClick={() => setNotes(r.notes)}>Discard</button>}
        {!confirm ? <button className="int-small-button danger" onClick={() => setConfirm(true)} data-testid={`button-call-delete-${r.id}`}><Trash2 size={13} /> Delete</button>
          : <span className="int-inline-actions"><span>Delete {r.code} permanently? Delivered email copies must be removed manually.</span><button className="int-small-button danger" disabled={del.isPending} onClick={() => del.mutate({ id: r.id }, { onSuccess: refresh })} data-testid={`button-call-confirm-delete-${r.id}`}>{del.isPending ? 'Deleting…' : 'Confirm delete'}</button><button className="int-small-button" onClick={() => setConfirm(false)}>Cancel</button></span>}
      </div>
      {saved && !update.isError && <small role="status">{saved}</small>}
      {update.isError && <div className="int-inline-error" role="alert">Change not saved. Your edits are kept; retry.</div>}
      {del.isError && <div className="int-inline-error" role="alert">Delete failed. Retry.</div>}
    </div>}
  </article>;
}

export function CallRequestsPanel() {
  const [start, setStart] = useState(''); const [end, setEnd] = useState('');
  const [language, setLanguage] = useState(''); const [project, setProject] = useState(''); const [status, setStatus] = useState('');
  const [exporting, setExporting] = useState(false); const [exportError, setExportError] = useState('');
  const params = useMemo<ListCallRequestsParams>(() => {
    const p: ListCallRequestsParams = {};
    if (start) p.start = start; if (end) p.end = end;
    if (language) p.language = language as CallLocale; if (project) p.project = project as CallProject; if (status) p.status = status as CallStatus;
    return p;
  }, [start, end, language, project, status]);
  const list = useListCallRequests(params, { query: { queryKey: getListCallRequestsQueryKey(params), retry: false, staleTime: 0, gcTime: 0 } });
  const doExport = async () => {
    setExporting(true); setExportError('');
    try {
      const csv = await exportCallRequests(params);
      if (typeof csv !== 'string') throw new Error('Invalid CSV response');
      const text = csv;
      const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = `call-requests-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch { setExportError('Export failed. Check your owner session and retry.'); }
    finally { setExporting(false); }
  };
  const rows = list.data ?? [];
  return <div className="int-content">
    <div className="int-section-intro"><div><span className="int-kicker">CALLBACKS / OWNER ONLY</span><h2>Callback requests.</h2><p>Every request, its consent record and email delivery state. Automatically deleted after 12 months unless an actual contractual relationship is recorded. Export or permanently delete an individual request from its details; email copies must be handled separately.</p></div>
      <button className="int-primary" onClick={doExport} disabled={exporting} data-testid="button-call-export"><ArrowDownToLine size={15} /> {exporting ? 'Exporting…' : 'Export filtered CSV'}</button></div>
    <div className="int-inline-actions int-call-filters">
      <label>From<input type="date" value={start} onChange={e => setStart(e.target.value)} data-testid="input-call-filter-start" /></label>
      <label>To<input type="date" value={end} onChange={e => setEnd(e.target.value)} data-testid="input-call-filter-end" /></label>
      <select aria-label="Language" value={language} onChange={e => setLanguage(e.target.value)} data-testid="select-call-filter-language"><option value="">All languages</option>{CALL_LOCALES.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}</select>
      <select aria-label="Project" value={project} onChange={e => setProject(e.target.value)} data-testid="select-call-filter-project"><option value="">All projects</option>{PROJECTS.map(p => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}</select>
      <select aria-label="Status" value={status} onChange={e => setStatus(e.target.value)} data-testid="select-call-filter-status"><option value="">All statuses</option>{STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
    </div>
    {exportError && <div className="int-inline-error" role="alert">{exportError}</div>}
    {list.isError && <div className="int-inline-error" role="alert">Callback requests could not be loaded. <button onClick={() => list.refetch()}>Retry</button></div>}
    {list.isLoading ? <div><div className="int-skeleton wide" /><div className="int-skeleton" /></div> :
      <div className="int-panel int-table"><div className="int-table-head"><span>CONTACT</span><span>PROJECT</span><span>RECEIVED</span><span>STATUS</span><span>DETAILS</span></div>
        {rows.map(r => <Row key={r.id} r={r} />)}
        {!rows.length && !list.isError && <div className="int-empty"><PhoneCall size={20} /><strong>No callback requests</strong><p>Nothing matches these filters yet.</p></div>}
      </div>}
  </div>;
}
