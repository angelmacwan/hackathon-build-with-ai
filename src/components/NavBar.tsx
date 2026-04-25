'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, LayoutDashboard, BookOpen, Map, Library, LogOut, User } from 'lucide-react';
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

  const handleSignOut = async () => {
    await signOut();
    document.cookie = '__session=; path=/; max-age=0';
    router.push('/');
  };

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      {/* Brand */}
      <Link href="/dashboard" className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Brain size={18} aria-hidden="true" />
        </div>
        <div>
          <div className="sidebar-brand-name">NeuralPath</div>
          <div className="sidebar-brand-sub">Adaptive AI</div>
        </div>
      </Link>

      {/* Nav links */}
      <nav className="sidebar-nav">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-nav-btn${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      {user && (
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '1rem',
            borderTop: '1px solid var(--outline-variant)',
          }}
        >
          <Link
            href="/profile"
            className="sidebar-nav-btn"
            style={{ marginBottom: '0.15rem' }}
            aria-label="View profile"
          >
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName ?? 'User'}
                width={22}
                height={22}
                className="rounded-full flex-shrink-0"
                style={{ borderRadius: '50%' }}
              />
            ) : (
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: 'var(--on-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {user.displayName?.[0] ?? 'U'}
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--on-surface)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.displayName ?? user.email}
              </div>
              <div
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--outline)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.email}
              </div>
            </div>
            <User size={13} style={{ color: 'var(--outline)', flexShrink: 0 }} aria-hidden="true" />
          </Link>

          <button
            onClick={handleSignOut}
            className="sidebar-nav-btn danger"
            style={{ width: '100%' }}
            aria-label="Sign out"
          >
            <LogOut size={15} aria-hidden="true" />
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}
