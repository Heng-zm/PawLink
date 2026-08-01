import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { AppLink } from '../lib/router.jsx';
import { copyText, publicProfileLabel, publicProfilePrefixLabel, publicProfileUrl } from '../lib/browser.js';
import Brand from './Brand.jsx';
import ProfileCanvas, { Avatar, MediaIcon } from './ProfileCanvas.jsx';
import ImageSourceInput from './CustomMedia.jsx';
import IconPicker from './IconPicker.jsx';
import SocialLinksEditor from './SocialLinksEditor.jsx';
import AppearanceEditor from './AppearanceEditor.jsx';
import {
  ArrowUpRightIcon,
  BuiltInIcon,
  ChartIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  DesktopIcon,
  DuplicateIcon,
  EditIcon,
  EyeIcon,
  FilterIcon,
  HomeIcon,
  InfoIcon,
  LayersIcon,
  LayoutIcon,
  LinkIcon,
  LogOutIcon,
  MenuIcon,
  MouseIcon,
  PaletteIcon,
  PlusIcon,
  SaveIcon,
  SearchIcon,
  SettingsIcon,
  SmartphoneIcon,
  SparkleIcon,
  TabletIcon,
  TrashIcon,
  TypeIcon,
  XIcon,
} from './Icons.jsx';

const tabs = [
  { id: 'overview', label: 'Home', description: 'Your page at a glance', icon: HomeIcon, group: 'Build' },
  { id: 'links', label: 'Links', description: 'Add and organize content', icon: LinkIcon, group: 'Build' },
  { id: 'appearance', label: 'Appearance', description: 'Colors, fonts, and cards', icon: PaletteIcon, group: 'Build' },
  { id: 'analytics', label: 'Analytics', description: 'Views, clicks, and traffic', icon: ChartIcon, group: 'Manage' },
  { id: 'settings', label: 'Settings', description: 'Profile and publishing', icon: SettingsIcon, group: 'Manage' },
];


function Field({ label, hint, children, className = '' }) {
  return <label className={`dashboard-field ${className}`}><span>{label}{hint && <small>{hint}</small>}</span>{children}</label>;
}

function StatCard({ icon: Icon, label, value, detail }) {
  return <article className="stat-card"><span className="stat-icon"><Icon /></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>;
}

function Overview({ data, setTab, onPreview }) {
  const { profile, links, analytics } = data;
  const active = links.filter((link) => link.enabled).length;
  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <div><span className="page-kicker">Workspace</span><h1>Welcome back, {(profile.displayName || profile.username).split(' ')[0]}.</h1><p>Review performance, update content, and keep your public page current.</p></div>
        {profile.published ? <AppLink to={`/p/${profile.username}`} className="secondary-button" target="_blank">View public page <ArrowUpRightIcon /></AppLink> : <button type="button" className="secondary-button" onClick={onPreview}><EyeIcon /> Preview draft</button>}
      </div>

      <section className="quick-actions-grid" aria-label="Quick actions">
        <button type="button" onClick={() => setTab('links')}><span><PlusIcon /></span><div><strong>Add a link</strong><small>Share a new destination</small></div><ArrowUpRightIcon /></button>
        <button type="button" onClick={() => setTab('appearance')}><span><PaletteIcon /></span><div><strong>Change design</strong><small>Update colors and fonts</small></div><ArrowUpRightIcon /></button>
        <button type="button" onClick={onPreview}><span><EyeIcon /></span><div><strong>Preview page</strong><small>Check the visitor experience</small></div><ArrowUpRightIcon /></button>
      </section>

      <div className="stats-grid">
        <StatCard icon={EyeIcon} label="Total views" value={analytics.totals.views.toLocaleString()} detail="All-time profile visits" />
        <StatCard icon={MouseIcon} label="Link clicks" value={analytics.totals.clicks.toLocaleString()} detail="Across published links" />
        <StatCard icon={ChartIcon} label="Click rate" value={`${analytics.totals.ctr}%`} detail="Clicks divided by views" />
        <StatCard icon={LinkIcon} label="Active links" value={active} detail={`${links.length} total links`} />
      </div>

      <div className="overview-grid">
        <section className="dashboard-card activity-card">
          <div className="card-heading"><div><h2>Last 7 days</h2><p>Views and clicks over time.</p></div><button type="button" className="text-button" onClick={() => setTab('analytics')}>Full analytics</button></div>
          <AnalyticsChart rows={analytics.last7} />
        </section>
        <section className="dashboard-card checklist-card">
          <div className="card-heading"><div><h2>Page checklist</h2><p>Complete the essentials.</p></div></div>
          <ul>
            <li className={profile.avatarUrl ? 'done' : ''}><span>{profile.avatarUrl ? <CheckIcon /> : '1'}</span><div><strong>Add a profile image</strong><small>Make the page recognizable.</small></div></li>
            <li className={(profile.bio || '').length > 40 ? 'done' : ''}><span>{(profile.bio || '').length > 40 ? <CheckIcon /> : '2'}</span><div><strong>Write a useful bio</strong><small>Tell visitors what to expect.</small></div></li>
            <li className={active >= 3 ? 'done' : ''}><span>{active >= 3 ? <CheckIcon /> : '3'}</span><div><strong>Publish three links</strong><small>Offer clear next actions.</small></div></li>
          </ul>
        </section>
      </div>

      <section className="dashboard-card recent-links">
        <div className="card-heading"><div><h2>Recent links</h2><p>Quick access to your page content.</p></div><button type="button" className="primary-button small" onClick={() => setTab('links')}><PlusIcon /> Add link</button></div>
        {links.slice(0, 4).map((link) => (
          <div className="overview-link-row" key={link.id}>
            <MediaIcon iconUrl={link.iconUrl} icon={link.icon} />
            <div><strong>{link.title}</strong><small>{link.url}</small></div>
            <em className={link.enabled ? 'live' : ''}>{link.enabled ? 'Live' : 'Hidden'}</em>
          </div>
        ))}
        {!links.length && <div className="compact-empty"><LinkIcon /><span>No links created yet.</span></div>}
      </section>
    </div>
  );
}

