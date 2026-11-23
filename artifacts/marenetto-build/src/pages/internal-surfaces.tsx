import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth, useClerk } from '@clerk/react';
import {
  getGetPrivateAttachmentQueryKey, getHealthCheckQueryKey,
  useCreateCmsPage, useFinalizeInternalAttachment, useGetInternalSession, useGetPrivateAttachment,
  useGetPublishedCmsPage,
  useInviteInternalMember, useListCmsPages, useListInternalAttachments,
  useListInternalLeads, useListInternalMembers, useListInternalNotifications,
  useRequestInternalAttachmentUpload, useUpdateCmsPage, useUpdateInternalLead,
  useUpdateInternalMember, useUpdateInternalNotification, useHealthCheck,
  getGetInternalSessionQueryKey, getListCmsPagesQueryKey, getListInternalAttachmentsQueryKey,
  getListInternalLeadsQueryKey, getListInternalMembersQueryKey,
  getListInternalNotificationsQueryKey,
  type CmsPage, type CmsPageInput, type LeadStatus, type InternalRole,
} from '@workspace/api-client-react';
import {
  ArrowDownToLine, ArrowRight, Bell, Check, ChevronDown, CircleAlert, FileText,
  HardHat, Languages, Activity, ChartLine, LayoutDashboard, PhoneCall, Newspaper, LockKeyhole, LogOut, Plus, Send, Shield, Upload, Users,
} from 'lucide-react';
import { Link } from 'wouter';
import { EditorialPanel, editorialHasUnsavedChanges } from '@/pages/editorial';
import { DashboardPanel } from '@/pages/monitoring/dashboard';
import { MonitoringPanel } from '@/pages/monitoring/monitoring';
import { CallRequestsPanel } from '@/pages/call-requests-panel';
import '@/styles/call-request.css';

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function InternalEntry() {
  useEffect(() => {
    document.title = 'Private team space | Marenetto Build';
    document.documentElement.lang = 'en';
    document.querySelector('meta[name="robots"]')?.setAttribute('content', 'noindex, nofollow, noarchive');
  }, []);
  if (!clerkKey) return <AuthNotConfigured />;
  return <ClerkInternal />;
}

function AuthNotConfigured() {
  return <div className="access-screen"><div className="access-card"><span className="int-kicker">MARENETTO BUILD / TEAM</span><LockKeyhole size={28} /><h1>Private team space</h1><p>Staff sign-in is not configured in this preview. No internal records are available here.</p><Link href="/" className="int-back">Back to Marenetto Build <ArrowRight size={15} /></Link></div></div>;
}

function ClerkInternal() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <InternalLoading />;
  if (!isSignedIn) return <div className="access-screen"><div className="access-card"><span className="int-kicker">MARENETTO BUILD / TEAM</span><LockKeyhole size={28} /><h1>Private team space</h1><p>Sign in with an invited staff account to continue. This area is not available to the public.</p><Link href="/sign-in" className="int-primary" data-testid="button-sign-in">Sign in <ArrowRight size={15} /></Link><Link href="/" className="int-back">Return to public site</Link></div></div>;
  return <InternalConsole />;
}

function InternalLoading() {
  return <div className="internal-shell"><div className="internal-sidebar"><div className="int-brand">M<span>·</span>B</div></div><main className="internal-main"><div className="int-skeleton wide" /><div className="int-skeleton" /><div className="int-skeleton" /></main></div>;
}

type Tab = 'overview' | 'dashboard' | 'monitoring' | 'leads' | 'cms' | 'articles' | 'languages' | 'notifications' | 'team' | 'files' | 'calls';
const statusLabels: Record<LeadStatus, string> = { new: 'New', reviewing: 'Reviewing', waiting: 'Waiting', approved: 'Approved', closed: 'Closed' };
const statuses: LeadStatus[] = ['new', 'reviewing', 'waiting', 'approved', 'closed'];
const roleLabels: Record<InternalRole, string> = { owner: 'Owner', editor: 'Editor', viewer: 'Viewer' };

