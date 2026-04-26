import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import Navbar from '../components/Navbar';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: '◷', desc: 'Waiting for confirmation' },
  { key: 'confirmed', label: 'Confirmed', icon: '✓', desc: 'Porter assigned' },
  { key: 'picked_up', label: 'Picked Up', icon: '⬆', desc: 'Package collected' },
  { key: 'in_transit', label: 'In Transit', icon: '→', desc: 'On the way' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '↗', desc: 'Almost there!' },
  { key: 'delivered', label: 'Delivered', icon: '✓', desc: 'Package delivered' },
];

const STATUS_ORDER = ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];

export default function TrackOrder() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveLocation, setLiveLocation] = useState(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    API.get(`/orders/${orderId}`)
      .then(({ data }) => { setOrder(data); setLiveLocation(data.currentLocation); })
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (data) => {
      if (data.orderId === orderId) {
        setOrder(prev => prev ? {
          ...prev, status: data.status,
          trackingEvents: [...(prev.trackingEvents || []), data.trackingEvent],
        } : prev);
        setPulse(true); setTimeout(() => setPulse(false), 1000);
      }
    };
    const handleLocation = (data) => {
      if (data.orderId === orderId) setLiveLocation({ lat: data.lat, lng: data.lng, address: data.address });
    };
    socket.on('order_update', handleUpdate);
    socket.on('location_update', handleLocation);
    return () => { socket.off('order_update', handleUpdate); socket.off('location_update', handleLocation); };
  }, [socket, orderId]);

  if (loading) return <div style={s.loading}><Navbar /><div style={s.loadText}>Loading tracking info...</div></div>;
  if (!order) return null;

  const currentIdx = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const isOnHold = order.status === 'on_hold';

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.content}>
        <div style={s.header}>
          <button onClick={() => navigate('/dashboard')} style={s.back}>← Dashboard</button>
          <div style={s.orderIdBadge}>{order.orderId}</div>
        </div>

        <div style={s.grid}>
          {/* Left: Status & timeline */}
          <div style={s.leftCol}>
            {/* Status hero */}
            <div style={{ ...s.statusHero, animation: pulse ? 'pulse 0.5s ease' : 'none' }}>
              <div style={s.statusIconWrap}>
                <div style={s.statusPing} />
                <div style={s.statusIconInner}>
                  {isCancelled ? '✕' : isOnHold ? '⏸' : STATUS_STEPS.find(s => s.key === order.status)?.icon || '→'}
                </div>
              </div>
              <div>
                <div style={s.statusLabel}>
                  {isCancelled ? 'Cancelled' : isOnHold ? 'On Hold' : STATUS_STEPS.find(s => s.key === order.status)?.label || order.status}
                </div>
                <div style={s.statusDesc}>
                  {isOnHold && order.stopReason ? `Reason: ${order.stopReason}` :
                    STATUS_STEPS.find(s => s.key === order.status)?.desc || ''}
                </div>
              </div>
            </div>

            {/* Progress stepper */}
            {!isCancelled && (
              <div style={s.stepper}>
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentIdx;
                  const active = i === currentIdx;
                  return (
                    <div key={step.key} style={s.stepRow}>
                      <div style={s.stepLeft}>
                        <div style={{ ...s.stepCircle, ...(done ? s.stepDone : {}), ...(active ? s.stepActive : {}) }}>
                          {done ? step.icon : ''}
                        </div>
                        {i < STATUS_STEPS.length - 1 && <div style={{ ...s.connector, ...(done ? s.connectorDone : {}) }} />}
                      </div>
                      <div style={s.stepRight}>
                        <div style={{ ...s.stepName, ...(active ? s.stepNameActive : done ? s.stepNameDone : {}) }}>{step.label}</div>
                        <div style={s.stepDescText}>{step.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Live location */}
            {liveLocation?.address && (
              <div style={s.liveLocCard}>
                <div style={s.liveHeader}>
                  <span style={s.liveDot} />
                  <span style={s.liveTitle}>Live Location</span>
                  <span style={s.liveUpdated}>Updated just now</span>
                </div>
                <p style={s.liveAddr}>{liveLocation.address}</p>
                {liveLocation.lat && liveLocation.lng && (
                  <a
                    href={`https://maps.google.com?q=${liveLocation.lat},${liveLocation.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    style={s.mapLink}
                  >
                    View on Google Maps →
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Right: Details & timeline */}
          <div style={s.rightCol}>
            {/* Package info */}
            <div style={s.infoCard}>
              <h3 style={s.cardTitle}>Package Details</h3>
              <div style={s.infoGrid}>
                <InfoRow label="Description" value={order.packageDescription} />
                <InfoRow label="Size" value={order.packageSize} />
                <InfoRow label="Weight" value={order.packageWeight || '—'} />
                <InfoRow label="Fragile" value={order.isFragile ? 'Yes ⚠' : 'No'} />
                <InfoRow label="Price" value={`₹${order.price}`} />
              </div>
            </div>

            {/* Route */}
            <div style={s.infoCard}>
              <h3 style={s.cardTitle}>Route</h3>
              <div style={s.routeDisplay}>
                <div style={s.routeItem}>
                  <div style={{ ...s.routeDot, background: 'var(--accent-green)' }} />
                  <div>
                    <div style={s.routeType}>Pickup</div>
                    <div style={s.routeAddr}>{order.pickupLocation?.address}</div>
                    {order.pickupSchedule && <div style={s.routeTime}>{new Date(order.pickupSchedule).toLocaleString()}</div>}
                  </div>
                </div>
                <div style={s.routeVertLine} />
                <div style={s.routeItem}>
                  <div style={{ ...s.routeDot, background: 'var(--accent-orange)' }} />
                  <div>
                    <div style={s.routeType}>Delivery</div>
                    <div style={s.routeAddr}>{order.dropoffLocation?.address}</div>
                    {order.estimatedDelivery && <div style={s.routeTime}>Est: {new Date(order.estimatedDelivery).toLocaleString()}</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking history */}
            <div style={s.infoCard}>
              <h3 style={s.cardTitle}>Tracking History</h3>
              <div style={s.timeline}>
                {[...(order.trackingEvents || [])].reverse().map((ev, i) => (
                  <div key={i} style={{ ...s.timelineItem, ...(i === 0 ? s.timelineItemActive : {}) }}>
                    <div style={{ ...s.timelineDot, ...(i === 0 ? s.timelineDotActive : {}) }} />
                    <div style={s.timelineContent}>
                      <div style={s.timelineMsg}>{ev.message}</div>
                      {ev.location && <div style={s.timelineLoc}>📍 {ev.location}</div>}
                      <div style={s.timelineTime}>{new Date(ev.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg-primary)' },
  loading: {},
  loadText: { textAlign: 'center', padding: 80, color: 'var(--text-muted)' },
  content: { maxWidth: 1100, margin: '0 auto', padding: '40px 24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  back: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 15, fontFamily: 'var(--font-body)' },
  orderIdBadge: {
    fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: 2,
    color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)',
    padding: '6px 14px', borderRadius: 'var(--radius-full)',
  },
  grid: { display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24 },
  leftCol: { display: 'flex', flexDirection: 'column', gap: 20 },
  rightCol: { display: 'flex', flexDirection: 'column', gap: 20 },
  statusHero: {
    background: 'linear-gradient(135deg, var(--accent-orange) 0%, #ff8c42 100%)',
    borderRadius: 'var(--radius-xl)', padding: '28px 24px',
    display: 'flex', alignItems: 'center', gap: 20,
    boxShadow: 'var(--shadow-orange)', color: 'white',
  },
  statusIconWrap: { position: 'relative', flexShrink: 0 },
  statusPing: {
    position: 'absolute', inset: -4, borderRadius: '50%',
    background: 'rgba(255,255,255,0.3)', animation: 'ping 2s infinite',
  },
  statusIconInner: {
    width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, fontWeight: 700, position: 'relative', zIndex: 1,
  },
  statusLabel: { fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 4 },
  statusDesc: { fontSize: 13, opacity: 0.85 },
  stepper: {
    background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
    padding: '20px', border: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
  },
  stepRow: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  stepLeft: { display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 },
  stepCircle: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'var(--bg-tertiary)', border: '2px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0,
  },
  stepDone: { background: 'var(--accent-green)', border: '2px solid var(--accent-green)', color: 'white' },
  stepActive: { background: 'var(--accent-orange)', border: '2px solid var(--accent-orange)', color: 'white', animation: 'pulse 2s infinite' },
  connector: { width: 2, flex: 1, minHeight: 20, background: 'var(--border)', margin: '4px 0' },
  connectorDone: { background: 'var(--accent-green)' },
  stepRight: { paddingBottom: 20, flex: 1 },
  stepName: { fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 2 },
  stepNameActive: { color: 'var(--accent-orange)' },
  stepNameDone: { color: 'var(--text-primary)' },
  stepDescText: { fontSize: 11, color: 'var(--text-muted)' },
  liveLocCard: {
    background: 'var(--accent-green-dim)', border: '1px solid rgba(29,184,126,0.2)',
    borderRadius: 'var(--radius-lg)', padding: '16px 20px',
  },
  liveHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  liveDot: {
    width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)',
    animation: 'pulse 1.5s infinite',
  },
  liveTitle: { fontSize: 13, fontWeight: 700, color: 'var(--accent-green)' },
  liveUpdated: { fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' },
  liveAddr: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 },
  mapLink: { display: 'inline-block', marginTop: 10, fontSize: 12, color: 'var(--accent-orange)', fontWeight: 600, textDecoration: 'none' },
  infoCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '20px 24px',
  },
  cardTitle: { fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 },
  infoGrid: {},
  routeDisplay: { display: 'flex', flexDirection: 'column' },
  routeItem: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  routeDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 4 },
  routeVertLine: { width: 2, height: 24, background: 'var(--border)', marginLeft: 4, marginTop: 4, marginBottom: 4 },
  routeType: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  routeAddr: { fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 2 },
  routeTime: { fontSize: 12, color: 'var(--text-muted)' },
  timeline: { display: 'flex', flexDirection: 'column', gap: 0 },
  timelineItem: { display: 'flex', gap: 14, paddingBottom: 16 },
  timelineItemActive: {},
  timelineDot: { width: 10, height: 10, borderRadius: '50%', background: 'var(--border)', flexShrink: 0, marginTop: 4 },
  timelineDotActive: { background: 'var(--accent-orange)', animation: 'pulse 2s infinite' },
  timelineContent: { flex: 1 },
  timelineMsg: { fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 4 },
  timelineLoc: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 },
  timelineTime: { fontSize: 11, color: 'var(--text-muted)' },
};
