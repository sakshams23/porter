import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', adminCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdminCode, setShowAdminCode] = useState(false);
  const { login, register } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = mode === 'login'
        ? await login(form.email, form.password)
        : await register(form);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Background decoration */}
      <div style={s.bgOrb1} />
      <div style={s.bgOrb2} />

      {/* Theme toggle */}
      <button onClick={toggle} style={s.themeBtn}>{theme === 'dark' ? '☀' : '◑'}</button>

      <div style={s.container}>
        {/* Left panel */}
        <div style={s.left}>
          <div style={s.brand}>
            <span style={s.brandIcon}>◈</span>
            <span style={s.brandName}>Porter</span>
          </div>
          <h1 style={s.headline}>Deliver<br /><span style={s.headlineAccent}>Anything.</span><br />Anywhere.</h1>
          <p style={s.subtext}>Premium package delivery with real-time tracking, scheduled pickups, and white-glove handling.</p>

          <div style={s.features}>
            {['Live GPS tracking', 'Scheduled pickups', 'Fragile item care', 'Instant notifications'].map((f, i) => (
              <div key={i} style={{ ...s.feature, animationDelay: `${i * 0.1}s` }}>
                <span style={s.featureDot} />
                <span style={s.featureText}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel - form */}
        <div style={s.right}>
          <div style={s.card}>
            {/* Tabs */}
            <div style={s.tabs}>
              <button onClick={() => setMode('login')} style={{ ...s.tab, ...(mode === 'login' ? s.tabActive : {}) }}>Sign In</button>
              <button onClick={() => setMode('register')} style={{ ...s.tab, ...(mode === 'register' ? s.tabActive : {}) }}>Create Account</button>
            </div>

            <form onSubmit={submit} style={s.form}>
              {mode === 'register' && (
                <Field label="Full Name" name="name" placeholder="Jane Smith" value={form.name} onChange={handle} required />
              )}
              <Field label="Email Address" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handle} required />
              <Field label="Password" name="password" type="password" placeholder={mode === 'login' ? 'Your password' : 'Min. 6 characters'} value={form.password} onChange={handle} required />
              {mode === 'register' && (
                <>
                  <Field label="Phone (optional)" name="phone" type="tel" placeholder="+91 9876543210" value={form.phone} onChange={handle} />
                  <div style={s.adminToggleRow}>
                    <button type="button" onClick={() => setShowAdminCode(v => !v)} style={s.adminToggle}>
                      {showAdminCode ? '▲' : '▼'} Register as Admin?
                    </button>
                  </div>
                  {showAdminCode && (
                    <Field label="Admin Code" name="adminCode" type="password" placeholder="Enter admin code" value={form.adminCode} onChange={handle} />
                  )}
                </>
              )}

              {error && <div style={s.error}><span>⚠</span> {error}</div>}

              <button type="submit" disabled={loading} style={s.submitBtn}>
                {loading ? <span style={s.spinner} /> : null}
                {loading ? 'Please wait...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
              </button>
            </form>

            <p style={s.switchText}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={s.switchLink}>
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, type = 'text', placeholder, value, onChange, required }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={fs.label}>{label}</label>
      <input
        name={name} type={type} placeholder={placeholder} value={value}
        onChange={onChange} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ ...fs.input, ...(focused ? fs.inputFocused : {}) }}
      />
    </div>
  );
}

const fs = {
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  input: {
    width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--border)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: 15, fontFamily: 'var(--font-body)',
    outline: 'none', transition: 'all var(--transition)',
  },
  inputFocused: { borderColor: 'var(--accent-orange)', boxShadow: '0 0 0 3px var(--accent-orange-dim)' },
};

const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-primary)', padding: '24px', position: 'relative', overflow: 'hidden',
  },
  bgOrb1: {
    position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600,
    borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,92,26,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgOrb2: {
    position: 'absolute', bottom: '-20%', left: '-10%', width: 500, height: 500,
    borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,184,126,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  themeBtn: {
    position: 'fixed', top: 20, right: 20, zIndex: 200,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    width: 40, height: 40, borderRadius: 'var(--radius-sm)', cursor: 'pointer',
    fontSize: 16, color: 'var(--text-secondary)',
  },
  container: {
    maxWidth: 920, width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48,
    alignItems: 'center', position: 'relative', zIndex: 1,
  },
  left: { animation: 'fadeUp 0.6s ease forwards' },
  brand: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 },
  brandIcon: { fontSize: 28, color: 'var(--accent-orange)' },
  brandName: { fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' },
  headline: {
    fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 4vw, 52px)',
    fontWeight: 800, lineHeight: 1.1, color: 'var(--text-primary)', marginBottom: 20,
  },
  headlineAccent: {
    background: 'linear-gradient(90deg, var(--accent-orange), #ff9a5c)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  subtext: { fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 32 },
  features: { display: 'flex', flexDirection: 'column', gap: 12 },
  feature: { display: 'flex', alignItems: 'center', gap: 12, animation: 'fadeUp 0.5s ease forwards', opacity: 0 },
  featureDot: { width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-orange)', flexShrink: 0 },
  featureText: { fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 },
  right: { animation: 'fadeUp 0.7s ease 0.1s forwards', opacity: 0 },
  card: {
    background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
    padding: 36, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)',
  },
  tabs: {
    display: 'flex', gap: 4, background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)', padding: 4, marginBottom: 28,
  },
  tab: {
    flex: 1, padding: '10px 16px', border: 'none', borderRadius: 'var(--radius-sm)',
    cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
    color: 'var(--text-secondary)', background: 'none', transition: 'all var(--transition)',
  },
  tabActive: {
    background: 'var(--bg-card)', color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-sm)',
  },
  form: { display: 'flex', flexDirection: 'column' },
  adminToggleRow: { marginBottom: 4 },
  adminToggle: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
  },
  error: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
    color: 'var(--accent-red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
    fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
  },
  submitBtn: {
    width: '100%', padding: '14px', marginTop: 8,
    background: 'var(--accent-orange)', color: 'white',
    border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
    fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
    letterSpacing: 0.5, transition: 'all var(--transition)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    boxShadow: 'var(--shadow-orange)',
  },
  spinner: {
    width: 18, height: 18, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white',
    animation: 'spin 0.7s linear infinite', display: 'inline-block',
  },
  switchText: { textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' },
  switchLink: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-orange)', fontWeight: 600, fontSize: 14 },
};
