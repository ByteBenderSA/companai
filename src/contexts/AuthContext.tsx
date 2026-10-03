import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { currentAppUser, onAuthChange, signOutUser, type AppUser } from '@/lib/auth';

interface AuthContextType {
  /** null when signed out. */
  user: AppUser | null;
  /** True until Firebase has told us whether someone is signed in. */
  loading: boolean;
  logout: () => Promise<void>;
  /** Re-read the signed-in user, e.g. after sign-up sets the display name. */
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

/** For pages behind ProtectedRoute, where a user is guaranteed. */
// eslint-disable-next-line react-refresh/only-export-components
export const useUser = (): AppUser => {
  const { user } = useAuth();
  if (!user) throw new Error('useUser must be used inside a ProtectedRoute');
  return user;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthChange((u) => {
        setUser(u);
        setLoading(false);
      }),
    []
  );

  return <AuthContext.Provider value={{ user, loading, logout: signOutUser, refreshUser: () => setUser(currentAppUser()) }}>{children}</AuthContext.Provider>;
};
