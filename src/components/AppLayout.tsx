import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { BookOpen, FolderKanban, LayoutDashboard, Lightbulb, LogOut, Menu, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useOpenSettings } from '@/contexts/SettingsDialogContext';
import { useSettings } from '@/lib/settings';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/idea-workshop', label: 'Idea Workshop', icon: Lightbulb },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/lessons', label: 'Lessons', icon: BookOpen },
];

function ApiKeyBanner() {
  const { geminiApiKey } = useSettings();
  const openSettings = useOpenSettings();
  if (geminiApiKey.trim()) return null;
  return (
    <div className="border-b border-amber-200 bg-amber-50" role="status">
      <div className="container flex flex-col gap-2 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-semibold">One-time setup:</span> add your free Gemini API key so the AI features work.
        </p>
        <Button size="sm" onClick={openSettings} className="w-full bg-amber-600 text-white hover:bg-amber-700 sm:w-auto">
          Add API key
        </Button>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const openSettings = useOpenSettings();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-purple-100 text-purple-800' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/60 via-white to-blue-50/60">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-4">
          <Link to="/dashboard" className="shrink-0" aria-label="CompanAI dashboard">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={linkClass}>
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-1 md:flex">
            <Button variant="ghost" size="sm" onClick={openSettings}>
              <Settings className="mr-1.5 h-4 w-4" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void logout()} title={user?.email}>
              <LogOut className="mr-1.5 h-4 w-4" />
              Log out
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {menuOpen && (
          <nav className="border-t border-gray-200 bg-white md:hidden" aria-label="Main">
            <div className="container flex flex-col gap-1 py-3">
              {NAV.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={linkClass} onClick={() => setMenuOpen(false)}>
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
              <button
                type="button"
                className={linkClass({ isActive: false })}
                onClick={() => {
                  setMenuOpen(false);
                  openSettings();
                }}
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button type="button" className={linkClass({ isActive: false })} onClick={() => void logout()}>
                <LogOut className="h-4 w-4" />
                Log out {user?.email ? <span className="truncate text-gray-400">({user.email})</span> : null}
              </button>
            </div>
          </nav>
        )}
      </header>

      <ApiKeyBanner />

      {/* Bottom padding keeps the floating mentor button from covering the last content. */}
      <main className="container pb-28 pt-6 sm:pt-8">{children}</main>
    </div>
  );
}
