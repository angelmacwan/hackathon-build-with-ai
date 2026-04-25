'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, LayoutDashboard, BookOpen, Map, Library, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/learn',     label: 'Learn',     icon: BookOpen },
  { href: '/roadmap',   label: 'Roadmap',   icon: Map },
  { href: '/resources', label: 'Resources', icon: Library },
];

export default function NavBar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    document.cookie = '__session=; path=/; max-age=0';
    router.push('/');
  };

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(16px)',
        borderColor: 'var(--border-subtle)',
      }}
      role="banner"
    >
      <nav
        className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 font-bold text-lg"
          aria-label="NeuralPath home"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: '#EDE9FE', border: '1px solid #C4B5FD' }}
            aria-hidden="true"
          >
            <Brain size={18} style={{ color: 'var(--np-purple)' }} />
          </div>
          <span className="gradient-text hidden sm:block">NeuralPath</span>
        </Link>

        {/* Nav Links */}
        <ul className="hidden md:flex items-center gap-1" role="list">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    active ? 'text-white' : ''
                  }`}
                  style={
                    active
                      ? { background: '#1A1A1A', color: '#fff' }
                      : { color: 'var(--text-secondary)' }
                  }
                  aria-current={active ? 'page' : undefined}
                  onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Right: User menu */}
        {user && (
          <div className="relative">
            <button
              id="user-menu-btn"
              onClick={() => setShowMenu((v) => !v)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl border transition-all"
              style={{ borderColor: 'var(--border-subtle)' }}
              aria-label="User menu"
              aria-expanded={showMenu}
              aria-haspopup="true"
            >
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName ?? 'User avatar'}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: 'var(--np-purple)' }}
                >
                  {user.displayName?.[0] ?? 'U'}
                </div>
              )}
              <span
                className="text-sm font-medium hidden sm:block max-w-[120px] truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {user.displayName ?? user.email}
              </span>
            </button>

            {showMenu && (
              <div
                className="absolute right-0 mt-2 w-52 np-card py-2 shadow-lg"
                role="menu"
                aria-label="User options"
              >
                <div
                  className="px-4 py-2 border-b"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {user.displayName}
                  </div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {user.email}
                  </div>
                </div>

                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  role="menuitem"
                  onClick={() => setShowMenu(false)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <User size={15} aria-hidden="true" />
                  Profile &amp; Badges
                </Link>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors"
                  style={{ color: '#dc2626' }}
                  role="menuitem"
                  aria-label="Sign out"
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#FEE2E2')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <LogOut size={15} aria-hidden="true" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Mobile bottom nav */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(16px)',
          borderColor: 'var(--border-subtle)',
        }}
        role="navigation"
        aria-label="Mobile navigation"
      >
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-all"
              style={{ color: active ? 'var(--np-purple)' : 'var(--text-muted)' }}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={20} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
