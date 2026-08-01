import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { AppLink } from '../lib/router.jsx';
import Brand from './Brand.jsx';
import ProfileCanvas from './ProfileCanvas.jsx';
import { ArrowLeftIcon, BrandMark } from './Icons.jsx';

export default function PublicPage({ username }) {
  const [state, setState] = useState({ loading: true, error: '', data: null });

  useEffect(() => {
    let active = true;
    setState({ loading: true, error: '', data: null });
    api.publicProfile(username)
      .then((data) => {
        if (!active) return;
        setState({ loading: false, error: '', data });
        api.trackView(username).catch(() => {});
        document.title = `${data.profile.displayName} · PawLink`;
      })
      .catch((error) => {
        if (!active) return;
        document.title = 'Page not found · PawLink';
        setState({ loading: false, error: error.message, data: null });
      });
    return () => {
      active = false;
      document.title = 'PawLink — Everything you share in one page';
    };
  }, [username]);

  if (state.loading) return <div className="public-loading"><BrandMark className="loading-brand-mark" /><p>Opening page…</p></div>;
  if (state.error) return <div className="public-error"><BrandMark /><h1>Page not found</h1><p>{state.error}</p><AppLink to="/" className="primary-button"><ArrowLeftIcon /> Go to PawLink</AppLink></div>;

  return (
    <div className="public-page-shell">
      <ProfileCanvas profile={state.data.profile} links={state.data.links} onLinkClick={(link) => api.trackClick(username, link.id).catch(() => {})} />
      <AppLink to="/" className="powered-by"><Brand compact /> </AppLink>
    </div>
  );
}