function InternalConsole() {
  const [tab, setTabState] = useState<Tab>(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('section') === 'monitoring' ? 'monitoring' : 'overview');
  const setTab = (next: Tab) => {
    setTabState(next);
    const url = new URL(window.location.href);
    if (next === 'monitoring') url.searchParams.set('section', 'monitoring'); else url.searchParams.delete('section');
    url.searchParams.delete('google');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  };
  const [notice, setNotice] = useState('');
  const queryClient = useQueryClient();
  const { signOut } = useClerk();
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), retry: false } });
  const session = useGetInternalSession({ query: { queryKey: getGetInternalSessionQueryKey(), retry: false } });
  const enabled = !!session.data && !session.isError;
  const permissions = session.data?.permissions ?? [];
  const liveData = session.data?.dataMode === 'live';
  const canWriteLeads = liveData && permissions.includes('leads:write');
  const canWriteCms = liveData && permissions.includes('cms:write');
  const canManageMembers = permissions.includes('members:manage');
  const canManageAttachments = permissions.includes('attachments:manage');
  // KPI/monitoring never load the legacy enquiries. Preserve their independent
  // management surfaces without treating them as today's email-only form data.
  const needsLeads = tab === 'overview' || tab === 'leads' || tab === 'files';
  const operationalEnabled = enabled && tab !== 'dashboard' && tab !== 'monitoring';
  const leads = useListInternalLeads(undefined, { query: { enabled: enabled && needsLeads && permissions.includes('leads:read'), queryKey: getListInternalLeadsQueryKey(), retry: false } });
  const pages = useListCmsPages(undefined, { query: { enabled: operationalEnabled, queryKey: getListCmsPagesQueryKey(), retry: false } });
  const notifications = useListInternalNotifications({ query: { enabled: operationalEnabled, queryKey: getListInternalNotificationsQueryKey(), retry: false } });
  const members = useListInternalMembers({ query: { enabled: operationalEnabled && canManageMembers, queryKey: getListInternalMembersQueryKey(), retry: false } });
  const attachments = useListInternalAttachments(undefined, { query: { enabled: operationalEnabled && canManageAttachments, queryKey: getListInternalAttachmentsQueryKey(), retry: false } });
  const sessionError = session.error as { status?: number; message?: string; response?: { status?: number } } | null;
  const forbidden = sessionError?.status === 403 || sessionError?.response?.status === 403 || /403|forbidden/i.test(sessionError?.message || '');
  const allTabs: { id: Tab; label: string; icon: ReactNode; permission?: string }[] = [
    { id: 'overview', label: 'Panoramica operativa', icon: <LayoutDashboard size={17} /> },
    { id: 'dashboard', label: 'Dashboard', icon: <ChartLine size={17} />, permission: 'kpi:read' },
    { id: 'monitoring', label: 'Monitoraggio', icon: <Activity size={17} />, permission: 'kpi:read' },
    { id: 'leads', label: 'Enquiries', icon: <HardHat size={17} />, permission: 'leads:read' },
    ...(session.data?.role === 'owner' ? [{ id: 'calls' as Tab, label: 'Callbacks', icon: <PhoneCall size={17} /> }] : []),
    { id: 'cms', label: 'Website drafts', icon: <FileText size={17} />, permission: 'cms:read' },
    { id: 'articles', label: 'Articoli', icon: <Newspaper size={17} />, permission: 'cms:read' },
    { id: 'languages', label: 'Lingue', icon: <Languages size={17} />, permission: 'cms:read' },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={17} />, permission: 'notifications:read' },
    { id: 'team', label: 'Team access', icon: <Users size={17} />, permission: 'members:manage' },
    { id: 'files', label: 'Private files', icon: <LockKeyhole size={17} />, permission: 'attachments:manage' },
  ];
  const tabs = allTabs.filter((item) => !item.permission || permissions.includes(item.permission));
  const refresh = (key: readonly unknown[]) => queryClient.invalidateQueries({ queryKey: key });
  const hasDataError = operationalEnabled && [leads, pages, notifications, ...(canManageMembers ? [members] : []), ...(canManageAttachments ? [attachments] : [])].some(q => q.isError);
  return <div className="internal-shell">
    <aside className="internal-sidebar">
      <Link href="/" className="int-brand" aria-label="Marenetto Build public site">M<span>·</span>B</Link>
      <div className="int-side-label">TEAM CONSOLE</div>
      <nav className="int-nav">{tabs.map(item => <button key={item.id} aria-current={tab === item.id ? 'page' : undefined} className={tab === item.id ? 'active' : ''} onClick={() => { if (item.id !== tab && editorialHasUnsavedChanges() && !window.confirm('Ci sono modifiche editoriali non salvate. Cambiare sezione e perderle?')) return; setTab(item.id); }} data-testid={`nav-internal-${item.id}`}>{item.icon}<span>{item.label}</span>{item.id === 'notifications' && (notifications.data?.filter(n => !n.isRead).length || 0) > 0 && <i>{notifications.data?.filter(n => !n.isRead).length}</i>}</button>)}</nav>
      <div className="int-sidebar-foot"><span className="int-user-badge">{session.data?.email?.slice(0, 1).toUpperCase() || 'T'}</span><div><strong>{session.data?.email || 'Team member'}</strong><small>{session.data?.role || 'staff'}</small></div><button className="int-logout" type="button" aria-label="Sign out" title="Sign out" onClick={() => void signOut({ redirectUrl: basePath || '/' })}><LogOut size={15} /><span>Sign out</span></button></div>
    </aside>
    <main className="internal-main">
      <header className="int-topbar"><div><span className="int-breadcrumb">Marenetto Build <span>/</span> {tabs.find(t => t.id === tab)?.label}</span><h1>{tabs.find(t => t.id === tab)?.label}</h1></div><div className="int-top-meta"><span className="int-secure"><Shield size={14} /> Invite-only</span><span className="int-live-dot" /> Private session <span className={`int-health ${health.isError ? 'down' : ''}`}>API {health.isLoading ? 'checking' : health.data?.status || 'unavailable'}</span></div></header>
      {session.isLoading && <InternalLoading />}
      {session.isError && <div className="int-access-warning"><CircleAlert size={21} /><div><strong>{forbidden ? 'Account non abilitato all’area interna' : 'Impossibile verificare l’accesso interno'}</strong><p>{forbidden ? 'L’account deve avere un indirizzo verificato e un invito attivo. Nessun dato interno è stato caricato.' : 'Il servizio di accesso non è disponibile. Finché servizi e database non sono pronti, letture e salvataggi editoriali restano bloccati; non vengono simulati salvataggi riusciti.'}</p>{!forbidden && <button className="int-small-button" onClick={() => session.refetch()}>Riprova la verifica</button>}</div></div>}
      {enabled && <>
        {hasDataError && <div className="int-inline-error" role="alert">Some team data could not be loaded. <button onClick={() => { refresh(getListInternalLeadsQueryKey()); refresh(getListCmsPagesQueryKey()); refresh(getListInternalNotificationsQueryKey()); refresh(getListInternalMembersQueryKey()); refresh(getListInternalAttachmentsQueryKey()); }}>Retry</button></div>}
        {tab === 'overview' && <Overview data={{ leads: leads.data || [], pages: pages.data || [], notifications: notifications.data || [], files: attachments.data || [] }} loading={[leads, pages, notifications, ...(canManageAttachments ? [attachments] : [])].some(q => q.isLoading)} go={setTab} canManageAttachments={canManageAttachments} />}
        {tab === 'dashboard' && permissions.includes('kpi:read') && <DashboardPanel go={setTab} />}
        {tab === 'monitoring' && permissions.includes('kpi:read') && <MonitoringPanel />}
        {tab === 'leads' && <LeadsPanel leads={leads.data || []} loading={leads.isLoading} canWrite={canWriteLeads} writeLocked={!liveData} onSaved={() => refresh(getListInternalLeadsQueryKey())} />}
        {tab === 'calls' && session.data.role === 'owner' && <CallRequestsPanel />}
        {tab === 'cms' && <CmsPanel pages={pages.data || []} loading={pages.isLoading} canWrite={canWriteCms} writeLocked={!liveData} onSaved={() => refresh(getListCmsPagesQueryKey())} setNotice={setNotice} />}
        {(tab === 'articles' || tab === 'languages') && <EditorialPanel key={tab} mode={tab} role={session.data.role} />}
        {tab === 'notifications' && <NotificationsPanel items={notifications.data || []} loading={notifications.isLoading} onSaved={() => refresh(getListInternalNotificationsQueryKey())} />}
        {tab === 'team' && <TeamPanel members={members.data || []} loading={members.isLoading} role={session.data.role} onSaved={() => refresh(getListInternalMembersQueryKey())} />}
        {tab === 'files' && <FilesPanel files={attachments.data || []} leads={leads.data || []} loading={attachments.isLoading} uploadEnabled={liveData} onSaved={() => refresh(getListInternalAttachmentsQueryKey())} />}
      </>}
      {notice && <div className="int-toast" role="status"><Check size={16} />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notification">×</button></div>}
    </main>
  </div>;
}

