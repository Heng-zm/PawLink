import React, { useMemo, useState } from 'react';
import { AppLink } from '../lib/router.jsx';
import Brand from './Brand.jsx';
import { ArrowLeftIcon, ArrowUpRightIcon, BuiltInIcon, ChartIcon, CheckIcon, LinkIcon, PaletteIcon } from './Icons.jsx';
import { publicProfilePrefixLabel } from '../lib/browser.js';

export default function AuthPage({ mode = 'login', onSubmit, busy, error }) {
  const initialUsername = useMemo(() => new URLSearchParams(window.location.search).get('username') || '', []);
  const [form, setForm] = useState({ email: '', password: '', displayName: '', username: initialUsername });
  const signup = mode === 'signup';
  const publicPrefix = publicProfilePrefixLabel();
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  return (
    <div className="auth-shell">
      <section className="auth-art-panel">
        <AppLink to="/" className="auth-brand"><Brand /></AppLink>
        <div className="auth-art-copy">
          <span className="auth-kicker">{signup ? 'Your page starts here' : 'Welcome back'}</span>
          <h1>{signup ? 'Build one clear home for every link.' : 'Keep your page current and useful.'}</h1>
          <p>{signup ? 'Create your profile, choose consistent icons, organize destinations, and publish in minutes.' : 'Update content, refine the design, and see what visitors use.'}</p>
          <ul><li><CheckIcon /> Up to 50 active links</li><li><CheckIcon /> Built-in and custom icons</li><li><CheckIcon /> Page views and click analytics</li></ul>
        </div>
        <div className="auth-product-card" aria-hidden="true">
          <div className="auth-product-header"><span /><span /></div>
          <div className="auth-product-nav"><LinkIcon /><PaletteIcon /><ChartIcon /></div>
          <div className="auth-product-content">
            {['globe', 'play', 'mail'].map((name) => <div key={name}><b><BuiltInIcon name={name} /></b><span><i /><i /></span></div>)}
          </div>
        </div>
      </section>

      <main className="auth-form-panel">
        <AppLink to="/" className="back-link"><ArrowLeftIcon /> Back home</AppLink>
        <form className="auth-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
          <div className="auth-heading"><h2>{signup ? 'Create your account' : 'Log in to PawLink'}</h2><p>{signup ? 'Everything below can be changed later.' : 'Enter the details you used when signing up.'}</p></div>
          {error && <div className="form-error" role="alert">{error}</div>}
          {signup && <label>Display name<input required maxLength="60" value={form.displayName} onChange={update('displayName')} placeholder="Mina Makes" autoComplete="name" /></label>}
          {signup && <label>Username<div className="input-prefix"><span>{publicPrefix}</span><input required minLength="3" maxLength="24" pattern="[a-zA-Z0-9._-]+" value={form.username} onChange={update('username')} placeholder="minamakes" autoCapitalize="none" /></div></label>}
          <label>Email address<input required type="email" maxLength="160" value={form.email} onChange={update('email')} placeholder="you@example.com" autoComplete="email" /></label>
          <label>Password<input required type="password" minLength="8" maxLength="128" value={form.password} onChange={update('password')} placeholder="At least 8 characters" autoComplete={signup ? 'new-password' : 'current-password'} /></label>
          <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create my page' : 'Log in'} {!busy && <ArrowUpRightIcon />}</button>
          <p className="auth-switch">{signup ? 'Already have an account?' : 'New to PawLink?'} <AppLink to={signup ? '/login' : '/signup'}>{signup ? 'Log in' : 'Create one free'}</AppLink></p>
        </form>
      </main>
    </div>
  );
}
