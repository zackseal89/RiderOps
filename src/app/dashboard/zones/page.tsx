'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Zone } from '@/lib/types';

function ZoneColorDot({ color }: { color: string }) {
  return (
    <span style={{
      width: 12,
      height: 12,
      borderRadius: '50%',
      background: color,
      display: 'inline-block',
      flexShrink: 0,
    }} />
  );
}

function AddZoneModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: '',
    slug: '',
    town: '',
    delivery_fee_kes: 200,
    color: '#3B82F6',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNameChange = (name: string) => {
    setForm({
      ...form,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      town: form.town || name,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, is_active: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to create zone');
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
        <div className="modal-title">🗺️ Add Delivery Zone</div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Zone Name *</label>
            <input
              required
              placeholder="e.g. Westlands, Mombasa CBD"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Town / City *</label>
            <input
              required
              placeholder="e.g. Nairobi, Mombasa, Kisumu"
              value={form.town}
              onChange={(e) => setForm({ ...form, town: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Delivery Fee (KES)</label>
              <input
                type="number"
                min={0}
                value={form.delivery_fee_kes}
                onChange={(e) => setForm({ ...form, delivery_fee_kes: parseInt(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Zone Color</label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                style={{ height: 40, cursor: 'pointer' }}
              />
            </div>
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
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding…' : '✓ Add Zone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/zones');
      if (res.ok) {
        const data = await res.json();
        setZones(data.zones ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  const toggleZone = async (zone: Zone) => {
    await fetch(`/api/zones/${zone.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !zone.is_active }),
    });
    fetchZones();
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-title">Delivery Zones</span>
          <span className="topbar-sub">
            Define which towns your riders cover (last-mile) vs. courier partners (long-distance)
          </span>
        </div>
        <div className="topbar-right">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            ➕ Add Zone
          </button>
        </div>
      </div>

      <div className="page-content">
        <div style={{
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 'var(--radius)',
          padding: '14px 18px',
          marginBottom: 20,
          fontSize: 13,
          color: 'var(--text-secondary)',
          display: 'flex',
          gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>🧭</span>
          <div>
            <strong style={{ color: 'var(--text)' }}>How routing works:</strong> When a Shopify order arrives,
            the delivery address is checked against your active zone towns. If matched → sent to Shipday (your riders).
            If not matched → automatically booked with Fargo, Pickup Mtaani, or G4S.
          </div>
        </div>

        <div className="table-card">
          <div className="table-header">
            <span className="table-title">Zones ({zones.length})</span>
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Zone Name</th>
                    <th>Town</th>
                    <th>Delivery Fee</th>
                    <th>Routing</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((zone) => (
                    <tr key={zone.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <ZoneColorDot color={zone.color} />
                          <span className="font-medium">{zone.name}</span>
                        </div>
                      </td>
                      <td>{zone.town}</td>
                      <td className="font-semibold">KES {zone.delivery_fee_kes}</td>
                      <td>
                        {zone.is_active ? (
                          <span className="badge badge-delivered">🏍️ Rider (Shipday)</span>
                        ) : (
                          <span className="badge badge-long_distance">🚚 Courier</span>
                        )}
                      </td>
                      <td>
                        <span className={zone.is_active ? 'badge badge-delivered' : 'badge badge-offline'}>
                          {zone.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => toggleZone(zone)}
                        >
                          {zone.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <AddZoneModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchZones(); }}
        />
      )}
    </>
  );
}