function Overview({ data, loading, go, canManageAttachments }: { data: { leads: any[]; pages: CmsPage[]; notifications: any[]; files: any[] }; loading: boolean; go: (tab: Tab) => void; canManageAttachments: boolean }) {
  if (loading) return <PanelSkeleton />;
  const newLeads = data.leads.filter(l => l.leadStatus === 'new').length;
  const unread = data.notifications.filter(n => !n.isRead).length;
  return <div className="int-content"><div className="int-welcome"><div><span className="int-kicker">WORKSPACE / CEFALÙ</span><h2>Good work starts with a clear view.</h2><p>Private workspace for the people coordinating requests, site updates and the next steps.</p></div><div className="int-stamp"><span>LOCAL</span><strong>38°01′ N</strong><small>14°01′ E</small></div></div>
     <div className="int-stat-grid"><Stat label="Open enquiries" value={String(data.leads.filter(l => !['closed', 'approved'].includes(l.leadStatus)).length)} detail={`${newLeads} new`} icon={<HardHat size={18} />} /><Stat label="Draft pages" value={String(data.pages.filter(p => p.status === 'draft').length)} detail={`${data.pages.filter(p => p.status === 'published').length} published`} icon={<FileText size={18} />} /><Stat label="Unread notices" value={String(unread)} detail="Persistent team updates" icon={<Bell size={18} />} />{canManageAttachments && <Stat label="Private files" value={String(data.files.length)} detail="Access-controlled" icon={<LockKeyhole size={18} />} />}</div>
    <div className="int-overview-grid"><section className="int-panel"><div className="int-panel-head"><div><span className="int-kicker">INBOX</span><h3>Recent enquiries</h3></div><button className="int-text-button" onClick={() => go('leads')}>All enquiries <ArrowRight size={14} /></button></div>{data.leads.slice(0, 4).map(lead => <div className="int-list-row" key={lead.id}><span className="int-row-mark">{lead.name.slice(0, 1)}</span><div className="int-row-copy"><strong>{lead.name}</strong><small>{lead.service} · {lead.location}</small></div><StatusPill status={lead.leadStatus} /></div>)}{!data.leads.length && <EmptyState title="No enquiries yet" text="New website requests will appear here." />}</section><section className="int-panel int-notice-panel"><div className="int-panel-head"><div><span className="int-kicker">ACTIVITY</span><h3>Team notifications</h3></div><button className="int-text-button" onClick={() => go('notifications')}>View all <ArrowRight size={14} /></button></div>{data.notifications.slice(0, 4).map(item => <div className={`int-notice-row ${item.isRead ? '' : 'unread'}`} key={item.id}><span className="int-notice-dot" /><div><strong>{item.title}</strong><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString()}</small></div></div>)}{!data.notifications.length && <EmptyState title="All quiet" text="Persistent updates will collect here." />}</section></div>
    <section className="int-panel int-pages-summary"><div className="int-panel-head"><div><span className="int-kicker">CONTENT</span><h3>Website pages</h3></div><button className="int-text-button" onClick={() => go('cms')}>Open CMS <ArrowRight size={14} /></button></div><div className="int-page-strip">{data.pages.slice(0, 5).map(page => <div key={page.id}><span className="int-page-locale">{page.locale.toUpperCase()}</span><strong>{page.title}</strong><small>/{page.slug}</small><StatusPill status={page.status} /></div>)}{!data.pages.length && <EmptyState title="No pages returned" text="CMS pages will appear here when available." />}</div></section>
  </div>;
}

