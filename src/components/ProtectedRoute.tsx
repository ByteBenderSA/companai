import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center" aria-label="Loading">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
    </div>
  );
}

/** Only for signed-in users; others go to /login and come back afterwards. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
}

/** Login / signup pages: signed-in users continue to where they were heading (or the dashboard). */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (user) return <Navigate to={(location.state as { from?: string } | null)?.from ?? '/dashboard'} replace />;
  return <>{children}</>;
}
