import React, { useState } from 'react';
import { AppLink, navigate } from '../lib/router.jsx';
import Brand from './Brand.jsx';
import {
  ArrowUpRightIcon,
  BuiltInIcon,
  ChartIcon,
  CheckIcon,
  GlobeIcon,
  LinkIcon,
  MenuIcon,
  PaletteIcon,
  ShieldIcon,
  SparkleIcon,
  XIcon,
  ZapIcon,
} from './Icons.jsx';
import ProfileCanvas from './ProfileCanvas.jsx';
import { publicProfilePrefixLabel } from '../lib/browser.js';

const sampleProfile = {
  username: 'minamakes',
  displayName: 'Mina Makes',
  bio: 'Creative notes, studio updates, and useful resources.',
  avatarUrl: '',
  theme: 'berry',
  accent: '#6d5dfc',
  background: '#f3efff',
  textColor: '#241f33',
  buttonStyle: 'soft',
  backgroundStyle: 'glow',
  fontStyle: 'modern',
  linkLayout: 'stacked',
  socialLinks: [
    { id: 's1', label: 'Instagram', icon: 'instagram', iconUrl: '', url: '#', enabled: true },
    { id: 's2', label: 'YouTube', icon: 'youtube', iconUrl: '', url: '#', enabled: true },
    { id: 's3', label: 'Email', icon: 'mail', iconUrl: '', url: '#', enabled: true },
  ],
};

const sampleLinks = [
  { id: '1', title: 'Watch my latest video', subtitle: 'A new studio update', url: '#', icon: 'play', iconUrl: '' },
  { id: '2', title: 'Join the newsletter', subtitle: 'Sent every Friday', url: '#', icon: 'mail', iconUrl: '' },
  { id: '3', title: 'Browse the little shop', subtitle: 'Prints, templates, and more', url: '#', icon: 'shop', iconUrl: '' },
];

