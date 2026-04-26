import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const STATUS_CONFIG = {
  pending: { color: '#f59e0b', label: 'Pending' },
  confirmed: { color: '#3b82f6', label: 'Confirmed' },
  picked_up: { color: '#8b5cf6', label: 'Picked Up' },
  in_transit: { color: '#f59e0b', label: 'In Transit' },
  out_for_delivery: { color: '#10b981', label: 'Out for Delivery' },
  delivered: { color: '#10b981', label: 'Delivered' },
  cancelled: { color: '#ef4444', label: 'Cancelled' },
  on_hold: { color: '#ef4444', label: 'On Hold' },
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/orders').then(({ data }) => setOrders(data)).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.content}>
        <div style={s.header}>
          <h1 style={s.title}>Order History</h1>
          <span style={s.count}>{orders.length} orders</span>
        </div>

        {/* Filters */}
        <div style={s.filters}>
          {['all', 'pending', 'in_transit', 'delivered', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ ...s.filterBtn, ...(filter === f ? s.filterBtnActive : {}) }}>
              {f === 'all' ? 'All' : STATUS_CONFIG[f]?.label || f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={s.loading}>Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>No orders found</div>
        ) : (
          <div style={s.list}>
            {filtered.map((order, i) => {
              const cfg = STATUS_CONFIG[order.status] || {};
              return (
                <button key={order._id} onClick={() => navigate(`/track/${order._id}`)} style={{ ...s.row, animationDelay: `${i * 0.05}s` }}>
                  <div style={s.rowLeft}>
                    <div style={s.rowId}>{order.orderId}</div>
                    <div style={s.rowDesc}>{order.packageDescription}</div>
                    <div style={s.rowAddr}>{order.pickupLocation?.address?.slice(0, 40)}... → {order.dropoffLocation?.address?.slice(0, 40)}...</div>
                  </div>
                  <div style={s.rowRight}>
                    <div style={{ ...s.statusDot, background: cfg.color || '#888' }} />
                    <div style={{ ...s.statusText, color: cfg.color }}>{cfg.label}</div>
                    <div style={s.price}>₹{order.price}</div>
                    <div style={s.date}>{new Date(order.createdAt).toLocaleDateString()}</div>
                    <span style={s.arrow}>→</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg-primary)' },
  content: { maxWidth: 900, margin: '0 auto', padding: '40px 24px' },
  header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 },
  title: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' },
  count: { background: 'var(--bg-tertiary)', border: '1px solid var(--border)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 13, color: 'var(--text-muted)' },
  filters: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 },
  filterBtn: {
    padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)',
    background: 'var(--bg-card)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
    color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', transition: 'all var(--transition)',
  },
  filterBtnActive: { background: 'var(--accent-orange)', border: '1px solid var(--accent-orange)', color: 'white' },
  loading: { textAlign: 'center', padding: 60, color: 'var(--text-muted)' },
  empty: { textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 15 },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  row: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '18px 22px', cursor: 'pointer',
    textAlign: 'left', transition: 'all var(--transition)',
    animation: 'fadeUp 0.35s ease forwards', opacity: 0, gap: 16,
  },
  rowLeft: { flex: 1, minWidth: 0 },
  rowId: { fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 4 },
  rowDesc: { fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 },
  rowAddr: { fontSize: 12, color: 'var(--text-muted)' },
  rowRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  statusDot: { width: 8, height: 8, borderRadius: '50%' },
  statusText: { fontSize: 12, fontWeight: 600 },
  price: { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' },
  date: { fontSize: 11, color: 'var(--text-muted)' },
  arrow: { color: 'var(--accent-orange)', fontSize: 18 },
};
