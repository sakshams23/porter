import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import Navbar from '../components/Navbar';

const STATUS_CONFIG = {
  pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Pending' },
  confirmed: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'Confirmed' },
  picked_up: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Picked Up' },
  in_transit: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'In Transit' },
  out_for_delivery: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Out for Delivery' },
  delivered: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Delivered' },
  cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Cancelled' },
  on_hold: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'On Hold' },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const socket = useSocket();
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  useEffect(() => {
    Promise.all([
      API.get('/admin/stats').then(r => setStats(r.data)),
      API.get('/admin/orders').then(r => setOrders(r.data.orders)),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNew = ({ order }) => {
      setOrders(prev => [order, ...prev]);
      setNewOrderAlert(order);
      setStats(prev => ({ ...prev, total: (prev.total || 0) + 1, pending: (prev.pending || 0) + 1 }));
      setTimeout(() => setNewOrderAlert(null), 5000);
    };
    socket.on('new_order', handleNew);
    return () => socket.off('new_order', handleNew);
  }, [socket]);

  const filtered = orders.filter(o => {
    const matchFilter = filter === 'all' || o.status === filter;
    const matchSearch = !search || o.orderId?.includes(search.toUpperCase()) ||
      o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.packageDescription?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const statCards = [
    { label: 'Total Orders', value: stats.total || 0, icon: '◫', color: '#3b82f6' },
    { label: 'Pending', value: stats.pending || 0, icon: '◷', color: '#f59e0b' },
    { label: 'In Transit', value: stats.inTransit || 0, icon: '→', color: 'var(--accent-orange)' },
    { label: 'Delivered', value: stats.delivered || 0, icon: '✓', color: '#10b981' },
    { label: 'Cancelled', value: stats.cancelled || 0, icon: '✕', color: '#ef4444' },
    { label: 'Users', value: stats.users || 0, icon: '⊙', color: '#8b5cf6' },
  ];

  return (
    <div style={s.page}>
      <Navbar />

      {/* New order alert */}
      {newOrderAlert && (
        <div style={s.alert}>
          <span style={s.alertIcon}>◆</span>
          <div>
            <div style={s.alertTitle}>New Order Received!</div>
            <div style={s.alertDesc}>{newOrderAlert.orderId} — {newOrderAlert.packageDescription}</div>
          </div>
          <button onClick={() => navigate(`/admin/orders/${newOrderAlert._id}`)} style={s.alertBtn}>View →</button>
        </div>
      )}

      <div style={s.content}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Admin Dashboard</h1>
            <p style={s.subtitle}>Manage and monitor all deliveries</p>
          </div>
        </div>

        {/* Stats */}
        <div style={s.statsGrid}>
          {statCards.map((stat, i) => (
            <div key={i} style={{ ...s.statCard, animationDelay: `${i * 0.08}s` }}>
              <div style={{ ...s.statIconWrap, color: stat.color }}>{stat.icon}</div>
              <div style={s.statNum}>{stat.value}</div>
              <div style={s.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Orders table */}
        <div style={s.tableCard}>
          <div style={s.tableHeader}>
            <h2 style={s.tableTitle}>All Orders</h2>
            <div style={s.tableControls}>
              <input
                style={s.searchInput} placeholder="Search orders..."
                value={search} onChange={e => setSearch(e.target.value)}
              />
              <select style={s.filterSelect} value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="all">All Status</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div style={s.loading}>Loading orders...</div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    {['Order ID', 'Customer', 'Package', 'Status', 'Price', 'Scheduled', 'Action'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order, i) => {
                    const cfg = STATUS_CONFIG[order.status] || {};
                    return (
                      <tr key={order._id} style={s.tr} onClick={() => navigate(`/admin/orders/${order._id}`)}>
                        <td style={s.td}>
                          <span style={s.orderId}>{order.orderId}</span>
                        </td>
                        <td style={s.td}>
                          <div style={s.customerName}>{order.user?.name || '—'}</div>
                          <div style={s.customerEmail}>{order.user?.email}</div>
                        </td>
                        <td style={s.td}>
                          <div style={s.pkgDesc}>{order.packageDescription}</div>
                          <div style={s.pkgSize}>{order.packageSize}</div>
                        </td>
                        <td style={s.td}>
                          <span style={{ ...s.statusBadge, color: cfg.color, background: cfg.bg }}>
                            {cfg.label}
                          </span>
                        </td>
                        <td style={s.td}>
                          <span style={s.price}>₹{order.price}</span>
                        </td>
                        <td style={s.td}>
                          <span style={s.date}>{order.pickupSchedule ? new Date(order.pickupSchedule).toLocaleDateString() : '—'}</span>
                        </td>
                        <td style={s.td}>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${order._id}`); }}
                            style={s.viewBtn}
                          >Manage →</button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ ...s.td, textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No orders found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg-primary)' },
  content: { maxWidth: 1300, margin: '0 auto', padding: '40px 24px' },
  alert: {
    position: 'fixed', top: 80, right: 24, zIndex: 300,
    background: 'var(--bg-card)', border: '1.5px solid var(--accent-orange)',
    borderRadius: 'var(--radius-lg)', padding: '16px 20px',
    boxShadow: 'var(--shadow-orange)', display: 'flex', alignItems: 'center', gap: 16,
    animation: 'fadeUp 0.3s ease', minWidth: 320, maxWidth: 420,
  },
  alertIcon: { fontSize: 20, color: 'var(--accent-orange)', flexShrink: 0 },
  alertTitle: { fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' },
  alertDesc: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  alertBtn: {
    marginLeft: 'auto', background: 'var(--accent-orange)', color: 'white',
    border: 'none', padding: '8px 14px', borderRadius: 'var(--radius-sm)',
    cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, flexShrink: 0,
  },
  header: { marginBottom: 32 },
  title: { fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 },
  subtitle: { fontSize: 15, color: 'var(--text-muted)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginBottom: 32 },
  statCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
    padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 8,
    animation: 'fadeUp 0.4s ease forwards', opacity: 0, boxShadow: 'var(--shadow-sm)',
  },
  statIconWrap: { fontSize: 20 },
  statNum: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 },
  statLabel: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 },
  tableCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-md)',
  },
  tableHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 24px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 12,
  },
  tableTitle: { fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' },
  tableControls: { display: 'flex', gap: 10 },
  searchInput: {
    padding: '9px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14,
    fontFamily: 'var(--font-body)', outline: 'none', width: 220,
  },
  filterSelect: {
    padding: '9px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14,
    fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer',
  },
  loading: { padding: '60px', textAlign: 'center', color: 'var(--text-muted)' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: 'var(--bg-tertiary)' },
  th: {
    padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap',
  },
  tr: { borderTop: '1px solid var(--border)', cursor: 'pointer', transition: 'background var(--transition)' },
  td: { padding: '14px 16px', verticalAlign: 'middle' },
  orderId: { fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1 },
  customerName: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' },
  customerEmail: { fontSize: 11, color: 'var(--text-muted)' },
  pkgDesc: { fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' },
  pkgSize: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' },
  statusBadge: {
    display: 'inline-flex', padding: '4px 10px', borderRadius: 'var(--radius-full)',
    fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
  },
  price: { fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' },
  date: { fontSize: 12, color: 'var(--text-muted)' },
  viewBtn: {
    background: 'var(--accent-orange-dim)', color: 'var(--accent-orange)',
    border: '1px solid rgba(255,92,26,0.2)', borderRadius: 'var(--radius-sm)',
    padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
    fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', transition: 'all var(--transition)',
  },
};
