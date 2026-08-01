import { useEffect, useState } from 'react';

export function navigate(path) {
  const destination = String(path || '/');
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (current === destination) return;
  window.history.pushState({}, '', destination);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function useRoute() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onChange = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onChange);
    return () => window.removeEventListener('popstate', onChange);
  }, []);
  return path;
}

export function AppLink({ to, children, onClick, ...props }) {
  return (
    <a
      href={to}
      onClick={(event) => {
        onClick?.(event);
        const internal = typeof to === 'string' && to.startsWith('/');
        if (internal && props.target !== '_blank' && !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
          event.preventDefault();
          navigate(to);
        }
      }}
      {...props}
    >
      {children}
    </a>
  );
}
