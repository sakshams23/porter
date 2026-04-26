import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const SIZES = [
  { id: 'small', label: 'Small', desc: 'Envelopes, small boxes', icon: '▫', price: '₹50+' },
  { id: 'medium', label: 'Medium', desc: 'Shoes, books, gadgets', icon: '◻', price: '₹100+' },
  { id: 'large', label: 'Large', desc: 'Clothing, appliances', icon: '◼', price: '₹180+' },
  { id: 'extra-large', label: 'XL', desc: 'Furniture, bulk items', icon: '■', price: '₹280+' },
];

const STEPS = ['Package', 'Pickup', 'Dropoff', 'Review'];

export default function NewOrder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    packageDescription: '',
    packageWeight: '',
    packageSize: 'medium',
    isFragile: false,
    pickupLocation: { address: '', lat: null, lng: null, landmark: '' },
    pickupSchedule: '',
    pickupContactName: '',
    pickupContactPhone: '',
    dropoffLocation: { address: '', lat: null, lng: null, landmark: '' },
    dropoffContactName: '',
    dropoffContactPhone: '',
  });

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const setLoc = (type, field, value) => setForm(f => ({
    ...f, [type]: { ...f[type], [field]: value }
  }));

  const getLocation = (type) => {
    setLocating(type);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
          .then(r => r.json())
          .then(data => {
            setForm(f => ({
              ...f, [type]: { ...f[type], lat: latitude, lng: longitude, address: data.display_name || `${latitude}, ${longitude}` }
            }));
          })
          .catch(() => {
            setForm(f => ({ ...f, [type]: { ...f[type], lat: latitude, lng: longitude, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` } }));
          })
          .finally(() => setLocating(''));
      },
      (err) => { setError('Could not get location. Please enter manually.'); setLocating(''); }
    );
  };

  const submit = async () => {
    setLoading(true); setError('');
    try {
      const order = await API.post('/orders', form);
      navigate(`/track/${order.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const canNext = () => {
    if (step === 0) return form.packageDescription && form.packageSize;
    if (step === 1) return form.pickupLocation.address && form.pickupSchedule;
    if (step === 2) return form.dropoffLocation.address;
    return true;
  };

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.content}>
        {/* Header */}
        <div style={s.header}>
          <button onClick={() => navigate('/dashboard')} style={s.back}>← Back</button>
          <h1 style={s.title}>New Delivery</h1>
        </div>

        {/* Progress */}
        <div style={s.progress}>
          {STEPS.map((step_label, i) => (
            <React.Fragment key={i}>
              <div style={s.stepItem}>
                <div style={{ ...s.stepCircle, ...(i <= step ? s.stepCircleActive : {}) }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span style={{ ...s.stepLabel, ...(i === step ? s.stepLabelActive : {}) }}>{step_label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ ...s.stepLine, ...(i < step ? s.stepLineActive : {}) }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form card */}
        <div style={s.card}>
          {error && <div style={s.error}><span>⚠</span> {error}</div>}

          {/* Step 0: Package Details */}
          {step === 0 && (
            <div style={s.stepContent}>
              <h2 style={s.stepTitle}>Package Details</h2>
              <p style={s.stepDesc}>Tell us about what you're sending</p>

              <FormGroup label="Package Description *">
                <input
                  style={s.input} value={form.packageDescription}
                  onChange={e => set('packageDescription', e.target.value)}
                  placeholder="e.g. Documents, Electronics, Clothes..."
                />
              </FormGroup>

              <FormGroup label="Weight (optional)">
                <input
                  style={s.input} value={form.packageWeight}
                  onChange={e => set('packageWeight', e.target.value)}
                  placeholder="e.g. 2 kg"
                />
              </FormGroup>

              <FormGroup label="Package Size *">
                <div style={s.sizeGrid}>
                  {SIZES.map(size => (
                    <button
                      key={size.id} type="button"
                      onClick={() => set('packageSize', size.id)}
                      style={{ ...s.sizeCard, ...(form.packageSize === size.id ? s.sizeCardActive : {}) }}
                    >
                      <span style={s.sizeIcon}>{size.icon}</span>
                      <span style={s.sizeName}>{size.label}</span>
                      <span style={s.sizeDesc}>{size.desc}</span>
                      <span style={s.sizePrice}>{size.price}</span>
                    </button>
                  ))}
                </div>
              </FormGroup>

              <div style={s.checkRow}>
                <input type="checkbox" id="fragile" checked={form.isFragile} onChange={e => set('isFragile', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--accent-orange)', cursor: 'pointer' }} />
                <label htmlFor="fragile" style={s.checkLabel}>
                  <span>🔺</span> Mark as Fragile — extra care will be taken
                </label>
              </div>
            </div>
          )}

          {/* Step 1: Pickup */}
          {step === 1 && (
            <div style={s.stepContent}>
              <h2 style={s.stepTitle}>Pickup Details</h2>
              <p style={s.stepDesc}>Where should we pick the package from?</p>

              <FormGroup label="Pickup Address *">
                <div style={s.locationRow}>
                  <textarea
                    style={{ ...s.input, ...s.textarea }} value={form.pickupLocation.address}
                    onChange={e => setLoc('pickupLocation', 'address', e.target.value)}
                    placeholder="Enter full pickup address"
                  />
                  <button type="button" onClick={() => getLocation('pickupLocation')} style={s.locBtn} disabled={locating === 'pickupLocation'}>
                    {locating === 'pickupLocation' ? <span style={s.miniSpinner} /> : '⊕'}
                    {locating === 'pickupLocation' ? 'Getting...' : 'Use GPS'}
                  </button>
                </div>
              </FormGroup>

              <FormGroup label="Landmark (optional)">
                <input style={s.input} value={form.pickupLocation.landmark} onChange={e => setLoc('pickupLocation', 'landmark', e.target.value)} placeholder="Near school, mall, etc." />
              </FormGroup>

              <FormGroup label="Pickup Schedule *">
                <input
                  type="datetime-local" style={s.input}
                  value={form.pickupSchedule}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={e => set('pickupSchedule', e.target.value)}
                />
              </FormGroup>

              <div style={s.twoCol}>
                <FormGroup label="Contact Name">
                  <input style={s.input} value={form.pickupContactName} onChange={e => set('pickupContactName', e.target.value)} placeholder="Sender name" />
                </FormGroup>
                <FormGroup label="Contact Phone">
                  <input style={s.input} value={form.pickupContactPhone} onChange={e => set('pickupContactPhone', e.target.value)} placeholder="+91 98765..." />
                </FormGroup>
              </div>
            </div>
          )}

          {/* Step 2: Dropoff */}
          {step === 2 && (
            <div style={s.stepContent}>
              <h2 style={s.stepTitle}>Delivery Details</h2>
              <p style={s.stepDesc}>Where should we deliver the package?</p>

              <FormGroup label="Delivery Address *">
                <div style={s.locationRow}>
                  <textarea
                    style={{ ...s.input, ...s.textarea }} value={form.dropoffLocation.address}
                    onChange={e => setLoc('dropoffLocation', 'address', e.target.value)}
                    placeholder="Enter full delivery address"
                  />
                  <button type="button" onClick={() => getLocation('dropoffLocation')} style={s.locBtn} disabled={locating === 'dropoffLocation'}>
                    {locating === 'dropoffLocation' ? <span style={s.miniSpinner} /> : '⊕'}
                    {locating === 'dropoffLocation' ? 'Getting...' : 'Use GPS'}
                  </button>
                </div>
              </FormGroup>

              <FormGroup label="Landmark (optional)">
                <input style={s.input} value={form.dropoffLocation.landmark} onChange={e => setLoc('dropoffLocation', 'landmark', e.target.value)} placeholder="Near landmark, gate no., etc." />
              </FormGroup>

              <div style={s.twoCol}>
                <FormGroup label="Recipient Name">
                  <input style={s.input} value={form.dropoffContactName} onChange={e => set('dropoffContactName', e.target.value)} placeholder="Recipient name" />
                </FormGroup>
                <FormGroup label="Recipient Phone">
                  <input style={s.input} value={form.dropoffContactPhone} onChange={e => set('dropoffContactPhone', e.target.value)} placeholder="+91 98765..." />
                </FormGroup>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div style={s.stepContent}>
              <h2 style={s.stepTitle}>Review Your Order</h2>
              <p style={s.stepDesc}>Confirm the details before placing your order</p>

              <div style={s.reviewGrid}>
                <ReviewSection title="📦 Package" items={[
                  ['Description', form.packageDescription],
                  ['Size', form.packageSize],
                  ['Weight', form.packageWeight || '—'],
                  ['Fragile', form.isFragile ? 'Yes ⚠' : 'No'],
                ]} />
                <ReviewSection title="📍 Pickup" items={[
                  ['Address', form.pickupLocation.address],
                  ['Landmark', form.pickupLocation.landmark || '—'],
                  ['Scheduled', form.pickupSchedule ? new Date(form.pickupSchedule).toLocaleString() : '—'],
                  ['Contact', form.pickupContactName || '—'],
                  ['Phone', form.pickupContactPhone || '—'],
                ]} />
                <ReviewSection title="🏁 Dropoff" items={[
                  ['Address', form.dropoffLocation.address],
                  ['Landmark', form.dropoffLocation.landmark || '—'],
                  ['Recipient', form.dropoffContactName || '—'],
                  ['Phone', form.dropoffContactPhone || '—'],
                ]} />
              </div>

              <div style={s.priceEstimate}>
                <span style={s.priceLabel}>Estimated Price</span>
                <span style={s.priceValue}>₹{SIZES.find(s => s.id === form.packageSize)?.price}</span>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div style={s.navBtns}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} style={s.prevBtn}>← Previous</button>
            )}
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} style={{ ...s.nextBtn, ...(!canNext() ? s.btnDisabled : {}) }}>
                Next Step →
              </button>
            ) : (
              <button onClick={submit} disabled={loading} style={s.nextBtn}>
                {loading ? <span style={s.miniSpinner} /> : null}
                {loading ? 'Placing Order...' : '✓ Place Order'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

function ReviewSection({ title, items }) {
  return (
    <div style={s.reviewSection}>
      <h4 style={s.reviewSectionTitle}>{title}</h4>
      {items.map(([k, v], i) => (
        <div key={i} style={s.reviewRow}>
          <span style={s.reviewKey}>{k}</span>
          <span style={s.reviewVal}>{v}</span>
        </div>
      ))}
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg-primary)' },
  content: { maxWidth: 760, margin: '0 auto', padding: '40px 24px' },
  header: { display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 },
  back: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 15, fontFamily: 'var(--font-body)' },
  title: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' },
  progress: { display: 'flex', alignItems: 'center', marginBottom: 36 },
  stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  stepCircle: {
    width: 36, height: 36, borderRadius: '50%',
    background: 'var(--bg-tertiary)', border: '2px solid var(--border)',
    color: 'var(--text-muted)', fontSize: 14, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all var(--transition)',
  },
  stepCircleActive: { background: 'var(--accent-orange)', border: '2px solid var(--accent-orange)', color: 'white' },
  stepLabel: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' },
  stepLabelActive: { color: 'var(--accent-orange)', fontWeight: 700 },
  stepLine: { flex: 1, height: 2, background: 'var(--border)', marginBottom: 18, transition: 'background var(--transition)' },
  stepLineActive: { background: 'var(--accent-orange)' },
  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)', padding: 36, boxShadow: 'var(--shadow-md)',
    animation: 'fadeUp 0.4s ease',
  },
  error: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
    color: 'var(--accent-red)', padding: '12px 16px', borderRadius: 'var(--radius-sm)',
    fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
  },
  stepContent: {},
  stepTitle: { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 },
  stepDesc: { fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  input: {
    width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--border)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: 15, fontFamily: 'var(--font-body)',
    outline: 'none', transition: 'border-color var(--transition)',
  },
  textarea: { minHeight: 80, resize: 'vertical' },
  sizeGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  sizeCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    padding: '16px 8px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)',
    background: 'var(--bg-secondary)', cursor: 'pointer', transition: 'all var(--transition)',
  },
  sizeCardActive: { borderColor: 'var(--accent-orange)', background: 'var(--accent-orange-dim)' },
  sizeIcon: { fontSize: 22, marginBottom: 4 },
  sizeName: { fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' },
  sizeDesc: { fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' },
  sizePrice: { fontSize: 12, color: 'var(--accent-orange)', fontWeight: 600 },
  checkRow: { display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 },
  checkLabel: { fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
  locationRow: { display: 'flex', gap: 10 },
  locBtn: {
    flexShrink: 0, padding: '0 16px', border: '1.5px solid var(--accent-orange)',
    borderRadius: 'var(--radius-sm)', background: 'var(--accent-orange-dim)',
    color: 'var(--accent-orange)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 4, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', minWidth: 80,
  },
  miniSpinner: {
    width: 14, height: 14, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid currentColor',
    animation: 'spin 0.7s linear infinite', display: 'inline-block',
  },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  reviewGrid: { display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 },
  reviewSection: {
    background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
    padding: '18px 20px', border: '1px solid var(--border)',
  },
  reviewSectionTitle: { fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 },
  reviewRow: { display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)', marginBottom: 8, gap: 12, flexWrap: 'wrap' },
  reviewKey: { fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 },
  reviewVal: { fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right', maxWidth: '60%' },
  priceEstimate: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'var(--accent-orange-dim)', border: '1px solid rgba(255,92,26,0.2)',
    borderRadius: 'var(--radius-md)', padding: '16px 20px',
  },
  priceLabel: { fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 },
  priceValue: { fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--accent-orange)' },
  navBtns: { display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 12 },
  prevBtn: {
    background: 'none', border: '1.5px solid var(--border)', cursor: 'pointer',
    padding: '14px 24px', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600,
    color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', transition: 'all var(--transition)',
  },
  nextBtn: {
    marginLeft: 'auto', background: 'var(--accent-orange)', color: 'white', border: 'none',
    padding: '14px 28px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
    fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
    boxShadow: 'var(--shadow-orange)', display: 'flex', alignItems: 'center', gap: 8,
    transition: 'all var(--transition)',
  },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed', boxShadow: 'none' },
};
