import React, { useCallback, useEffect, useState } from 'react';
import { api, getToken, setToken } from './lib/api.js';
import { navigate, useRoute } from './lib/router.jsx';
import LandingPage from './components/LandingPage.jsx';
import AuthPage from './components/AuthPage.jsx';
import Dashboard from './components/Dashboard.jsx';
import PublicPage from './components/PublicPage.jsx';
import { BrandMark } from './components/Icons.jsx';

function Redirect({ to }) {
  useEffect(() => navigate(to), [to]);
  return null;
}

export default function App() {
  const path = useRoute();
  const [session, setSession] = useState({ loading: Boolean(getToken()), data: null, error: '' });
  const [authState, setAuthState] = useState({ busy: false, error: '' });

  const loadSession = useCallback(async () => {
    if (!getToken()) {
      setSession({ loading: false, data: null, error: '' });
      return;
    }
    setSession((current) => ({ ...current, loading: true, error: '' }));
    try {
      const data = await api.me();
      setSession({ loading: false, data, error: '' });
    } catch (error) {
      if (error.status === 401) setToken('');
      setSession({ loading: false, data: null, error: error.message });
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    setAuthState((current) => current.error ? { busy: false, error: '' } : current);
  }, [path]);

  const authenticate = async (mode, form) => {
    setAuthState({ busy: true, error: '' });
    try {
      const result = mode === 'signup' ? await api.signup(form) : await api.login(form);
      setToken(result.token);
      const data = await api.me();
      setSession({ loading: false, data, error: '' });
      navigate('/dashboard');
    } catch (error) {
      setAuthState({ busy: false, error: error.message });
    }
  };

  const logout = async () => {
    try { await api.logout(); } catch { /* clear locally anyway */ }
    setToken('');
    setSession({ loading: false, data: null, error: '' });
    navigate('/');
  };

  const publicMatch = path.match(/^\/p\/([a-z0-9._-]+)$/i);
  if (publicMatch) return <PublicPage username={publicMatch[1].toLowerCase()} />;

  if (session.loading && path === '/dashboard') return <div className="app-loading"><BrandMark className="loading-brand-mark"/><p>Loading your dashboard…</p></div>;
  if (session.error && path === '/dashboard' && getToken()) return <div className="public-error"><BrandMark /><h1>Could not open dashboard</h1><p>{session.error}</p><button type="button" className="primary-button" onClick={loadSession}>Try again</button></div>;

  if (path === '/login') {
    if (session.data) return <Redirect to="/dashboard" />;
    return <AuthPage mode="login" onSubmit={(form) => authenticate('login', form)} {...authState} />;
  }
  if (path === '/signup') {
    if (session.data) return <Redirect to="/dashboard" />;
    return <AuthPage mode="signup" onSubmit={(form) => authenticate('signup', form)} {...authState} />;
  }
  if (path === '/dashboard') {
    if (!session.data) return <Redirect to="/login" />;
    return <Dashboard initialData={session.data} onLogout={logout} />;
  }
  return <LandingPage authenticated={Boolean(session.data)} />;
}
