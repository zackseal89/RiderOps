'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Rider, Zone } from '@/lib/types';

function RiderAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return <div className="rider-avatar">{initials}</div>;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge badge-${status}`}>
      {status === 'available' ? '🟢' : status === 'busy' ? '🟡' : '⚫'} {status}
    </span>
  );
}

function VehicleIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    motorcycle: '🏍️',
    bicycle: '🚲',
    car: '🚗',
    van: '🚐',
  };
  return <span>{icons[type] ?? '🚗'}</span>;
}

// ── Add Rider Modal ────────────────────────────────────────────────────────────
function AddRiderModal({
  zones,
  onClose,
  onSuccess,
}: {
  zones: Zone[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    vehicle_type: 'motorcycle',
    zone_id: '',
    national_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/riders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to add rider');
      }
      onSuccess();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">➕ Register New Rider</div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              required
              placeholder="e.g. John Kamau"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Phone Number *</label>
            <input
              required
              placeholder="07XX XXX XXX"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Email (for Shipday app login)</label>
            <input
              type="email"
              placeholder="rider@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Required so rider can log into the Shipday mobile app
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Vehicle Type</label>
              <select
                value={form.vehicle_type}
                onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
              >
                <option value="motorcycle">🏍️ Motorcycle</option>
                <option value="bicycle">🚲 Bicycle</option>
                <option value="car">🚗 Car</option>
                <option value="van">🚐 Van</option>
              </select>
            </div>

            <div className="form-group">
              <label>Zone</label>
              <select
                value={form.zone_id}
                onChange={(e) => setForm({ ...form, zone_id: e.target.value })}
              >
                <option value="">Select zone…</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>National ID Number</label>
            <input
              placeholder="Optional — for verification"
              value={form.national_id}
              onChange={(e) => setForm({ ...form, national_id: e.target.value })}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#EF4444',
              fontSize: 13,
            }}>
              ⚠️ {error}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Registering…</> : '✓ Register Rider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ridersRes, zonesRes] = await Promise.all([
        fetch('/api/riders'),
        fetch('/api/zones'),
      ]);
      if (ridersRes.ok) {
        const data = await ridersRes.json();
        setRiders(data.riders ?? []);
      }
      if (zonesRes.ok) {
        const data = await zonesRes.json();
        setZones(data.zones ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statusCounts = {
    available: riders.filter((r) => r.status === 'available').length,
    busy: riders.filter((r) => r.status === 'busy').length,
    offline: riders.filter((r) => r.status === 'offline').length,
  };

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-title">Riders</span>
          <span className="topbar-sub">
            {riders.length} registered ·{' '}
            <span style={{ color: 'var(--accent)' }}>{statusCounts.available} available</span>
            {' '}· {statusCounts.busy} busy · {statusCounts.offline} offline
          </span>
        </div>
        <div className="topbar-right">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            ➕ Add Rider
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Info banner */}
        <div style={{
          background: 'rgba(37,99,235,0.08)',
          border: '1px solid rgba(37,99,235,0.2)',
          borderRadius: 'var(--radius)',
          padding: '14px 18px',
          marginBottom: 20,
          fontSize: 13,
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}>
          <span style={{ fontSize: 18, marginTop: -1 }}>📱</span>
          <div>
            <strong style={{ color: 'var(--text)' }}>Riders use the Shipday mobile app</strong> — once registered here, they receive an email invitation to download Shipday on iOS or Android.
            Their GPS location, delivery status, and proof-of-delivery photos all flow back automatically.
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : riders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏍️</div>
            <div className="empty-state-title">No riders yet</div>
            <div className="empty-state-desc">
              Click "Add Rider" to register your first delivery rider.
              They'll receive an email to join Shipday.
            </div>
          </div>
        ) : (
          <div className="rider-grid">
            {riders.map((rider) => (
              <div key={rider.id} className="rider-card">
                <div className="flex items-center gap-3">
                  <RiderAvatar name={rider.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="rider-name truncate">{rider.name}</div>
                    <div className="rider-meta">{rider.phone}</div>
                  </div>
                  <StatusBadge status={rider.status} />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  fontSize: 12,
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Vehicle</span>
                    <div className="font-medium" style={{ marginTop: 2 }}>
                      <VehicleIcon type={rider.vehicle_type} /> {rider.vehicle_type}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Zone</span>
                    <div className="font-medium" style={{ marginTop: 2 }}>
                      {rider.zone?.name ?? (
                        <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Deliveries</span>
                    <div className="font-bold" style={{ marginTop: 2, fontSize: 18 }}>
                      {rider.total_deliveries}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Shipday</span>
                    <div className="font-medium" style={{ marginTop: 2 }}>
                      {rider.shipday_driver_id ? (
                        <span style={{ color: 'var(--accent)', fontSize: 12 }}>✓ Linked</span>
                      ) : (
                        <span style={{ color: 'var(--warning)', fontSize: 12 }}>⚠ No email</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddRiderModal
          zones={zones}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchData();
          }}
        />
      )}
    </>
  );
}
