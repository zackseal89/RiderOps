'use client';

import { useState, useEffect } from 'react';
import { X, Bike, Check } from 'lucide-react';
import type { Rider, Order } from '@/lib/types';
import { useToast } from './Toast';

interface Props {
  order: Order;
  onClose: () => void;
  onAssigned: (updatedOrder: Order) => void;
}

const VEHICLE_ICONS: Record<string, string> = {
  motorcycle: '🏍️',
  bicycle: '🚲',
  car: '🚗',
  van: '🚐',
};

export default function AssignRiderModal({ order, onClose, onAssigned }: Props) {
  const { toast } = useToast();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/riders')
      .then(r => r.json())
      .then(d => setRiders((d.riders ?? []).filter((r: Rider) => r.status === 'available')))
      .catch(() => toast('Failed to load riders', 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  const handleAssign = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rider_id: selected }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Assignment failed');
      }
      // Fetch updated order
      const ordersRes = await fetch(`/api/orders?limit=1&offset=0`);
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        const updated = (data.orders ?? []).find((o: Order) => o.id === order.id);
        if (updated) onAssigned(updated);
      }
      toast('Rider assigned successfully', 'success');
      onClose();
    } catch (err) {
      toast(String(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-title">
          <div className="flex items-center gap-2">
            <Bike size={16} style={{ color: 'var(--primary-light)' }} />
            Assign Rider to #{order.shopify_order_number}
          </div>
          <button
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120 }}>
          {loading ? (
            <div className="loading-center" style={{ padding: 32 }}>
              <div className="spinner" />
            </div>
          ) : riders.length === 0 ? (
            <div className="empty-state" style={{ padding: '28px 16px' }}>
              <div className="empty-state-icon">🏍️</div>
              <div className="empty-state-title">No available riders</div>
              <div className="empty-state-desc">
                All riders are currently busy or offline.
              </div>
            </div>
          ) : (
            riders.map(rider => {
              const isSelected = selected === rider.id;
              return (
                <button
                  key={rider.id}
                  onClick={() => setSelected(rider.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius)',
                    border: `1px solid ${isSelected ? 'var(--primary-light)' : 'var(--border)'}`,
                    background: isSelected ? 'rgba(37,99,235,0.08)' : 'var(--surface-2)',
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  {/* Avatar */}
                  <div className="rider-avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
                    {rider.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="font-semibold" style={{ fontSize: 13 }}>{rider.name}</div>
                    <div className="text-muted text-sm">
                      {VEHICLE_ICONS[rider.vehicle_type]} {rider.phone}
                      {rider.zone && (
                        <span style={{ marginLeft: 6 }}>· {rider.zone.name}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {rider.total_deliveries} deliveries
                    </span>
                    {isSelected && (
                      <div style={{
                        width: 20, height: 20,
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={12} color="#fff" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!selected || submitting}
            onClick={handleAssign}
          >
            {submitting ? (
              <><span className="spinner" style={{ width: 14, height: 14 }} /> Assigning…</>
            ) : (
              <><Check size={14} /> Assign Rider</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