export default function LandingPage({ authenticated }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [username, setUsername] = useState('yourname');
  const publicPrefix = publicProfilePrefixLabel();
  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 24) || 'yourname';
  const start = () => navigate(authenticated ? '/dashboard' : `/signup?username=${encodeURIComponent(cleanUsername)}`);

  return (
    <div className="landing-shell">
      <header className="landing-header wrap">
        <AppLink className="brand-link" to="/"><Brand /></AppLink>
        <nav className={menuOpen ? 'landing-nav open' : 'landing-nav'}>
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
          <AppLink className="text-login" to={authenticated ? '/dashboard' : '/login'}>{authenticated ? 'Dashboard' : 'Log in'}</AppLink>
          <button className="primary-button small" onClick={start}>{authenticated ? 'Open dashboard' : 'Create my page'}</button>
        </nav>
        <button className="mobile-menu" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle menu">{menuOpen ? <XIcon /> : <MenuIcon />}</button>
      </header>

      <main>
        <section className="hero wrap">
          <div className="hero-copy">
            <div className="eyebrow"><SparkleIcon /> Clear, flexible, yours</div>
            <h1>Everything you share,<br /><span>in one polished page.</span></h1>
            <p>Create a fast public profile for your content, business, community, and contact details. Customize it with a consistent icon system, publish it, and learn what visitors use.</p>
            <div className="claim-box">
              <div className="claim-input"><span>{publicPrefix}</span><input value={username} onChange={(event) => setUsername(event.target.value)} aria-label="Choose username" /></div>
              <button className="primary-button" onClick={start}>Claim your page <ArrowUpRightIcon /></button>
            </div>
            <div className="hero-trust"><span><CheckIcon /> Free to start</span><span><CheckIcon /> No credit card</span><span><CheckIcon /> Real analytics</span></div>
          </div>

          <div className="hero-product">
            <div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" />
            <div className="floating-icon-chip chip-link"><BuiltInIcon name="link" /><span>Custom links</span></div>
            <div className="floating-icon-chip chip-chart"><ChartIcon /><span>Live insights</span></div>
            <div className="mini-stat stat-one"><strong>+31%</strong><small>more clicks</small></div>
            <div className="mini-stat stat-two"><strong>2.8k</strong><small>page views</small></div>
            <div className="phone-preview"><ProfileCanvas profile={sampleProfile} links={sampleLinks} preview /></div>
          </div>
        </section>

        <section className="creator-strip wrap">
          <p>Designed for modern independent work</p>
          <div><span>Creators</span><i /><span>Small shops</span><i /><span>Musicians</span><i /><span>Coaches</span><i /><span>Communities</span></div>
        </section>

        <section className="landing-section wrap" id="features">
          <div className="section-title centered">
            <div className="eyebrow"><SparkleIcon /> A complete page builder</div>
            <h2>Publish clearly. Manage everything easily.</h2>
            <p>Add, edit, reorder, customize, and track every destination from one focused workspace.</p>
          </div>

          <div className="feature-grid">
            <article className="feature-panel purple">
              <span className="feature-icon"><LinkIcon /></span><h3>Flexible link blocks</h3><p>Add titles, descriptions, built-in SVG icons, imported icon images, visibility controls, and custom destinations.</p>
              <div className="fake-blocks"><span><i><BuiltInIcon name="play" /> Latest video</i><b>↗</b></span><span><i><BuiltInIcon name="message" /> Join the community</i><b>↗</b></span><span><i><BuiltInIcon name="shop" /> Browse the shop</i><b>↗</b></span></div>
            </article>
            <article className="feature-panel green">
              <span className="feature-icon"><PaletteIcon /></span><h3>Consistent icon design</h3><p>Choose clear icons for links and social platforms, or safely upload and paste your own icon artwork.</p>
              <div className="icon-showcase">{['instagram', 'youtube', 'mail', 'globe', 'calendar', 'music', 'camera', 'shop', 'download'].map((name) => <span key={name}><BuiltInIcon name={name} /></span>)}</div>
            </article>
            <article className="feature-panel yellow">
              <span className="feature-icon"><ChartIcon /></span><h3>Useful analytics</h3><p>Track page views, clicks, click-through rate, top links, sources, devices, and seven-day trends.</p>
              <div className="mini-chart"><span style={{ height: '36%' }} /><span style={{ height: '55%' }} /><span style={{ height: '47%' }} /><span style={{ height: '72%' }} /><span style={{ height: '61%' }} /><span style={{ height: '88%' }} /><span style={{ height: '76%' }} /></div>
            </article>
          </div>
        </section>

        <section className="workflow-section" id="how">
          <div className="wrap workflow-grid">
            <div>
              <div className="eyebrow"><ZapIcon /> From setup to published</div>
              <h2>Ready in a few focused steps.</h2>
              <div className="workflow-list">
                <article><span>1</span><div><h3>Create your account</h3><p>Choose a unique address and add your public details.</p></div></article>
                <article><span>2</span><div><h3>Build the page</h3><p>Add links, select icons, customize the design, and preview every change.</p></div></article>
                <article><span>3</span><div><h3>Publish and improve</h3><p>Share your page and use analytics to make better decisions.</p></div></article>
              </div>
            </div>
            <div className="workflow-art workflow-ui-art">
              <div className="workflow-window">
                <div className="workflow-window-top"><i /><i /><i /><span>Page editor</span></div>
                <div className="workflow-window-body">
                  <aside><LinkIcon /><PaletteIcon /><ChartIcon /></aside>
                  <main>
                    <div className="workflow-editor-title"><span /><span /></div>
                    {['globe', 'play', 'mail'].map((name, index) => <div className="workflow-editor-row" key={name}><b><BuiltInIcon name={name} /></b><span><i /><i /></span><em className={index === 2 ? '' : 'on'} /></div>)}
                  </main>
                </div>
              </div>
              <span className="workflow-bubble bubble-a"><LinkIcon /> Add a link</span>
              <span className="workflow-bubble bubble-b"><PaletteIcon /> Choose a theme</span>
              <span className="workflow-bubble bubble-c"><GlobeIcon /> Publish page</span>
            </div>
          </div>
        </section>

        <section className="security-strip wrap">
          <article><ShieldIcon /><div><strong>Safer media inputs</strong><p>Unsafe protocols and SVG uploads are blocked.</p></div></article>
          <article><ZapIcon /><div><strong>Fast public pages</strong><p>Lightweight React UI with optimized assets.</p></div></article>
          <article><ChartIcon /><div><strong>Actionable data</strong><p>Simple metrics without a cluttered dashboard.</p></div></article>
        </section>

        <section className="pricing-wrap wrap" id="pricing">
          <div className="pricing-card">
            <div><div className="eyebrow"><SparkleIcon /> Everything essential</div><h2>Free while you build.</h2><p>Create an account, publish a profile, add up to 50 links, customize icons and design, and view analytics.</p><button className="primary-button" onClick={start}>Build my page <ArrowUpRightIcon /></button></div>
            <div className="price-ticket"><span>Starter</span><strong>$0</strong><small>no card required</small><ul><li><CheckIcon /> Public profile</li><li><CheckIcon /> Link management</li><li><CheckIcon /> Icon and theme editor</li><li><CheckIcon /> Analytics</li></ul></div>
          </div>
        </section>

        <section className="final-landing-cta wrap">
          <div className="cta-icon-grid" aria-hidden="true">{['link', 'globe', 'play', 'mail', 'shop', 'chart'].map((name) => <span key={name}>{name === 'chart' ? <ChartIcon /> : <BuiltInIcon name={name} />}</span>)}</div>
          <div><h2>Make one link work harder.</h2><p>Publish a clean, memorable page your visitors can understand and use immediately.</p><button className="primary-button" onClick={start}>Create PawLink free <ArrowUpRightIcon /></button></div>
        </section>
      </main>

      <footer className="landing-footer wrap"><Brand /><p>One page for everything you share.</p><span>© 2026 PawLink</span></footer>
    </div>
  );
}
