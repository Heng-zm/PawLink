import React, { useState } from 'react';
import { SafeImage } from './CustomMedia.jsx';
import { isSafeFontSource } from './FontSourceInput.jsx';
import { ArrowUpRightIcon, BuiltInIcon, CopyIcon, ShareIcon, UserIcon } from './Icons.jsx';
import { copyText, publicProfileLabel, publicProfileUrl } from '../lib/browser.js';


const FONT_STACKS = {
  google: '"Google Sans Flex", "Google Sans", ui-sans-serif, system-ui, sans-serif',
  system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  sans: '"Google Sans Flex", "Google Sans", ui-sans-serif, system-ui, sans-serif',
  rounded: 'Nunito, "Arial Rounded MT Bold", ui-rounded, system-ui, sans-serif',
  serif: 'Georgia, Cambria, "Times New Roman", serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  khmer: '"Khmer OS Battambang", "Leelawadee UI", system-ui, sans-serif',
};

function profileFontStack(profile) {
  if (profile.fontFamily === 'custom' && profile.customFontUrl && isSafeFontSource(profile.customFontUrl)) {
    return 'PawLinkCustomProfile, system-ui, sans-serif';
  }
  if (FONT_STACKS[profile.fontFamily]) return FONT_STACKS[profile.fontFamily];
  if (profile.fontStyle === 'rounded') return FONT_STACKS.rounded;
  if (profile.fontStyle === 'editorial') return FONT_STACKS.serif;
  return FONT_STACKS.google;
}

function cardShadowValue(value) {
  if (value === 'none') return 'none';
  if (value === 'strong') return '0 18px 45px rgba(15, 23, 42, .20)';
  return '0 10px 28px rgba(15, 23, 42, .12)';
}

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'PL';
}

