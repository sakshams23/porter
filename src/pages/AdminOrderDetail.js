import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const STATUSES = [
  'pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'on_hold'
];

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

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('overview');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Status update form
  const [newStatus, setNewStatus] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [stopReason, setStopReason] = useState('');

  // Location update form
  const [locAddr, setLocAddr] = useState('');
  const [locLat, setLocLat] = useState('');
  const [locLng, setLocLng] = useState('');

  // Edit form
  const [editData, setEditData] = useState({});
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    API.get(`/admin/orders/${id}`)
      .then(({ data }) => {
        setOrder(data);
        setNewStatus(data.status);
        setEditData({
          packageDescription: data.packageDescription,
          packageWeight: data.packageWeight || '',
          assignedDriver: data.assignedDriver || '',
          adminNotes: data.adminNotes || '',
          price: data.price || 0,
        });
      })
      .catch(() => navigate('/admin'))
      .finally(() => setLoading(false));
  }, [id]);

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };
  const showError = (msg) => { setError(msg); setTimeout(() => setError(''), 4000); };

  const updateStatus = async () => {
    setSaving(true);
    try {
      const { data } = await API.put(`/admin/orders/${id}/status`, {
        status: newStatus, message: statusMsg, reason: stopReason,
      });
      setOrder(data); setStatusMsg(''); setStopReason('');
      showSuccess('Status updated and user notified!');
    } catch (err) { showError(err.response?.data?.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const updateLocation = async () => {
    setSaving(true);
    try {
      await API.put(`/admin/orders/${id}/location`, { address: locAddr, lat: Number(locLat), lng: Number(locLng) });
      showSuccess('Live location updated!');
      setLocAddr(''); setLocLat(''); setLocLng('');
    } catch (err) { showError('Failed to update location'); }
    finally { setSaving(false); }
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const { data } = await API.put(`/admin/orders/${id}`, editData);
      setOrder(data); setEditing(false);
      showSuccess('Order data saved!');
    } catch (err) { showError('Failed to save changes'); }
    finally { setSaving(false); }
  };

  const stopDelivery = async () => {
    if (!stopReason) { showError('Please provide a reason'); return; }
    setSaving(true);
    try {
      const { data } = await API.put(`/admin/orders/${id}/status`, { status: 'on_hold', reason: stopReason, message: `Delivery on hold: ${stopReason}` });
      setOrder(data); showSuccess('Delivery halted. User has been notified.');
    } catch (err) { showError('Failed to stop delivery'); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}><Navbar /></div>;
  if (!order) return null;

  const cfg = STATUS_CONFIG[order.status] || {};

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.content}>
        {/* Header */}
        <div style={s.header}>
          <button onClick={() => navigate('/admin')} style={s.back}>← Back to Dashboard</button>
          <div style={s.headerRight}>
            <span style={s.orderId}>{order.orderId}</span>
            <span style={{ ...s.statusBadge, color: cfg.color, border: `1.5px solid ${cfg.color}30`, background: `${cfg.color}15` }}>{cfg.label}</span>
          </div>
        </div>

        {/* Alerts */}
        {success && <div style={s.successAlert}>✓ {success}</div>}
        {error && <div style={s.errorAlert}>⚠ {error}</div>}

        {/* Warning for sensitive actions */}
        {(order.status === 'in_transit' || order.status === 'out_for_delivery') && (
          <div style={s.warningBanner}>
            <span style={s.warningIcon}>⚠</span>
            <span>This package is currently <strong>in transit</strong>. Use caution when updating status.</span>
          </div>
        )}

        <div style={s.grid}>
          {/* Left: Actions panel */}
          <div style={s.leftCol}>
            {/* Tabs */}
            <div style={s.tabs}>
              {['overview', 'status', 'location', 'edit'].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Overview tab */}
            {tab === 'overview' && (
              <div style={s.panel}>
                <h3 style={s.panelTitle}>Order Overview</h3>
                <Section title="Customer">
                  <Row label="Name" value={order.user?.name || '—'} />
                  <Row label="Email" value={order.user?.email || '—'} />
                  <Row label="Phone" value={order.user?.phone || '—'} />
                </Section>
                <Section title="Package">
                  <Row label="Description" value={order.packageDescription} />
                  <Row label="Size" value={order.packageSize} />
                  <Row label="Weight" value={order.packageWeight || '—'} />
                  <Row label="Fragile" value={order.isFragile ? 'Yes ⚠' : 'No'} />
                  <Row label="Price" value={`₹${order.price}`} />
                  <Row label="Driver" value={order.assignedDriver || 'Not assigned'} />
                </Section>
                <Section title="Schedule">
                  <Row label="Pickup Time" value={order.pickupSchedule ? new Date(order.pickupSchedule).toLocaleString() : '—'} />
                  <Row label="Est. Delivery" value={order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleString() : '—'} />
                  <Row label="Created" value={new Date(order.createdAt).toLocaleString()} />
                </Section>
                {order.adminNotes && (
                  <Section title="Admin Notes">
                    <p style={s.notes}>{order.adminNotes}</p>
                  </Section>
                )}
              </div>
            )}

            {/* Status tab */}
            {tab === 'status' && (
              <div style={s.panel}>
                <h3 style={s.panelTitle}>Update Status</h3>
                <p style={s.panelDesc}>Changes will be instantly pushed to the customer.</p>

                <FormGroup label="New Status">
                  <select style={s.select} value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                    {STATUSES.map(st => (
                      <option key={st} value={st}>{STATUS_CONFIG[st]?.label || st}</option>
                    ))}
                  </select>
                </FormGroup>

                <FormGroup label="Update Message (optional)">
                  <textarea
                    style={{ ...s.input, minHeight: 80, resize: 'vertical' }}
                    value={statusMsg} onChange={e => setStatusMsg(e.target.value)}
                    placeholder="Custom message to send to customer..."
                  />
                </FormGroup>

                <button onClick={updateStatus} disabled={saving} style={s.primaryBtn}>
                  {saving ? 'Updating...' : 'Update Status & Notify →'}
                </button>

                <div style={s.divider} />

                {/* Stop delivery */}
                <div style={s.dangerZone}>
                  <h4 style={s.dangerTitle}>⏸ Stop / Hold Delivery</h4>
                  <p style={s.dangerDesc}>Immediately halt this delivery and notify the customer.</p>
                  <FormGroup label="Reason for Hold *">
                    <input style={s.input} value={stopReason} onChange={e => setStopReason(e.target.value)} placeholder="e.g. Address verification needed..." />
                  </FormGroup>
                  <button onClick={stopDelivery} disabled={saving} style={s.dangerBtn}>
                    ⏸ Stop Delivery Now
                  </button>
                </div>
              </div>
            )}

            {/* Location tab */}
            {tab === 'location' && (
              <div style={s.panel}>
                <h3 style={s.panelTitle}>Update Live Location</h3>
                <p style={s.panelDesc}>Push real-time location to the customer's tracking page.</p>

                <FormGroup label="Current Address">
                  <input style={s.input} value={locAddr} onChange={e => setLocAddr(e.target.value)} placeholder="e.g. MG Road, Bangalore" />
                </FormGroup>
                <div style={s.twoCol}>
                  <FormGroup label="Latitude">
                    <input style={s.input} value={locLat} onChange={e => setLocLat(e.target.value)} placeholder="12.9716" />
                  </FormGroup>
                  <FormGroup label="Longitude">
                    <input style={s.input} value={locLng} onChange={e => setLocLng(e.target.value)} placeholder="77.5946" />
                  </FormGroup>
                </div>
                <button onClick={updateLocation} disabled={saving || !locAddr} style={s.primaryBtn}>
                  {saving ? 'Updating...' : '📡 Push Live Location'}
                </button>

                {order.currentLocation && (
                  <div style={s.currentLocBox}>
                    <div style={s.currentLocTitle}>Current Stored Location</div>
                    <div style={s.currentLocAddr}>{order.currentLocation.address}</div>
                    {order.currentLocation.lat && <div style={s.currentLocCoords}>{order.currentLocation.lat}, {order.currentLocation.lng}</div>}
                  </div>
                )}
              </div>
            )}

            {/* Edit tab */}
            {tab === 'edit' && (
              <div style={s.panel}>
                <div style={s.editHeader}>
                  <h3 style={s.panelTitle}>Edit Order Data</h3>
                  <button onClick={() => setEditing(e => !e)} style={s.editToggle}>{editing ? 'Cancel' : 'Edit'}</button>
                </div>
                <p style={s.panelDesc}>Modify order details. Changes apply immediately.</p>

                <FormGroup label="Package Description">
                  <input style={{ ...s.input, ...(editing ? {} : s.inputDisabled) }} disabled={!editing} value={editData.packageDescription || ''} onChange={e => setEditData(d => ({ ...d, packageDescription: e.target.value }))} />
                </FormGroup>
                <FormGroup label="Weight">
                  <input style={{ ...s.input, ...(editing ? {} : s.inputDisabled) }} disabled={!editing} value={editData.packageWeight || ''} onChange={e => setEditData(d => ({ ...d, packageWeight: e.target.value }))} placeholder="e.g. 2 kg" />
                </FormGroup>
                <FormGroup label="Assigned Driver">
                  <input style={{ ...s.input, ...(editing ? {} : s.inputDisabled) }} disabled={!editing} value={editData.assignedDriver || ''} onChange={e => setEditData(d => ({ ...d, assignedDriver: e.target.value }))} placeholder="Driver name or ID" />
                </FormGroup>
                <FormGroup label="Price (₹)">
                  <input type="number" style={{ ...s.input, ...(editing ? {} : s.inputDisabled) }} disabled={!editing} value={editData.price || ''} onChange={e => setEditData(d => ({ ...d, price: e.target.value }))} />
                </FormGroup>
                <FormGroup label="Admin Notes">
                  <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical', ...(editing ? {} : s.inputDisabled) }} disabled={!editing} value={editData.adminNotes || ''} onChange={e => setEditData(d => ({ ...d, adminNotes: e.target.value }))} placeholder="Internal notes..." />
                </FormGroup>

                {editing && (
                  <button onClick={saveEdit} disabled={saving} style={s.primaryBtn}>
                    {saving ? 'Saving...' : '✓ Save Changes'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: Tracking timeline */}
          <div style={s.rightCol}>
            <div style={s.timelineCard}>
              <h3 style={s.panelTitle}>Tracking Timeline</h3>
              <div style={s.timeline}>
                {[...(order.trackingEvents || [])].reverse().map((ev, i) => (
                  <div key={i} style={s.timelineItem}>
                    <div style={{ ...s.timelineDot, ...(i === 0 ? s.timelineDotActive : {}) }} />
                    <div style={s.timelineBody}>
                      <div style={{ ...s.evStatus, color: STATUS_CONFIG[ev.status]?.color || 'var(--text-muted)' }}>{STATUS_CONFIG[ev.status]?.label || ev.status}</div>
                      <div style={s.evMsg}>{ev.message}</div>
                      {ev.location && <div style={s.evLoc}>📍 {ev.location}</div>}
                      <div style={s.evTime}>{new Date(ev.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
                {(!order.trackingEvents || order.trackingEvents.length === 0) && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No tracking events yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{title}</div>
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );
}

function FormGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg-primary)' },
  content: { maxWidth: 1200, margin: '0 auto', padding: '40px 24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  back: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 15, fontFamily: 'var(--font-body)' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  orderId: { fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 1.5 },
  statusBadge: { padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 700 },
  successAlert: { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: 14, marginBottom: 16 },
  errorAlert: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: 14, marginBottom: 16 },
  warningBanner: { background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b', padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 },
  warningIcon: { fontSize: 16, flexShrink: 0 },
  grid: { display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24 },
  leftCol: {},
  rightCol: {},
  tabs: { display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 4, gap: 4, marginBottom: 16 },
  tab: { flex: 1, padding: '9px', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', background: 'none', transition: 'all var(--transition)' },
  tabActive: { background: 'var(--accent-orange)', color: 'white' },
  panel: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' },
  panelTitle: { fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 },
  panelDesc: { fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 },
  notes: { fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, padding: '10px 14px' },
  input: { width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none' },
  inputDisabled: { opacity: 0.6, cursor: 'not-allowed', background: 'var(--bg-tertiary)' },
  select: { width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer' },
  primaryBtn: { width: '100%', padding: '13px', background: 'var(--accent-orange)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, boxShadow: 'var(--shadow-orange)', transition: 'all var(--transition)' },
  divider: { height: 1, background: 'var(--border)', margin: '24px 0' },
  dangerZone: { background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--radius-md)', padding: 18 },
  dangerTitle: { fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#ef4444', marginBottom: 6 },
  dangerDesc: { fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 },
  dangerBtn: { width: '100%', padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, transition: 'all var(--transition)' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  currentLocBox: { marginTop: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' },
  currentLocTitle: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 },
  currentLocAddr: { fontSize: 13, color: 'var(--text-primary)' },
  currentLocCoords: { fontSize: 11, color: 'var(--text-muted)', marginTop: 4 },
  editHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  editToggle: { background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' },
  timelineCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' },
  timeline: { display: 'flex', flexDirection: 'column', gap: 20 },
  timelineItem: { display: 'flex', gap: 14 },
  timelineDot: { width: 10, height: 10, borderRadius: '50%', background: 'var(--border)', flexShrink: 0, marginTop: 4 },
  timelineDotActive: { background: 'var(--accent-orange)', animation: 'pulse 2s infinite' },
  timelineBody: { flex: 1 },
  evStatus: { fontSize: 12, fontWeight: 700, marginBottom: 4 },
  evMsg: { fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 },
  evLoc: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 },
  evTime: { fontSize: 11, color: 'var(--text-muted)' },
};