function Stat({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: ReactNode }) {
  return <div className="int-stat"><span className="int-stat-icon">{icon}</span><small>{label}</small><strong>{value}</strong><span>{detail}</span></div>;
}
function StatusPill({ status }: { status: string }) { return <span className={`int-status ${status}`}>{status.replace('_', ' ')}</span>; }
function PanelSkeleton() { return <div className="int-content"><div className="int-skeleton wide" /><div className="int-skeleton" /><div className="int-skeleton" /></div>; }
function EmptyState({ title, text }: { title: string; text: string }) { return <div className="int-empty"><span>—</span><strong>{title}</strong><p>{text}</p></div>; }

function LeadsPanel({ leads, loading, canWrite, writeLocked, onSaved }: { leads: any[]; loading: boolean; canWrite: boolean; writeLocked: boolean; onSaved: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [filter, setFilter] = useState('all');
  const update = useUpdateInternalLead();
  const filtered = filter === 'all' ? leads : leads.filter(l => l.leadStatus === filter);
  const save = (leadId: number, data: { leadStatus?: LeadStatus; internalNotes?: string; assignedTo?: string | null }) => update.mutate({ leadId, data }, { onSuccess: onSaved });
  if (loading) return <PanelSkeleton />;
  return <div className="int-content"><div className="int-section-intro"><div><span className="int-kicker">REQUESTS / PRIVATE</span><h2>Enquiries, with context.</h2><p>Keep the next step visible and capture internal notes for the team.</p></div><select aria-label="Filter enquiries" value={filter} onChange={e => setFilter(e.target.value)} data-testid="select-lead-filter"><option value="all">All statuses</option>{statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}</select></div>{writeLocked && <div className="int-info-banner"><LockKeyhole size={16} /> Lead edits remain paused while this workspace is in synthetic preview mode.</div>}{update.isError && <div className="int-inline-error">Update could not be saved. Try again.</div>}<div className="int-panel int-table"><div className="int-table-head"><span>ENQUIRY</span><span>REQUEST</span><span>RECEIVED</span><span>STATUS</span><span>DETAILS</span></div>{filtered.map(lead => <article className={`int-lead-row ${selected === lead.id ? 'expanded' : ''}`} key={lead.id}><div className="int-lead-person"><span className="int-row-mark">{lead.name.slice(0, 1)}</span><div><strong>{lead.name}</strong><small>{lead.email || lead.phone || 'No contact details'}</small></div></div><div><strong>{lead.service}</strong><small>{lead.propertyType} · {lead.location}</small></div><div className="int-date">{new Date(lead.createdAt).toLocaleDateString()}</div><div><select aria-label={`Status for ${lead.name}`} value={lead.leadStatus} disabled={!canWrite || update.isPending} onChange={e => save(lead.id, { leadStatus: e.target.value as LeadStatus })} data-testid={`select-lead-status-${lead.id}`}>{statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}</select></div><button className="int-row-open" onClick={() => setSelected(selected === lead.id ? null : lead.id)} aria-expanded={selected === lead.id} data-testid={`button-open-lead-${lead.id}`}>{selected === lead.id ? 'Close' : 'Open'} <ChevronDown size={14} /></button>
        {selected === lead.id && <div className="int-lead-detail"><div><span className="int-kicker">MESSAGE</span><p>{lead.message}</p><small>Preferred language: {lead.preferredLanguage} · Channel: {lead.preferredChannel}</small></div><label>Internal note<textarea disabled={!canWrite} defaultValue={lead.internalNotes || ''} maxLength={5000} placeholder="Add an internal note" onBlur={e => { if (canWrite && e.target.value !== lead.internalNotes) save(lead.id, { internalNotes: e.target.value }); }} data-testid={`textarea-lead-notes-${lead.id}`} /></label><label>Assigned to<input disabled={!canWrite} defaultValue={lead.assignedTo || ''} maxLength={254} placeholder="Staff email" onBlur={e => { if (canWrite && e.target.value !== (lead.assignedTo || '')) save(lead.id, { assignedTo: e.target.value || null }); }} /></label></div>}
      </article>)}{filtered.length === 0 && <EmptyState title="No matching enquiries" text="Try another status filter, or check back when a new request arrives." />}</div></div>;
}

function CmsPanel({ pages, loading, canWrite, writeLocked, onSaved, setNotice }: { pages: CmsPage[]; loading: boolean; canWrite: boolean; writeLocked: boolean; onSaved: () => void; setNotice: (s: string) => void }) {
  const [editing, setEditing] = useState<CmsPage | 'new' | null>(null);
  const [locale, setLocale] = useState('all');
  const create = useCreateCmsPage();
  const update = useUpdateCmsPage();
  const filtered = locale === 'all' ? pages : pages.filter(p => p.locale === locale);
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = { slug: String(form.get('slug')), locale: String(form.get('locale')), title: String(form.get('title')), body: String(form.get('body')) } as CmsPageInput;
    if (editing === 'new' && canWrite) create.mutate({ data: input }, { onSuccess: () => { onSaved(); setEditing(null); setNotice('Draft created'); } });
    else if (editing && editing !== 'new' && canWrite) update.mutate({ pageId: editing.id, data: { title: input.title, body: input.body } }, { onSuccess: () => { onSaved(); setEditing(null); setNotice('Page saved'); } });
  };
  const publish = (page: CmsPage, status: 'draft' | 'published') => {
    if (!canWrite) return;
    update.mutate({ pageId: page.id, data: { status } }, { onSuccess: () => { onSaved(); setNotice(status === 'published' ? 'Page published' : 'Page returned to draft'); } });
  };
  if (loading) return <PanelSkeleton />;
  return <div className="int-content"><div className="int-section-intro"><div><span className="int-kicker">CMS / PUBLICATION</span><h2>Words for the public site.</h2><p>Published pages are available at <code>/content/{'{locale}'}/{'{slug}'}</code>.</p></div><div className="int-inline-actions"><select aria-label="Filter by locale" value={locale} onChange={e => setLocale(e.target.value)}><option value="all">All locales</option>{Array.from(new Set(pages.map(p => p.locale))).map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}</select>{canWrite && <button className="int-primary" onClick={() => setEditing('new')}><Plus size={15} /> New draft</button>}</div></div>{writeLocked && <div className="int-info-banner"><LockKeyhole size={16} /> CMS changes and publishing are paused until privacy, provider, and end-to-end testing approvals are complete.</div>}
    {(create.isError || update.isError) && <div className="int-inline-error">The CMS change was not saved. Please retry.</div>}
     <div className="int-cms-grid">{filtered.map(page => <article className="int-cms-card" key={page.id}><div className="int-cms-card-top"><span className="int-page-locale">{page.locale.toUpperCase()}</span><StatusPill status={page.status} /></div><h3>{page.title}</h3><span className="int-cms-slug">/{page.slug}</span><p>{page.body.slice(0, 140)}{page.body.length > 140 ? '…' : ''}</p><small>Updated {new Date(page.updatedAt).toLocaleDateString()} · {page.updatedBy}</small><div className="int-cms-actions">{canWrite && <button className="int-small-button" onClick={() => setEditing(page)}>Edit draft</button>}{page.status === 'draft' ? canWrite && <button className="int-small-button dark" disabled={update.isPending} onClick={() => publish(page, 'published')}>Publish <ArrowRight size={13} /></button> : <>{canWrite && <button className="int-small-button" disabled={update.isPending} onClick={() => publish(page, 'draft')}>Unpublish</button>}<Link className="int-small-button" href={`/content/${page.locale}/${page.slug}`} target="_blank">View published page <ArrowRight size={13} /></Link></>}</div></article>)}{!filtered.length && <EmptyState title="No pages in this view" text={canWrite ? 'Create a draft page to begin.' : 'Published content will appear here when available.'} />}</div>
    {editing && <div className="int-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setEditing(null); }}><section className="int-modal" role="dialog" aria-modal="true" aria-labelledby="cms-modal-title"><div className="int-modal-head"><div><span className="int-kicker">CONTENT EDITOR</span><h3 id="cms-modal-title">{editing === 'new' ? 'Create a page draft' : 'Edit page'}</h3></div><button onClick={() => setEditing(null)} aria-label="Close editor">×</button></div><form onSubmit={save}><label>Slug<input name="slug" defaultValue={editing === 'new' ? '' : editing.slug} required maxLength={160} disabled={editing !== 'new'} placeholder="page-name" /></label><div className="int-form-two"><label>Locale<input name="locale" defaultValue={editing === 'new' ? 'it' : editing.locale} required maxLength={10} disabled={editing !== 'new'} /></label><label>Title<input name="title" defaultValue={editing === 'new' ? '' : editing.title} required maxLength={200} /></label></div><label>Body<textarea name="body" defaultValue={editing === 'new' ? '' : editing.body} maxLength={50000} rows={9} /></label><div className="int-modal-actions"><button type="button" className="int-small-button" onClick={() => setEditing(null)}>Cancel</button><button className="int-primary" type="submit" disabled={create.isPending || update.isPending}>{create.isPending || update.isPending ? 'Saving…' : 'Save draft'}</button></div></form></section></div>}
  </div>;
}

function NotificationsPanel({ items, loading, onSaved }: { items: any[]; loading: boolean; onSaved: () => void }) {
  const mutation = useUpdateInternalNotification();
  if (loading) return <PanelSkeleton />;
  return <div className="int-content"><div className="int-section-intro"><div><span className="int-kicker">ACTIVITY / PERSISTENT</span><h2>Keep the thread in view.</h2><p>Notifications remain available until the team marks them read.</p></div><span className="int-count-pill">{items.filter(i => !i.isRead).length} unread</span></div>{mutation.isError && <div className="int-inline-error">Could not update notification state.</div>}<div className="int-panel int-notification-list">{items.map(item => <article className={`int-notification-item ${item.isRead ? 'read' : ''}`} key={item.id}><span className="int-notification-symbol"><Bell size={17} /></span><div className="int-notification-copy"><div><strong>{item.title}</strong>{!item.isRead && <i>NEW</i>}</div><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString()}</small>{item.type === 'lead' && <small>Email: {item.emailStatus === 'sent' ? 'sent' : item.emailStatus === 'failed' ? 'failed' : item.emailStatus === 'sending' ? 'sending' : 'pending approval or configuration'}</small>}</div><button className="int-small-button" disabled={mutation.isPending} onClick={() => mutation.mutate({ notificationId: item.id, data: { isRead: !item.isRead } }, { onSuccess: onSaved })}>{item.isRead ? 'Mark unread' : 'Mark read'}</button></article>)}{!items.length && <EmptyState title="No notifications" text="Updates for the team will be kept here." />}</div></div>;
}

