'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, RefreshCw, Bike, Car, Users } from 'lucide-react';
import type { Rider, Zone } from '@/lib/types';
import { useToast } from '@/components/Toast';

// ── Sub-components ────────────────────────────────────────────────────────────

function RiderAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  return <div className="rider-avatar">{initials}</div>;
}

const VEHICLE_ICONS: Record<string, string> = {
  motorcycle: '🏍️',
  bicycle: '🚲',
  car: '🚗',
  van: '🚐',
};

const STATUS_CYCLE: Record<string, string> = {
  available: 'offline',
  offline: 'available',
  busy: 'available',
};

function StatusToggle({
  riderId,
  current,
  onChange,
}: {
  riderId: string;
  current: string;
  onChange: (updated: Rider) => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const cycle = async () => {
    const next = STATUS_CYCLE[current] ?? 'offline';
    setLoading(true);
    try {
      const res = await fetch(`/api/riders/${riderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      const updated: Rider = await res.json();
      onChange(updated);
      toast(`Rider set to ${next}`, 'success');
    } catch {
      toast('Failed to update rider status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const colors: Record<string, string> = {
    available: 'var(--accent)',
    busy: 'var(--warning)',
    offline: 'var(--text-muted)',
    suspended: 'var(--danger)',
  };

  return (
    <button
      onClick={(e) => { e.stopPropagation(); cycle(); }}
      disabled={loading || current === 'suspended'}
      className="btn btn-ghost btn-xs"
      title={current === 'suspended' ? 'Suspended' : `Click to set ${STATUS_CYCLE[current] ?? current}`}
      style={{ gap: 5 }}
    >
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: colors[current] ?? 'var(--text-muted)',
        display: 'inline-block', flexShrink: 0,
      }} />
      {loading ? '…' : current}
    </button>
  );
}

// ── Add Rider Modal ───────────────────────────────────────────────────────────

function AddRiderModal({
  zones,
  onClose,
  onSuccess,
}: {
  zones: Zone[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '', phone: '', email: '', vehicle_type: 'motorcycle', zone_id: '', national_id: '',
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
      toast(`${form.name} registered successfully`, 'success');
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
        <div className="modal-title">
          <div className="flex items-center gap-2">
            <Bike size={16} style={{ color: 'var(--primary-light)' }} />
            Register New Rider
          </div>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input required placeholder="e.g. John Kamau" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="form-group">
            <label>Phone Number *</label>
            <input required placeholder="07XX XXX XXX" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>

          <div className="form-group">
            <label>Email (for Shipday app login)</label>
            <input type="email" placeholder="rider@example.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Required so rider can log into the Shipday mobile app
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Vehicle Type</label>
              <select value={form.vehicle_type}
                onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}>
                <option value="motorcycle">🏍️ Motorcycle</option>
                <option value="bicycle">🚲 Bicycle</option>
                <option value="car">🚗 Car</option>
                <option value="van">🚐 Van</option>
              </select>
            </div>
            <div className="form-group">
              <label>Zone</label>
              <select value={form.zone_id}
                onChange={(e) => setForm({ ...form, zone_id: e.target.value })}>
                <option value="">Select zone…</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>National ID</label>
            <input placeholder="Optional — for verification" value={form.national_id}
              onChange={(e) => setForm({ ...form, national_id: e.target.value })} />
          </div>

          {error && (
            <div className="error-banner">⚠ {error.replace(/^Error:\s*/, '')}</div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
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
  const { toast } = useToast();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [ridersRes, zonesRes] = await Promise.all([
        fetch('/api/riders'),
        fetch('/api/zones'),
      ]);
      if (ridersRes.ok) setRiders((await ridersRes.json()).riders ?? []);
      if (zonesRes.ok) setZones((await zonesRes.json()).zones ?? []);
    } catch {
      toast('Failed to load riders', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRiderUpdated = (updated: Rider) => {
    setRiders(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
  };

  const counts = {
    available: riders.filter(r => r.status === 'available').length,
    busy:      riders.filter(r => r.status === 'busy').length,
    offline:   riders.filter(r => r.status === 'offline').length,
  };

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-title">Riders</span>
          <span className="topbar-sub">
            {riders.length} registered ·{' '}
            <span style={{ color: 'var(--accent)' }}>{counts.available} available</span>
            {' '}· {counts.busy} busy · {counts.offline} offline
          </span>
        </div>
        <div className="topbar-right">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            aria-label="Refresh"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Add Rider
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Info Banner */}
        <div className="info-banner blue">
          <Bike size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong style={{ color: 'var(--text)' }}>Riders use the Shipday mobile app</strong> — once
            registered here with an email, they receive an invitation to download Shipday on iOS or Android.
            Their GPS location and delivery status sync back automatically.
          </div>
        </div>

        {loading ? (
          <div className="rider-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rider-card">
                <div className="flex items-center gap-3">
                  <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: 110, height: 13 }} />
                    <div className="skeleton" style={{ width: 80, height: 10, marginTop: 6 }} />
                  </div>
                  <div className="skeleton" style={{ width: 60, height: 20, borderRadius: 999 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j}>
                      <div className="skeleton" style={{ width: 50, height: 10 }} />
                      <div className="skeleton" style={{ width: 70, height: 12, marginTop: 4 }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : riders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={22} style={{ color: 'var(--text-muted)' }} /></div>
            <div className="empty-state-title">No riders yet</div>
            <div className="empty-state-desc">
              Click "Add Rider" to register your first delivery rider.
              They'll receive an email to join Shipday.
            </div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
              <Plus size={14} /> Add First Rider
            </button>
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
                  <StatusToggle
                    riderId={rider.id}
                    current={rider.status}
                    onChange={handleRiderUpdated}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Vehicle</span>
                    <div className="font-medium" style={{ marginTop: 2 }}>
                      {VEHICLE_ICONS[rider.vehicle_type]} {rider.vehicle_type}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Zone</span>
                    <div className="font-medium" style={{ marginTop: 2 }}>
                      {rider.zone?.name ?? <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
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
          onSuccess={() => { setShowModal(false); fetchData(); }}
        />
      )}
    </>
  );
}