function AnalyticsChart({ rows }) {
  const max = Math.max(1, ...rows.flatMap((row) => [row.views, row.clicks]));
  return (
    <div className="analytics-chart">
      {rows.map((row) => (
        <div className="chart-column" key={row.date}>
          <div className="chart-bars">
            <i className="views" style={{ height: `${Math.max(5, row.views / max * 100)}%` }} title={`${row.views} views`} aria-label={`${row.views} views`} />
            <i className="clicks" style={{ height: `${Math.max(3, row.clicks / max * 100)}%` }} title={`${row.clicks} clicks`} aria-label={`${row.clicks} clicks`} />
          </div>
          <span>{new Date(`${row.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</span>
        </div>
      ))}
    </div>
  );
}

function LinkForm({ value, onChange }) {
  return (
    <div className="link-form-grid enhanced-link-form">
      <div className="link-form-fields">
        <Field label="Title"><input required value={value.title} maxLength="80" onChange={(event) => onChange({ ...value, title: event.target.value })} placeholder="My latest video" /></Field>
        <Field label="Description" hint="Optional"><input value={value.subtitle} maxLength="120" onChange={(event) => onChange({ ...value, subtitle: event.target.value })} placeholder="A short helpful note" /></Field>
        <Field label="Destination URL"><input required value={value.url} onChange={(event) => onChange({ ...value, url: event.target.value })} placeholder="https://example.com" inputMode="url" /></Field>
      </div>
      <div className="link-form-media">
        <IconPicker value={value.icon || 'link'} onChange={(icon) => onChange({ ...value, icon })} />
        <ImageSourceInput label="Custom icon override" value={value.iconUrl || ''} onChange={(iconUrl) => onChange({ ...value, iconUrl })} kind="icon" fallback={<BuiltInIcon name={value.icon || 'link'} />} placeholder="https://example.com/icon.png" />
      </div>
    </div>
  );
}

function LinksEditor({ links, setLinks, notify }) {
  const emptyDraft = { title: '', subtitle: '', url: '', icon: 'link', iconUrl: '' };
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const canReorder = !query.trim() && filter === 'all' && !busy;

  const filteredLinks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return links.filter((link) => {
      if (filter === 'live' && !link.enabled) return false;
      if (filter === 'hidden' && link.enabled) return false;
      if (!needle) return true;
      return `${link.title} ${link.subtitle} ${link.url}`.toLowerCase().includes(needle);
    });
  }, [links, query, filter]);

  const add = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await api.addLink(draft);
      setLinks((current) => [...current, result.link]);
      setDraft(emptyDraft);
      setAdding(false);
      notify('Link added and published.');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const save = async (link) => {
    setBusy(true);
    try {
      const result = await api.updateLink(link.id, link);
      setLinks((current) => current.map((item) => item.id === link.id ? result.link : item));
      setEditing(null);
      notify('Link updated.');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const duplicate = async (link) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await api.addLink({ ...link, title: `${link.title} copy`, enabled: false });
      setLinks((current) => [...current, result.link]);
      notify('A hidden copy was created.');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (link) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await api.updateLink(link.id, { enabled: !link.enabled });
      setLinks((current) => current.map((item) => item.id === link.id ? result.link : item));
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (link) => {
    if (busy) return;
    if (!window.confirm(`Delete “${link.title}”?`)) return;
    setBusy(true);
    try {
      await api.deleteLink(link.id);
      setLinks((current) => current.filter((item) => item.id !== link.id));
      notify('Link deleted.');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const move = async (link, direction) => {
    if (!canReorder) return;
    const index = links.findIndex((item) => item.id === link.id);
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= links.length) return;
    const next = [...links];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setLinks(next);
    setBusy(true);
    try {
      await api.reorderLinks(next.map((item) => item.id));
    } catch (error) {
      setLinks(links);
      notify(error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const closeAddForm = () => {
    setAdding(false);
    setDraft({ ...emptyDraft });
  };

  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <div><span className="page-kicker">Content</span><h1>Links</h1><p>Create, organize, and publish the actions on your public page.</p></div>
        <button className="primary-button" onClick={() => { setDraft({ ...emptyDraft }); setAdding(true); }}><PlusIcon /> Add new link</button>
      </div>

      <div className="content-toolbar dashboard-card">
        <label className="search-control"><SearchIcon /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search links" /></label>
        <div className="filter-control" aria-label="Filter links"><FilterIcon />{['all', 'live', 'hidden'].map((value) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value}</button>)}</div>
        <span className="result-count">{filteredLinks.length} of {links.length}</span>
      </div>

      {adding && (
        <form className="dashboard-card add-link-form" onSubmit={add}>
          <div className="card-heading"><div><h2>New link</h2><p>Choose a built-in icon or safely import your own.</p></div><button type="button" className="icon-close" onClick={closeAddForm} aria-label="Close"><XIcon /></button></div>
          <LinkForm value={draft} onChange={setDraft} />
          <div className="form-actions"><button type="button" className="secondary-button" onClick={closeAddForm}>Cancel</button><button className="primary-button" disabled={busy}>{busy ? 'Adding…' : 'Add link'}</button></div>
        </form>
      )}

      <section className="links-list">
        {filteredLinks.map((link) => editing?.id === link.id ? (
          <form className="dashboard-card edit-link-card" key={link.id} onSubmit={(event) => { event.preventDefault(); save(editing); }}>
            <div className="card-heading"><div><h2>Edit link</h2><p>Changes are published when you save.</p></div></div>
            <LinkForm value={editing} onChange={setEditing} />
            <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setEditing(null)}>Cancel</button><button className="primary-button" disabled={busy}><SaveIcon /> Save link</button></div>
          </form>
        ) : (
          <article className={`dashboard-card link-editor-row ${link.enabled ? '' : 'disabled'}`} key={link.id}>
            <div className="reorder-buttons"><button type="button" onClick={() => move(link, -1)} disabled={!canReorder || links[0]?.id === link.id} aria-label="Move up"><ChevronUpIcon /></button><button type="button" onClick={() => move(link, 1)} disabled={!canReorder || links.at(-1)?.id === link.id} aria-label="Move down"><ChevronDownIcon /></button></div>
            <MediaIcon iconUrl={link.iconUrl} icon={link.icon} className="editor-link-icon" />
            <div className="editor-link-copy"><strong>{link.title}</strong><small>{link.subtitle || 'No description'}</small><a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a></div>
            <label className="switch" title={link.enabled ? 'Visible' : 'Hidden'}><input type="checkbox" checked={link.enabled} onChange={() => toggle(link)} /><span /></label>
            <div className="link-row-actions">
              <button type="button" className="row-action" onClick={() => setEditing({ ...link })}><EditIcon /><span>Edit</span></button>
              <button type="button" className="row-action" onClick={() => duplicate(link)} title="Duplicate"><DuplicateIcon /></button>
              <button type="button" className="row-action danger" onClick={() => remove(link)} aria-label="Delete"><TrashIcon /></button>
            </div>
          </article>
        ))}

        {!filteredLinks.length && (
          <div className="empty-state">
            <LinkIcon />
            <h2>{links.length ? 'No matching links' : 'No links yet'}</h2>
            <p>{links.length ? 'Change the search or filter to see more links.' : 'Add your first destination to begin building the page.'}</p>
            {!links.length && <button type="button" className="primary-button" onClick={() => { setDraft({ ...emptyDraft }); setAdding(true); }}><PlusIcon /> Add link</button>}
          </div>
        )}
      </section>
    </div>
  );
}

function Analytics({ analytics, refresh, refreshing, refreshedAt }) {
  const sourceEntries = Object.entries(analytics.sources).sort((a, b) => b[1] - a[1]);
  const deviceEntries = Object.entries(analytics.devices).sort((a, b) => b[1] - a[1]);
  const maxSource = Math.max(1, ...sourceEntries.map(([, value]) => value));
  const DeviceIcon = ({ device }) => device === 'Mobile' ? <SmartphoneIcon /> : device === 'Tablet' ? <TabletIcon /> : <DesktopIcon />;
  return (
    <div className="dashboard-page">
      <div className="page-heading"><div><span className="page-kicker">Performance</span><h1>Analytics</h1><p>Understand how people discover and use your page.{refreshedAt ? ` Updated ${new Date(refreshedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.` : ''}</p></div><button type="button" className="secondary-button" onClick={refresh} disabled={refreshing}><ChartIcon /> {refreshing ? 'Refreshing…' : 'Refresh data'}</button></div>
      <div className="stats-grid analytics-stats"><StatCard icon={EyeIcon} label="Views" value={analytics.totals.views.toLocaleString()} detail="Unique daily visitors" /><StatCard icon={MouseIcon} label="Clicks" value={analytics.totals.clicks.toLocaleString()} detail="All link interactions" /><StatCard icon={ChartIcon} label="CTR" value={`${analytics.totals.ctr}%`} detail="Overall click-through rate" /></div>
      <section className="dashboard-card analytics-main"><div className="card-heading"><div><h2>Seven-day activity</h2><p>Primary bars are views; secondary bars are clicks.</p></div></div><AnalyticsChart rows={analytics.last7} /></section>
      <div className="analytics-detail-grid">
        <section className="dashboard-card"><div className="card-heading"><div><h2>Top links</h2><p>Most clicked destinations.</p></div></div><div className="rank-list">{analytics.topLinks.slice(0, 6).map((link, index) => <div key={link.id}><span>{index + 1}</span><strong>{link.title}</strong><em>{link.clicks} clicks</em></div>)}{!analytics.topLinks.length && <p className="muted-empty">No click data yet.</p>}</div></section>
        <section className="dashboard-card"><div className="card-heading"><div><h2>Traffic sources</h2><p>Where profile visitors arrived from.</p></div></div><div className="source-list">{sourceEntries.map(([source, value]) => <div key={source}><span><strong>{source}</strong><em>{value}</em></span><i><b style={{ width: `${value / maxSource * 100}%` }} /></i></div>)}{!sourceEntries.length && <p className="muted-empty">No source data yet.</p>}</div></section>
        <section className="dashboard-card"><div className="card-heading"><div><h2>Devices</h2><p>Visitor device categories.</p></div></div><div className="device-list">{deviceEntries.map(([device, value]) => <div key={device}><span><DeviceIcon device={device} /></span><strong>{device}</strong><em>{value}</em></div>)}{!deviceEntries.length && <p className="muted-empty">No device data yet.</p>}</div></section>
      </div>
    </div>
  );
}

function Settings({ profile, setProfile, user, save, saving }) {
  const publicPrefix = publicProfilePrefixLabel();
  return (
    <div className="dashboard-page">
      <div className="page-heading"><div><span className="page-kicker">Account</span><h1>Settings</h1><p>Manage your public identity, social buttons, address, and publishing status.</p></div><button type="button" className="primary-button" onClick={save} disabled={saving}><SaveIcon /> {saving ? 'Saving…' : 'Save changes'}</button></div>
      <section className="dashboard-card editor-section">
        <div className="card-heading"><div><h2>Profile details</h2><p>The information shown at the top of your page.</p></div></div>
        <div className="settings-grid">
          <Field label="Display name"><input value={profile.displayName} maxLength="60" onChange={(event) => setProfile({ ...profile, displayName: event.target.value })} /></Field>
          <Field label="Username" hint="3–24 characters"><div className="input-prefix"><span>{publicPrefix}</span><input value={profile.username} maxLength="24" onChange={(event) => setProfile({ ...profile, username: event.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') })} /></div></Field>
          <Field label="Bio" hint={`${(profile.bio || '').length}/180`} className="full-field"><textarea value={profile.bio} maxLength="180" onChange={(event) => setProfile({ ...profile, bio: event.target.value })} /></Field>
          <div className="full-field"><ImageSourceInput label="Profile image" hint="Upload or paste an HTTPS URL" value={profile.avatarUrl || ''} onChange={(avatarUrl) => setProfile({ ...profile, avatarUrl })} kind="avatar" placeholder="https://example.com/profile.jpg" /></div>
          <Field label="Account email"><input value={user.email} disabled /></Field>
        </div>
      </section>
      <SocialLinksEditor socialLinks={profile.socialLinks || []} onChange={(socialLinks) => setProfile({ ...profile, socialLinks })} />
      <section className="dashboard-card publish-card"><div><span className={`publish-status ${profile.published ? 'live' : ''}`}>{profile.published ? 'Published' : 'Draft'}</span><h2>Public page visibility</h2><p>{profile.published ? 'Anyone with your link can currently view the page.' : 'Only you can preview this page while it is unpublished.'}</p></div><label className="switch large"><input type="checkbox" checked={profile.published} onChange={(event) => setProfile({ ...profile, published: event.target.checked })} /><span /></label></section>
    </div>
  );
}

export default function Dashboard({ initialData, onLogout }) {
  const [data, setData] = useState(initialData);
  const [profile, setProfile] = useState(initialData.profile);
  const [links, setLinks] = useState(initialData.links);
  const [tab, setTab] = useState('overview');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [refreshingAnalytics, setRefreshingAnalytics] = useState(false);
  const [analyticsRefreshedAt, setAnalyticsRefreshedAt] = useState(null);
  const toastTimerRef = useRef(null);
  const analyticsRequestRef = useRef(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const visibleLinks = useMemo(() => links.filter((link) => link.enabled), [links]);
  const dirty = useMemo(() => JSON.stringify(profile) !== JSON.stringify(data.profile), [profile, data.profile]);

  const notify = useCallback((message, type = 'success') => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2800);
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
  }, []);


  const refreshAnalytics = useCallback(async (showMessage = true) => {
    if (analyticsRequestRef.current) return;
    analyticsRequestRef.current = true;
    setRefreshingAnalytics(true);
    try {
      const result = await api.me();
      setData((current) => ({ ...current, analytics: result.analytics }));
      setAnalyticsRefreshedAt(Date.now());
      if (showMessage) notify('Analytics refreshed.');
    } catch (error) {
      if (showMessage) notify(error.message, 'error');
    } finally {
      analyticsRequestRef.current = false;
      setRefreshingAnalytics(false);
    }
  }, [notify]);

  useEffect(() => {
    if (tab === 'analytics') refreshAnalytics(false);
  }, [tab, refreshAnalytics]);

  const saveProfile = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const result = await api.saveProfile(profile);
      setProfile(result.profile);
      setData((current) => ({ ...current, profile: result.profile }));
      notify('Profile changes saved.');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (dirty) saveProfile();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dirty, profile, saving]);

  useEffect(() => {
    const beforeUnload = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  const copyUrl = async () => {
    try {
      await copyText(publicProfileUrl(profile.username));
      notify('Public link copied.');
    } catch {
      notify('Could not access the clipboard.', 'error');
    }
  };

  const currentData = { ...data, profile, links };
  const publicLabel = publicProfileLabel(profile.username);
  const activeTab = tabs.find((item) => item.id === tab) || tabs[0];

  const requestLogout = () => {
    if (dirty && !window.confirm('You have unsaved profile changes. Log out and discard them?')) return;
    onLogout();
  };

  return (
    <div className="dashboard-shell">
      <aside className={mobileNav ? 'dashboard-sidebar open' : 'dashboard-sidebar'}>
        <div className="sidebar-top"><AppLink to="/" className="dashboard-brand"><Brand /></AppLink><button type="button" className="sidebar-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><XIcon /></button></div>

        <div className="sidebar-page-card">
          <div className="sidebar-page-status"><span className={profile.published ? 'live' : ''} /><strong>{profile.published ? 'Published' : 'Draft page'}</strong></div>
          <button type="button" className="sidebar-page-url" onClick={copyUrl} title={`Copy ${publicLabel}`}><span>{publicLabel}</span><CopyIcon /></button>
          {profile.published ? <AppLink to={`/p/${profile.username}`} className="sidebar-open-page" target="_blank">Open public page <ArrowUpRightIcon /></AppLink> : <button type="button" className="sidebar-open-page" onClick={() => setShowPreview(true)}>Preview draft <EyeIcon /></button>}
        </div>

        <nav aria-label="Dashboard navigation">
          {['Build', 'Manage'].map((group) => (
            <div className="sidebar-nav-group" key={group}>
              <span className="sidebar-nav-label">{group}</span>
              {tabs.filter((item) => item.group === group).map(({ id, label, icon: Icon }) => (
                <button type="button" key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setMobileNav(false); }}><Icon /><span>{label}</span></button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-profile"><Avatar profile={profile} size="small" /><div><strong>{profile.displayName}</strong><small>@{profile.username}</small></div></div>
          <button type="button" onClick={requestLogout}><LogOutIcon /><span>Log out</span></button>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="topbar-context">
            <button type="button" className="dashboard-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><MenuIcon /></button>
            <div><strong>{activeTab.label}</strong><small>{activeTab.description}</small></div>
          </div>
          <div className="topbar-actions">
            <span className={`topbar-publish-status ${profile.published ? 'live' : ''}`}><i />{profile.published ? 'Live' : 'Draft'}</span>
            {dirty && <span className="unsaved-status"><i /> Unsaved</span>}
            <button type="button" className="secondary-button preview-toggle" onClick={() => setShowPreview((value) => !value)}><EyeIcon /> Preview</button>
            <button type="button" className="primary-button small quick-save" onClick={saveProfile} disabled={saving || !dirty}><SaveIcon /> {saving ? 'Saving' : dirty ? 'Save changes' : 'Saved'}</button>
          </div>
        </header>

        <div className="dashboard-workspace">
          <main className="dashboard-content">
            {tab === 'overview' && <Overview data={currentData} setTab={setTab} onPreview={() => setShowPreview(true)} />}
            {tab === 'links' && <LinksEditor links={links} setLinks={setLinks} notify={notify} />}
            {tab === 'appearance' && <AppearanceEditor profile={profile} setProfile={setProfile} save={saveProfile} saving={saving} />}
            {tab === 'analytics' && <Analytics analytics={data.analytics} refresh={() => refreshAnalytics(true)} refreshing={refreshingAnalytics} refreshedAt={analyticsRefreshedAt} />}
            {tab === 'settings' && <Settings profile={profile} setProfile={setProfile} user={data.user} save={saveProfile} saving={saving} />}
          </main>
          <aside className={showPreview ? 'live-preview open' : 'live-preview'}>
            <div className="preview-heading"><div><strong>Live preview</strong><small>Updates while you edit</small></div><button type="button" onClick={() => setShowPreview(false)} aria-label="Close preview"><XIcon /></button></div>
            <div className="preview-phone"><ProfileCanvas profile={profile} links={visibleLinks} preview /></div>
          </aside>
        </div>
      </div>

      <nav className="dashboard-mobile-tabs" aria-label="Mobile dashboard navigation">
        {tabs.map(({ id, label, icon: Icon }) => <button type="button" key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon /><span>{label}</span></button>)}
      </nav>

      {mobileNav && <button type="button" className="sidebar-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}
      {toast && <div className={`toast ${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'} aria-live={toast.type === 'error' ? 'assertive' : 'polite'}>{toast.type === 'success' ? <CheckIcon /> : <InfoIcon />} {toast.message}</div>}
    </div>
  );
}