function legacySocialLinks(profile) {
  const socials = profile.socials || {};
  const rows = [];
  const add = (type, label, value, href) => {
    if (value) rows.push({ id: `legacy_${type}`, label, icon: type, iconUrl: '', url: href, enabled: true });
  };
  const clean = (value) => String(value || '').replace(/^@/, '');
  add('instagram', 'Instagram', socials.instagram, /^https?:\/\//i.test(socials.instagram || '') ? socials.instagram : `https://instagram.com/${clean(socials.instagram)}`);
  add('tiktok', 'TikTok', socials.tiktok, /^https?:\/\//i.test(socials.tiktok || '') ? socials.tiktok : `https://tiktok.com/@${clean(socials.tiktok)}`);
  add('youtube', 'YouTube', socials.youtube, /^https?:\/\//i.test(socials.youtube || '') ? socials.youtube : `https://youtube.com/@${clean(socials.youtube)}`);
  add('mail', 'Email', socials.email, `mailto:${socials.email || ''}`);
  return rows;
}

export function Avatar({ profile, size = 'large' }) {
  if (profile.avatarUrl) {
    return (
      <SafeImage
        className={`profile-avatar ${size}`}
        src={profile.avatarUrl}
        alt={`${profile.displayName} avatar`}
        fallback={<div className={`profile-avatar avatar-fallback ${size}`}>{initials(profile.displayName)}</div>}
      />
    );
  }
  return <div className={`profile-avatar avatar-fallback ${size}`} aria-label={`${profile.displayName} avatar`}>{initials(profile.displayName)}</div>;
}

export function MediaIcon({ iconUrl, icon = 'link', className = '' }) {
  return (
    <span className={className}>
      <SafeImage src={iconUrl} alt="" fallback={<BuiltInIcon name={icon} />} />
    </span>
  );
}

export default function ProfileCanvas({ profile, links = [], preview = false, onLinkClick }) {
  const [copied, setCopied] = useState(false);
  const publicUrl = publicProfileUrl(profile.username);
  const publicLabel = publicProfileLabel(profile.username);
  const socialLinks = (Array.isArray(profile.socialLinks) ? profile.socialLinks : legacySocialLinks(profile)).filter((item) => item.enabled !== false && item.url);
  const cssVars = {
    '--page-bg': profile.background,
    '--page-text': profile.textColor,
    '--page-accent': profile.accent,
    '--page-surface': profile.surfaceColor || '#ffffff',
    '--page-border': profile.borderColor || '#ded8f1',
    '--card-radius': `${profile.cardRadius ?? 18}px`,
    '--card-border-width': `${profile.cardBorderWidth ?? 1}px`,
    '--card-opacity': `${profile.cardOpacity ?? 94}%`,
    '--card-shadow': cardShadowValue(profile.cardShadow || 'soft'),
    '--page-font': profileFontStack(profile),
  };
  const hasCustomFont = profile.fontFamily === 'custom' && profile.customFontUrl && isSafeFontSource(profile.customFontUrl);
  const normalizedFontUrl = hasCustomFont
    ? (String(profile.customFontUrl).startsWith('data:') ? String(profile.customFontUrl) : new URL(profile.customFontUrl).toString())
    : '';
  const customFontCss = normalizedFontUrl
    ? `@font-face{font-family:PawLinkCustomProfile;src:url("${normalizedFontUrl.replace(/["\\\r\n]/g, '')}");font-display:swap;}`
    : '';
  const backgroundPosition = ({ top: 'center top', bottom: 'center bottom', left: 'left center', right: 'right center' })[profile.backgroundImagePosition] || 'center center';

  const copyPage = async () => {
    try {
      await copyText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={`profile-canvas theme-${profile.theme || 'berry'} background-${profile.backgroundStyle || 'glow'} font-${profile.fontStyle || 'modern'} layout-${profile.linkLayout || 'stacked'} ${preview ? 'is-preview' : ''}`}
      style={cssVars}
    >
      {customFontCss && <style>{customFontCss}</style>}
      {profile.backgroundImageUrl && (
        <SafeImage
          className="profile-background-image"
          src={profile.backgroundImageUrl}
          alt=""
          aria-hidden="true"
          loading="eager"
          fetchPriority="high"
          style={{
            objectFit: profile.backgroundImageFit === 'contain' ? 'contain' : 'cover',
            objectPosition: backgroundPosition,
            opacity: (profile.backgroundImageOpacity ?? 100) / 100,
            filter: `blur(${profile.backgroundImageBlur ?? 0}px)`,
          }}
        />
      )}
      {profile.backgroundImageUrl && <div className="profile-background-overlay" aria-hidden="true" />}
      <div className="profile-noise" aria-hidden="true" />
      <div className="profile-top-actions">
        <button type="button" className="round-action" onClick={copyPage} aria-label="Copy profile link">
          {copied ? <BuiltInIcon name="star" /> : <ShareIcon />}
        </button>

      </div>

      <div className="profile-main">
        <div className="profile-identity">
          <div className="avatar-wrap">
            <Avatar profile={profile} />
            <span className={`online-dot ${profile.published === false ? 'is-draft' : ''}`} aria-label={profile.published === false ? 'Draft preview' : 'Published'} />
          </div>
          <h1>{profile.displayName || profile.username}</h1>
          <p className="profile-handle">@{profile.username}</p>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        </div>

        {socialLinks.length > 0 && (
          <div className="profile-socials" aria-label="Social links">
            {socialLinks.map((social) => {
              const external = /^https?:\/\//i.test(social.url);
              return (
                <a
                  key={social.id}
                  href={preview ? '#' : social.url}
                  onClick={preview ? (event) => event.preventDefault() : undefined}
                  target={!preview && external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  aria-label={social.label || 'Social link'}
                  title={social.label || 'Social link'}
                >
                  <SafeImage src={social.iconUrl} alt="" fallback={<BuiltInIcon name={social.icon || 'link'} />} />
                </a>
              );
            })}
          </div>
        )}

        <div className="public-links">
          {links.length ? links.map((link) => (
            <a
              key={link.id}
              className={`public-link button-${profile.buttonStyle || 'soft'}`}
              href={preview ? '#' : link.url}
              target={preview ? undefined : '_blank'}
              rel="noopener noreferrer"
              onClick={(event) => {
                if (preview) event.preventDefault();
                onLinkClick?.(link, event);
              }}
            >
              <MediaIcon iconUrl={link.iconUrl} icon={link.icon} className="public-link-icon" />
              <span className="public-link-copy">
                <strong>{link.title}</strong>
                {link.subtitle && <small>{link.subtitle}</small>}
              </span>
              <ArrowUpRightIcon />
            </a>
          )) : (
            <div className="empty-public-links">
              <UserIcon />
              <strong>No links published yet</strong>
              <span>Add your first link from the dashboard.</span>
            </div>
          )}
        </div>
      </div>

      <button type="button" className="profile-url-pill" onClick={copyPage}>
        <CopyIcon /> <span>{copied ? 'Copied' : publicLabel}</span>
      </button>
    </div>
  );
}