function TeamPanel({ members, loading, role, onSaved }: { members: any[]; loading: boolean; role: InternalRole; onSaved: () => void }) {
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<InternalRole>('editor');
  const invite = useInviteInternalMember();
  const update = useUpdateInternalMember();
  const canManage = role === 'owner';
  const submit = (e: FormEvent) => { e.preventDefault(); invite.mutate({ data: { email, role: inviteRole } }, { onSuccess: () => { setEmail(''); onSaved(); } }); };
  if (loading) return <PanelSkeleton />;
  return <div className="int-content"><div className="int-section-intro"><div><span className="int-kicker">ACCESS / INVITE ONLY</span><h2>Small team, clear permissions.</h2><p>Only invited staff accounts can reach this console. Owners manage access and roles.</p></div><span className="int-count-pill"><Shield size={14} /> Your role: {roleLabels[role]}</span></div>{!canManage && <div className="int-info-banner"><LockKeyhole size={16} /> Your account can view team access, but only an owner can invite people or change permissions.</div>}
    {(invite.isError || update.isError) && <div className="int-inline-error">Team access could not be updated. Check permissions and retry.</div>}
     {canManage && <form className="int-invite-form" onSubmit={submit}><div><span className="int-kicker">ADD A TEAM MEMBER</span><strong>Create an access invite</strong><small>No email is sent from this preview; access activates after verified sign-in.</small></div><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" aria-label="Team member email" data-testid="input-invite-email" /><select value={inviteRole} onChange={e => setInviteRole(e.target.value as InternalRole)} aria-label="Invitation role"><option value="editor">Editor</option><option value="viewer">Viewer</option><option value="owner">Owner</option></select><button className="int-primary" disabled={invite.isPending}><Send size={14} /> {invite.isPending ? 'Saving…' : 'Save invite'}</button></form>}
    <div className="int-panel int-team-list"><div className="int-team-head"><span>MEMBER</span><span>ROLE</span><span>STATUS</span><span>ADDED</span><span>ACCESS</span></div>{members.map(member => <div className="int-member-row" key={member.id}><div className="int-lead-person"><span className="int-row-mark">{member.email.slice(0, 1).toUpperCase()}</span><div><strong>{member.email}</strong><small>{member.invitedBy ? `Invited by ${member.invitedBy}` : 'Team access'}</small></div></div><div>{canManage ? <select value={member.role} onChange={e => update.mutate({ memberId: member.id, data: { role: e.target.value as InternalRole } }, { onSuccess: onSaved })} aria-label={`Role for ${member.email}`}><option value="owner">Owner</option><option value="editor">Editor</option><option value="viewer">Viewer</option></select> : roleLabels[member.role as InternalRole]}</div><StatusPill status={member.status} /><small>{new Date(member.createdAt).toLocaleDateString()}</small><div>{canManage && member.status !== 'revoked' ? <button className="int-small-button danger" onClick={() => update.mutate({ memberId: member.id, data: { status: 'revoked' } }, { onSuccess: onSaved })}>Revoke access</button> : <span className="int-muted">—</span>}</div></div>)}{members.length === 0 && <EmptyState title="No team members listed" text="Invite access is managed by an owner." />}</div></div>;
}

function FilesPanel({ files, leads, loading, uploadEnabled, onSaved }: { files: any[]; leads: any[]; loading: boolean; uploadEnabled: boolean; onSaved: () => void }) {
  const [leadId, setLeadId] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewPath, setPreviewPath] = useState('');
  const requestUpload = useRequestInternalAttachmentUpload();
  const finalize = useFinalizeInternalAttachment();
  const queryClient = useQueryClient();
  const privateFile = useGetPrivateAttachment(previewPath || 'pending', { query: { enabled: !!previewPath, queryKey: getGetPrivateAttachmentQueryKey(previewPath || 'pending') } });
  const totalBytes = useMemo(() => files.reduce((sum, f) => sum + f.size, 0), [files]);
  const previewUrl = useMemo(() => privateFile.data ? URL.createObjectURL(privateFile.data) : '', [privateFile.data]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  const upload = async (file?: File) => {
    if (!file) return;
    if (!uploadEnabled) { setError('Private uploads are locked until privacy, provider, and testing approvals are complete.'); return; }
    setError('');
    if (file.size > 15 * 1024 * 1024) { setError('Files must be 15 MB or smaller.'); return; }
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const contentTypeByExtension: Record<string, string> = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    const contentType = file.type || contentTypeByExtension[extension] || '';
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(contentType)) { setError('Choose a PDF, JPEG, PNG or WebP file.'); return; }
    setUploading(true);
    try {
      const metadata = { leadId: leadId ? Number(leadId) : null, fileName: file.name, contentType, size: file.size };
      const url = await requestUpload.mutateAsync({ data: metadata });
      const put = await fetch(url.uploadURL, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
      if (!put.ok) throw new Error('The private upload did not complete.');
      await finalize.mutateAsync({ data: { ...metadata, objectPath: url.objectPath } });
      await queryClient.invalidateQueries({ queryKey: getListInternalAttachmentsQueryKey() });
      onSaved();
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed. Please retry.'); }
    finally { setUploading(false); }
  };
  if (loading) return <PanelSkeleton />;
  return <div className="int-content"><div className="int-section-intro"><div><span className="int-kicker">STORAGE / RESTRICTED</span><h2>Files stay with the team.</h2><p>Private attachments are uploaded directly to protected storage and only viewed through the authenticated API.</p></div><div className="int-file-total">{files.length}<small>stored files</small></div></div>
    {!uploadEnabled && <div className="int-info-banner"><LockKeyhole size={16} /> Uploads and private file access are locked until privacy, provider, and end-to-end testing approvals are complete.</div>}
    <div className="int-upload-panel"><div className="int-upload-icon"><Upload size={20} /></div><div className="int-upload-copy"><strong>Add a private attachment</strong><small>PDF, JPEG, PNG or WebP · maximum 15 MB. Never made public.</small></div><select disabled={!uploadEnabled} value={leadId} onChange={e => setLeadId(e.target.value)} aria-label="Associate file with enquiry"><option value="">No enquiry association</option>{leads.map(l => <option key={l.id} value={l.id}>{l.code} · {l.name}</option>)}</select><label className={`int-primary ${uploading || !uploadEnabled ? 'disabled' : ''}`}><Upload size={14} />{uploading ? 'Uploading…' : 'Choose file'}<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" disabled={uploading || !uploadEnabled} onChange={e => { void upload(e.target.files?.[0]); e.currentTarget.value = ''; }} /></label></div>
    {error && <div className="int-inline-error" role="alert">{error}</div>}{(requestUpload.isError || finalize.isError) && !error && <div className="int-inline-error">Upload failed. Retry the file upload.</div>}
    <div className="int-file-meta"><span>{files.length} attachments</span><span>{(totalBytes / (1024 * 1024)).toFixed(1)} MB in total</span></div>
    <div className="int-panel int-file-list">{files.map(file => <article className="int-file-row" key={file.id}><span className="int-file-type"><FileText size={19} /></span><div><strong>{file.fileName}</strong><small>{file.contentType} · {(file.size / 1024).toFixed(0)} KB · {new Date(file.createdAt).toLocaleDateString()}</small></div><small>{file.projectRequestId ? leads.find(l => l.id === file.projectRequestId)?.code || `Enquiry #${file.projectRequestId}` : 'Team file'}</small><button className="int-small-button" onClick={() => setPreviewPath(file.objectPath.replace(/^\/objects\//, ''))} data-testid={`button-private-file-${file.id}`}><ArrowDownToLine size={14} /> Open securely</button></article>)}{!files.length && <EmptyState title="No private files" text="Attachments added by the team will be listed here." />}</div>
    {previewPath && <div className="int-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setPreviewPath(''); }}><section className="int-modal int-file-preview" role="dialog" aria-modal="true" aria-label="Private attachment preview"><div className="int-modal-head"><div><span className="int-kicker">AUTHENTICATED OBJECT VIEW</span><h3>Private attachment</h3></div><button onClick={() => setPreviewPath('')} aria-label="Close attachment preview">×</button></div>{privateFile.isLoading && <div className="int-skeleton wide" />}{privateFile.isError && <div className="int-inline-error">This private attachment could not be opened. Your team session may have expired.</div>}{previewUrl && <><iframe title="Private attachment" src={previewUrl} /><a className="int-primary" href={`/api/storage/objects/${previewPath}`} target="_blank" rel="noopener noreferrer"><ArrowDownToLine size={14} /> Open through secure API path</a></>}</section></div>}
  </div>;
}

export function OwnerDemo() {
  useEffect(() => {
    document.title = 'Owner portal preview — DEMO | Marenetto Build';
    document.documentElement.lang = 'en';
    document.querySelector('meta[name="robots"]')?.setAttribute('content', 'noindex, nofollow, noarchive');
  }, []);
  const [selectedTab, setSelectedTab] = useState<'report' | 'documents' | 'decisions' | 'handover'>('report');
  const [choice, setChoice] = useState('');
  const [decision, setDecision] = useState('Pending review');
  const [message, setMessage] = useState('');
  const tabs = [{ id: 'report', label: 'Progress report' }, { id: 'documents', label: 'Documents' }, { id: 'decisions', label: 'Decisions' }, { id: 'handover', label: 'Handover' }] as const;
  return <div className="owner-demo-shell"><div className="demo-ribbon"><span>DEMO</span> Synthetic preview · every property, value and document below is invented</div><header className="owner-header"><Link href="/" className="wordmark"><strong>MARENETTO</strong><span>BUILD · CEFALÙ</span></Link><span className="owner-portal-tag"><LockKeyhole size={14} /> OWNER PORTAL PREVIEW</span><button className="owner-user">S<span>Sample owner</span><ChevronDown size={14} /></button></header><main className="owner-main"><div className="owner-intro"><div><span className="int-kicker">SAMPLE PROPERTY / CEFALÙ</span><h1>A thoughtful view<br /><em>of what comes next.</em></h1><p>This preview uses synthetic information only. It is not a real project, client or company record.</p></div><div className="demo-property-card"><small>PROPERTY REFERENCE</small><strong>DEMO–CFL–204</strong><span>Fictional coastal residence · Cefalù</span><i>NOT A CUSTOMER RECORD</i></div></div>
      <nav className="owner-tabs">{tabs.map(t => <button className={selectedTab === t.id ? 'active' : ''} onClick={() => setSelectedTab(t.id)} key={t.id}>{t.label}</button>)}</nav>
      {selectedTab === 'report' && <div className="owner-content"><div className="report-heading"><div><span className="int-kicker">WEEKLY NOTE / SAMPLE</span><h2>Progress, without the guesswork.</h2><p>Illustrative update · 18 June 2025 · all figures synthetic</p></div><span className="report-status"><i /> On track · illustrative</span></div><div className="owner-report-grid"><section className="owner-card progress-card"><div className="owner-card-head"><div><small>ILLUSTRATIVE PROGRESS</small><strong>Phase 02 · Interior finishes</strong></div><span>62%</span></div><div className="owner-progress"><i /></div><div className="owner-progress-labels"><span>Site preparation</span><span>Interior finishes</span><span>Handover</span></div><div className="owner-progress-notes"><span><b>01</b> Survey complete</span><span><b>02</b> Finishes underway</span><span><b>03</b> Handover to follow</span></div></section><section className="owner-card owner-summary"><small>THIS WEEK</small><h3>Measured progress on site.</h3><p>Surface preparation is complete in the sample living area. The next illustrative check is the finish mock-up before work continues.</p><div className="owner-summary-meta"><span>Next update</span><strong>Friday · sample</strong></div></section></div><section className="owner-card owner-timeline"><div className="owner-card-head"><div><small>SAMPLE PROGRAMME</small><strong>Milestones</strong></div><span>Illustrative dates</span></div>{[['01', 'Initial survey', 'Complete · sample'], ['02', 'Material review', 'In progress · sample'], ['03', 'Finishes review', 'Next · sample'], ['04', 'Handover walkthrough', 'Planned · sample']].map((row, i) => <div className={`owner-milestone ${i < 2 ? 'done' : ''}`} key={row[0]}><span className="owner-milestone-mark">{i < 2 ? <Check size={13} /> : row[0]}</span><strong>{row[1]}</strong><small>{row[2]}</small></div>)}</section></div>}
      {selectedTab === 'documents' && <div className="owner-content"><div className="report-heading"><div><span className="int-kicker">DOCUMENTS / EXAMPLE SET</span><h2>Everything in its place.</h2><p>Sample documents only. These are not project files.</p></div><span className="owner-doc-count">03 <small>examples</small></span></div><div className="owner-doc-list">{[['Site review note', 'PDF · Sample · 2 pages', '18 Jun 2025'], ['Finish schedule', 'PDF · Sample · 1 page', '16 Jun 2025'], ['Weekly progress images', 'ZIP · Sample set', '13 Jun 2025']].map((doc, i) => <article key={doc[0]}><span className="owner-doc-icon"><FileText size={19} /></span><div><strong>{doc[0]}</strong><small>{doc[1]}</small></div><time>{doc[2]}</time><button className="owner-download" onClick={() => setMessage('This synthetic demo does not contain downloadable project files.')}><ArrowDownToLine size={15} /> View sample</button><span className="owner-synthetic">DEMO</span></article>)}</div></div>}
      {selectedTab === 'decisions' && <div className="owner-content"><div className="report-heading"><div><span className="int-kicker">DECISIONS / SAMPLE</span><h2>A clear choice, when you are ready.</h2><p>Illustrative options only · no live decisions are being requested</p></div></div><section className="owner-card decision-card"><div className="decision-status"><span>DEMO DECISION</span><StatusPill status={decision === 'Pending review' ? 'draft' : 'approved'} /></div><h3>Living area finish — sample selection</h3><p>Compare the illustrative finish options below. Your selection only changes this preview in your browser.</p><div className="variant-grid">{[['A', 'Limestone tone', 'Warm · matte'], ['B', 'Soft mineral', 'Pale · textured']].map(([letter, name, desc]) => <button key={letter} className={`variant-option ${choice === letter ? 'selected' : ''}`} onClick={() => setChoice(letter)}><span className={`variant-swatch swatch-${letter.toLowerCase()}`} /><small>OPTION {letter}</small><strong>{name}</strong><span>{desc}</span>{choice === letter && <i><Check size={13} /> Selected in demo</i>}</button>)}</div><div className="decision-bottom"><span>Sample review deadline · 21 June 2025</span><button className="owner-demo-action" disabled={!choice} onClick={() => setDecision('Selection noted in demo')}>{choice ? 'Note this sample choice' : 'Choose an option'} <ArrowRight size={14} /></button></div>{decision !== 'Pending review' && <p className="owner-confirmation" role="status"><Check size={14} /> {decision}. Nothing was sent or saved to a real project.</p>}</section></div>}
      {selectedTab === 'handover' && <div className="owner-content"><div className="report-heading"><div><span className="int-kicker">HANDOVER / SAMPLE CHECKLIST</span><h2>Ready, when every detail is.</h2><p>Illustrative handover items, not a live checklist.</p></div><span className="handover-progress">2 <small>of 5 sample items</small></span></div><div className="owner-card handover-list">{[['Site walkthrough', true], ['Finish review', true], ['Care notes', false], ['Document set', false], ['Final conversation', false]].map(([label, done]) => <div className="handover-item" key={String(label)}><span className={done ? 'checked' : ''}>{done ? <Check size={14} /> : ''}</span><strong>{label}</strong><small>{done ? 'Illustrative complete' : 'Sample · pending'}</small></div>)}<div className="handover-note"><span>ILLUSTRATIVE NOTE</span><p>Handover details are agreed for each real project. This preview does not represent a scheduled handover.</p></div></div></div>}
      {message && <div className="owner-toast" role="status">{message}<button onClick={() => setMessage('')}>Dismiss</button></div>}
    </main><footer className="owner-footer"><span>MARENETTO BUILD · CEFALÙ</span><span>Synthetic preview only · no customer data</span><Link href="/">Public website <ArrowRight size={13} /></Link></footer></div>;
}

export function PublishedCmsPage({ params }: { params: { locale: string; slug: string } }) {
  const locale = params.locale.toLowerCase();
  const page = useGetPublishedCmsPage(locale, params.slug);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = page.data?.title ? `${page.data.title} | Marenetto Build` : 'Marenetto Build';
    document.querySelector('meta[name="robots"]')?.setAttribute('content', 'noindex, nofollow, noarchive');
  }, [locale, page.data?.title]);
  return <main className="cms-public-page"><header><Link href="/" className="wordmark"><strong>MARENETTO</strong><span>BUILD · CEFALÙ</span></Link><Link href="/" className="int-back">Marenetto Build <ArrowRight size={14} /></Link></header>{page.isLoading ? <div className="cms-public-status">Loading page…</div> : page.isError || !page.data ? <section className="cms-public-status"><span className="int-kicker">PAGE NOT AVAILABLE</span><h1>This page is not published.</h1><p>The page may be a draft or preview publishing may still be locked.</p><Link href="/" className="int-primary">Return to the website</Link></section> : <article><span className="int-kicker">{page.data.locale.toUpperCase()} / MARENETTO BUILD</span><h1>{page.data.title}</h1><p className="cms-public-body">{page.data.body}</p><small>Published page · {page.data.updatedAt ? new Date(page.data.updatedAt).toLocaleDateString() : ''}</small></article>}</main>;
}

export { InternalEntry };
