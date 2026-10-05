import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** New page → start at the top (the router keeps the old scroll position otherwise). Same-page #anchors are left alone. */
export function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname, search]);
  return null;
}
