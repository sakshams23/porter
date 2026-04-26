import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import Navbar from '../components/Navbar';

const STATUS_CONFIG = {
  pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Pending', icon: '◷' },
  confirmed: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'Confirmed', icon: '✓' },
  picked_up: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Picked Up', icon: '⬆' },
  in_transit: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'In Transit', icon: '→' },
  out_for_delivery: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Out for Delivery', icon: '↗' },
  delivered: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Delivered', icon: '✓' },
  cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Cancelled', icon: '✕' },
  on_hold: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'On Hold', icon: '⏸' },
};

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    API.get('/orders').then(({ data }) => setOrders(data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (data) => {
      setOrders(prev => prev.map(o => o._id === data.orderId
        ? { ...o, status: data.status, trackingEvents: [...(o.trackingEvents || []), data.trackingEvent] }
        : o
      ));
      setNotification(data.trackingEvent?.message || 'Order updated!');
      setTimeout(() => setNotification(null), 4000);
    };
    socket.on('order_update', handleUpdate);
    return () => socket.off('order_update', handleUpdate);
  }, [socket]);

  const active = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const past = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  return (
    <div style={s.page}>
      <Navbar />

      {/* Notification toast */}
      {notification && (
        <div style={s.toast}>
          <span style={s.toastIcon}>◆</span>
          {notification}
        </div>
      )}

      <div style={s.content}>
        {/* Hero greeting */}
        <div style={s.hero}>
          <div>
            <h1 style={s.greeting}>Good {getGreeting()}, <span style={s.name}>{user?.name?.split(' ')[0]}</span> 👋</h1>
            <p style={s.heroSub}>You have <strong style={{ color: 'var(--accent-orange)' }}>{active.length}</strong> active {active.length === 1 ? 'delivery' : 'deliveries'}</p>
          </div>
          <button onClick={() => navigate('/new-order')} style={s.newOrderBtn}>
            <span style={s.plusIcon}>+</span>
            New Delivery
          </button>
        </div>

        {/* Stats bar */}
        <div style={s.statsGrid}>
          {[
            { label: 'Total Orders', value: orders.length, icon: '◫', color: '#3b82f6' },
            { label: 'Active', value: active.length, icon: '→', color: 'var(--accent-orange)' },
            { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, icon: '✓', color: '#10b981' },
            { label: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length, icon: '✕', color: '#ef4444' },
          ].map((stat, i) => (
            <div key={i} style={s.statCard}>
              <span style={{ ...s.statIcon, color: stat.color }}>{stat.icon}</span>
              <div style={s.statValue}>{stat.value}</div>
              <div style={s.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Active orders */}
        {loading ? (
          <div style={s.loadingState}>Loading your orders...</div>
        ) : active.length > 0 ? (
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Active Deliveries</h2>
            <div style={s.orderGrid}>
              {active.map((order, i) => (
                <OrderCard key={order._id} order={order} index={i} onClick={() => navigate(`/track/${order._id}`)} />
              ))}
            </div>
          </section>
        ) : (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>◫</div>
            <h3 style={s.emptyTitle}>No active deliveries</h3>
            <p style={s.emptyText}>Schedule your first delivery and we'll handle the rest.</p>
            <button onClick={() => navigate('/new-order')} style={s.emptyBtn}>Schedule a Pickup →</button>
          </div>
        )}

        {/* Past orders */}
        {past.length > 0 && (
          <section style={s.section}>
            <div style={s.sectionHeader}>
              <h2 style={s.sectionTitle}>Past Deliveries</h2>
              <button onClick={() => navigate('/orders')} style={s.viewAll}>View All →</button>
            </div>
            <div style={s.orderGrid}>
              {past.slice(0, 3).map((order, i) => (
                <OrderCard key={order._id} order={order} index={i} onClick={() => navigate(`/track/${order._id}`)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, index, onClick }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  return (
    <button
      onClick={onClick}
      style={{ ...s.orderCard, animationDelay: `${index * 0.08}s` }}
    >
      <div style={s.orderCardTop}>
        <div style={s.orderId}>{order.orderId}</div>
        <div style={{ ...s.statusBadge, color: cfg.color, background: cfg.bg }}>
          <span>{cfg.icon}</span> {cfg.label}
        </div>
      </div>
      <div style={s.orderDesc}>{order.packageDescription}</div>
      <div style={s.orderRoute}>
        <div style={s.routePoint}>
          <span style={s.routeDot('green')} />
          <span style={s.routeAddr}>{order.pickupLocation?.address?.slice(0, 35)}...</span>
        </div>
        <div style={s.routeLine} />
        <div style={s.routePoint}>
          <span style={s.routeDot('orange')} />
          <span style={s.routeAddr}>{order.dropoffLocation?.address?.slice(0, 35)}...</span>
        </div>
      </div>
      <div style={s.orderMeta}>
        <span style={s.metaItem}>₹{order.price}</span>
        <span style={s.metaItem}>{order.packageSize}</span>
        <span style={s.metaArrow}>→</span>
      </div>
    </button>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg-primary)' },
  content: { maxWidth: 1200, margin: '0 auto', padding: '40px 24px' },
  toast: {
    position: 'fixed', top: 80, right: 24, zIndex: 300,
    background: 'var(--accent-orange)', color: 'white',
    padding: '14px 20px', borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-orange)', fontSize: 14, fontWeight: 500,
    display: 'flex', alignItems: 'center', gap: 10,
    animation: 'fadeUp 0.3s ease',
  },
  toastIcon: { fontSize: 16 },
  hero: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 36, flexWrap: 'wrap', gap: 16,
  },
  greeting: { fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 },
  name: { color: 'var(--accent-orange)' },
  heroSub: { fontSize: 15, color: 'var(--text-secondary)' },
  newOrderBtn: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--accent-orange)', color: 'white',
    border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
    fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
    padding: '14px 24px', boxShadow: 'var(--shadow-orange)',
    transition: 'transform var(--transition-spring)',
  },
  plusIcon: { fontSize: 20, lineHeight: 1 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 },
  statCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '24px 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
    boxShadow: 'var(--shadow-sm)', animation: 'fadeUp 0.5s ease forwards',
  },
  statIcon: { fontSize: 20 },
  statValue: { fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 },
  statLabel: { fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 },
  section: { marginBottom: 48 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 },
  viewAll: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-orange)', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)' },
  orderGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 },
  orderCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '20px', cursor: 'pointer',
    textAlign: 'left', transition: 'all var(--transition)',
    animation: 'fadeUp 0.4s ease forwards', opacity: 0,
    boxShadow: 'var(--shadow-sm)',
  },
  orderCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderId: { fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1 },
  statusBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '4px 10px', borderRadius: 'var(--radius-full)',
    fontSize: 12, fontWeight: 600,
  },
  orderDesc: { fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 },
  orderRoute: { marginBottom: 16 },
  routePoint: { display: 'flex', alignItems: 'center', gap: 10 },
  routeDot: (color) => ({
    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
    background: color === 'green' ? 'var(--accent-green)' : 'var(--accent-orange)',
  }),
  routeAddr: { fontSize: 13, color: 'var(--text-secondary)' },
  routeLine: { width: 1, height: 14, background: 'var(--border)', marginLeft: 3.5, marginTop: 2, marginBottom: 2 },
  orderMeta: { display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 12 },
  metaItem: { fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 },
  metaArrow: { marginLeft: 'auto', color: 'var(--accent-orange)', fontSize: 18 },
  loadingState: { textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 15 },
  emptyState: {
    textAlign: 'center', padding: '80px 40px',
    background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)', marginBottom: 48,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16, opacity: 0.3 },
  emptyTitle: { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 },
  emptyText: { fontSize: 15, color: 'var(--text-muted)', marginBottom: 28 },
  emptyBtn: {
    background: 'var(--accent-orange)', color: 'white', border: 'none',
    padding: '14px 28px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
    fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
    boxShadow: 'var(--shadow-orange)',
  },
};
