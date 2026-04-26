import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const userLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: '⊡' },
    { label: 'New Order', path: '/new-order', icon: '+' },
    { label: 'My Orders', path: '/orders', icon: '◫' },
  ];

  const adminLinks = [
    { label: 'Dashboard', path: '/admin', icon: '⊡' },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <button onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')} style={styles.logo}>
          <span style={styles.logoIcon}>◈</span>
          <span style={styles.logoText}>Porter</span>
          {isAdmin && <span style={styles.adminBadge}>Admin</span>}
        </button>

        {/* Desktop Links */}
        <div style={styles.links}>
          {links.map(l => (
            <button
              key={l.path}
              onClick={() => navigate(l.path)}
              style={{
                ...styles.navLink,
                ...(location.pathname === l.path ? styles.navLinkActive : {}),
              }}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div style={styles.actions}>
          <button onClick={toggle} style={styles.iconBtn} title="Toggle theme">
            {theme === 'dark' ? '☀' : '◑'}
          </button>
          <div style={styles.userChip}>
            <span style={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</span>
            <span style={styles.userName}>{user?.name?.split(' ')[0]}</span>
          </div>
          <button onClick={() => { logout(); navigate('/auth'); }} style={styles.logoutBtn}>
            Logout
          </button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(m => !m)} style={styles.hamburger}>
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={styles.mobileMenu}>
          {links.map(l => (
            <button
              key={l.path}
              onClick={() => { navigate(l.path); setMenuOpen(false); }}
              style={styles.mobileLink}
            >
              {l.icon} {l.label}
            </button>
          ))}
          <button onClick={toggle} style={styles.mobileLink}>{theme === 'dark' ? '☀ Light Mode' : '◑ Dark Mode'}</button>
          <button onClick={() => { logout(); navigate('/auth'); }} style={{ ...styles.mobileLink, color: 'var(--accent-red)' }}>
            ⊗ Logout
          </button>
        </div>
      )}
    </nav>
  );
}

const styles = {
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'var(--bg-overlay)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border)',
  },
  inner: {
    maxWidth: 1200, margin: '0 auto', padding: '0 24px',
    height: 64, display: 'flex', alignItems: 'center', gap: 24,
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'none', border: 'none', cursor: 'pointer',
    textDecoration: 'none',
  },
  logoIcon: {
    fontSize: 22, color: 'var(--accent-orange)',
    display: 'flex', alignItems: 'center',
  },
  logoText: {
    fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800,
    color: 'var(--text-primary)', letterSpacing: '-0.5px',
  },
  adminBadge: {
    fontSize: 10, fontWeight: 700, letterSpacing: 1,
    background: 'var(--accent-orange)', color: 'white',
    padding: '2px 7px', borderRadius: 'var(--radius-full)', textTransform: 'uppercase',
  },
  links: { display: 'flex', gap: 4, flex: 1, justifyContent: 'center',
    '@media(maxWidth:768px)': { display: 'none' } },
  navLink: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
    color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: 'var(--radius-sm)',
    transition: 'all var(--transition)',
  },
  navLinkActive: {
    color: 'var(--accent-orange)',
    background: 'var(--accent-orange-dim)',
  },
  actions: { display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' },
  iconBtn: {
    background: 'none', border: '1px solid var(--border)', cursor: 'pointer',
    width: 36, height: 36, borderRadius: 'var(--radius-sm)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, color: 'var(--text-secondary)', transition: 'all var(--transition)',
  },
  userChip: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--bg-tertiary)', padding: '4px 12px 4px 4px',
    borderRadius: 'var(--radius-full)', border: '1px solid var(--border)',
  },
  avatar: {
    width: 26, height: 26, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent-orange), var(--accent-orange-light))',
    color: 'white', fontSize: 12, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  userName: { fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' },
  logoutBtn: {
    background: 'none', border: '1px solid var(--border)', cursor: 'pointer',
    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
    color: 'var(--text-secondary)', padding: '7px 14px', borderRadius: 'var(--radius-sm)',
    transition: 'all var(--transition)',
  },
  hamburger: {
    display: 'none', flexDirection: 'column', gap: 4,
    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
  },
  mobileMenu: {
    display: 'flex', flexDirection: 'column', gap: 2,
    padding: '12px 16px 16px',
    borderTop: '1px solid var(--border)',
    background: 'var(--bg-overlay)',
    backdropFilter: 'blur(20px)',
  },
  mobileLink: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500,
    color: 'var(--text-primary)', padding: '12px 16px', borderRadius: 'var(--radius-sm)',
    textAlign: 'left', transition: 'background var(--transition)',
  },
};
