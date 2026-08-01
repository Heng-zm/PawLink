import React from 'react';
import ImageSourceInput, { SafeImage } from './CustomMedia.jsx';
import IconPicker from './IconPicker.jsx';
import { BuiltInIcon, PlusIcon, TrashIcon } from './Icons.jsx';

const presets = [
  { label: 'Instagram', icon: 'instagram', url: 'https://instagram.com/' },
  { label: 'TikTok', icon: 'tiktok', url: 'https://tiktok.com/@' },
  { label: 'YouTube', icon: 'youtube', url: 'https://youtube.com/@' },
  { label: 'Facebook', icon: 'facebook', url: 'https://facebook.com/' },
  { label: 'Telegram', icon: 'telegram', url: 'https://t.me/' },
  { label: 'Email', icon: 'mail', url: 'mailto:' },
];

function makeId() {
  return `social_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
}

function SocialPreview({ social }) {
  return (
    <span className="social-editor-preview">
      <SafeImage src={social.iconUrl} alt="" fallback={<BuiltInIcon name={social.icon || 'link'} />} />
    </span>
  );
}

export default function SocialLinksEditor({ socialLinks = [], onChange }) {
  const update = (id, patch) => onChange(socialLinks.map((item) => item.id === id ? { ...item, ...patch } : item));
  const remove = (id) => onChange(socialLinks.filter((item) => item.id !== id));
  const add = (preset = { label: 'Social link', icon: 'link', url: 'https://' }) => {
    if (socialLinks.length >= 12) return;
    onChange([...socialLinks, { id: makeId(), label: preset.label, url: preset.url, icon: preset.icon, iconUrl: '', enabled: true }]);
  };

  return (
    <section className="dashboard-card editor-section">
      <div className="card-heading social-heading">
        <div><h2>Social links</h2><p>Add social destinations with consistent built-in icons or your own uploaded artwork.</p></div>
        <button type="button" className="primary-button small" onClick={() => add()} disabled={socialLinks.length >= 12}><PlusIcon /> Add social</button>
      </div>

      <div className="social-presets" aria-label="Quick social presets">
        {presets.map((preset) => (
          <button type="button" key={preset.label} onClick={() => add(preset)} disabled={socialLinks.length >= 12}>
            <BuiltInIcon name={preset.icon} />
            {preset.label}
          </button>
        ))}
      </div>

      <div className="social-editor-list">
        {socialLinks.map((social) => (
          <article className={`social-editor-card ${social.enabled ? '' : 'disabled'}`} key={social.id}>
            <div className="social-card-top">
              <SocialPreview social={social} />
              <div><strong>{social.label || 'Untitled social'}</strong><small>{social.url || 'Add a destination URL'}</small></div>
              <label className="switch" title={social.enabled !== false ? 'Visible' : 'Hidden'}><input type="checkbox" checked={social.enabled !== false} onChange={(event) => update(social.id, { enabled: event.target.checked })}/><span /></label>
              <button type="button" className="row-action danger" onClick={() => remove(social.id)} aria-label={`Delete ${social.label}`}><TrashIcon /></button>
            </div>
            <div className="social-editor-grid">
              <label className="dashboard-field"><span>Label<small>Used for accessibility</small></span><input value={social.label} maxLength="40" onChange={(event) => update(social.id, { label: event.target.value })} placeholder="Instagram" /></label>
              <label className="dashboard-field social-url-field"><span>Destination URL<small>HTTPS or mailto</small></span><input value={social.url} onChange={(event) => update(social.id, { url: event.target.value })} placeholder="https://instagram.com/username" inputMode="url" /></label>
              <IconPicker social label="Built-in social icon" value={social.icon || 'link'} onChange={(icon) => update(social.id, { icon })} />
              <div className="social-icon-source"><ImageSourceInput label="Custom icon override" value={social.iconUrl} onChange={(iconUrl) => update(social.id, { iconUrl })} kind="icon" fallback={<BuiltInIcon name={social.icon || 'link'} />} placeholder="https://example.com/icon.png" /></div>
            </div>
          </article>
        ))}
        {!socialLinks.length && (
          <div className="social-empty">
            <BuiltInIcon name="globe" />
            <strong>No social links yet</strong>
            <p>Use a preset or add a custom destination.</p>
          </div>
        )}
      </div>
      <p className="section-footnote">Remote icon requests use a strict referrer policy. You can add up to 12 social links.</p>
    </section>
  );
}
