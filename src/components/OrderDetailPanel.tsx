'use client';

import { useState } from 'react';
import { X, User, Phone, MapPin, Package, Clock, Bike, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { Order, OrderStatus } from '@/lib/types';
import { useToast } from './Toast';
import AssignRiderModal from './AssignRiderModal';

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  rider_accepted: 'Rider Accepted',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

const STATUS_ORDER: OrderStatus[] = [
  'pending',
  'assigned',
  'rider_accepted',
  'picked_up',
  'in_transit',
  'delivered',
];

function statusIndex(s: OrderStatus) {
  const idx = STATUS_ORDER.indexOf(s);
  return idx === -1 ? 0 : idx;
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ color: 'var(--text-muted)', marginTop: 1, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="text-xs text-muted" style={{ marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--text)' }}>{value}</div>
      </div>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────────

interface Props {
  order: Order;
  onClose: () => void;
  onOrderUpdated: (updated: Order) => void;
}

export default function OrderDetailPanel({ order: initialOrder, onClose, onOrderUpdated }: Props) {
  const { toast } = useToast();
  const [order, setOrder] = useState(initialOrder);
  const [showAssign, setShowAssign] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const updateStatus = async (status: OrderStatus) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Update failed');
      }
      const updated: Order = await res.json();
      setOrder(updated);
      onOrderUpdated(updated);
      toast(`Order marked as ${STATUS_LABELS[status]}`, 'success');
    } catch (err) {
      toast(String(err), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const delivery = order.rms_deliveries?.[0];
  const rider = delivery?.rms_riders;
  const currentStatusIndex = statusIndex(order.status as OrderStatus);

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <aside className="side-panel" role="complementary" aria-label="Order details">
        {/* Header */}
        <div className="panel-header">
          <div>
            <div className="panel-title">
              Order #{order.shopify_order_number}
            </div>
            <div className="text-xs text-muted" style={{ marginTop: 2 }}>
              {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm')}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close panel">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="panel-body">
          {/* Status */}
          <div className="panel-section">
            <div className="panel-section-label">Status</div>
            <span className={`badge badge-${order.status}`} style={{ fontSize: 12, padding: '4px 12px' }}>
              <span className={`badge-dot${['assigned', 'rider_accepted', 'picked_up', 'in_transit'].includes(order.status) ? ' pulse' : ''}`}
                style={{ background: 'currentColor' }}
              />
              {STATUS_LABELS[order.status as OrderStatus] ?? order.status}
            </span>
          </div>

          {/* Customer */}
          <div className="panel-section">
            <div className="panel-section-label">Customer</div>
            <DetailRow
              icon={<User size={14} />}
              label="Name"
              value={order.customer_name}
            />
            {order.customer_phone && (
              <DetailRow
                icon={<Phone size={14} />}
                label="Phone"
                value={
                  <a href={`tel:${order.customer_phone}`} style={{ color: 'var(--primary-light)', textDecoration: 'none' }}>
                    {order.customer_phone}
                  </a>
                }
              />
            )}
            <DetailRow
              icon={<MapPin size={14} />}
              label="Delivery Address"
              value={
                <span>
                  {order.delivery_address}
                  {order.delivery_town && (
                    <span className="text-muted"> · {order.delivery_town}</span>
                  )}
                </span>
              }
            />
          </div>

          {/* Delivery Info */}
          <div className="panel-section">
            <div className="panel-section-label">Delivery</div>
            <DetailRow
              icon={order.delivery_type === 'last_mile' ? <Bike size={14} /> : <Truck size={14} />}
              label="Type"
              value={
                <span className={`badge badge-${order.delivery_type}`} style={{ fontSize: 11 }}>
                  {order.delivery_type === 'last_mile' ? '🏍️ Last Mile' : `🚚 ${order.courier_partner ?? 'Long Distance'}`}
                </span>
              }
            />
            {order.courier_tracking_id && (
              <DetailRow
                icon={<Package size={14} />}
                label="Tracking ID"
                value={<span style={{ fontFamily: 'monospace', fontSize: 12 }}>{order.courier_tracking_id}</span>}
              />
            )}
            {order.order_total_kes && (
              <DetailRow
                icon={<Package size={14} />}
                label="Order Total"
                value={<span className="font-semibold">KES {order.order_total_kes.toLocaleString()}</span>}
              />
            )}
          </div>

          {/* Rider */}
          {rider && (
            <div className="panel-section">
              <div className="panel-section-label">Assigned Rider</div>
              <div style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <div className="rider-avatar" style={{ width: 36, height: 36, fontSize: 12, flexShrink: 0 }}>
                  {rider.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-semibold" style={{ fontSize: 13 }}>{rider.name}</div>
                  <div className="text-muted text-sm">{rider.phone}</div>
                </div>
                <span style={{ fontSize: 18, flexShrink: 0 }}>
                  {rider.vehicle_type === 'motorcycle' ? '🏍️' : rider.vehicle_type === 'bicycle' ? '🚲' : '🚗'}
                </span>
              </div>
            </div>
          )}

          {/* Timeline */}
          {order.delivery_type === 'last_mile' && (
            <div className="panel-section">
              <div className="panel-section-label">Timeline</div>
              <div className="timeline">
                {[
                  { key: 'pending',   label: 'Order Created',   time: order.created_at },
                  { key: 'assigned',  label: 'Rider Assigned',  time: delivery?.assigned_at ?? null },
                  { key: 'picked_up', label: 'Picked Up',       time: delivery?.pickup_at ?? null },
                  { key: 'delivered', label: 'Delivered',        time: delivery?.delivered_at ?? null },
                ].map((step, i, arr) => {
                  const stepIdx = statusIndex(step.key as OrderStatus);
                  const isDone = stepIdx < currentStatusIndex || order.status === 'delivered';
                  const isActive = stepIdx === currentStatusIndex && order.status !== 'failed' && order.status !== 'cancelled';

                  return (
                    <div key={step.key} className="timeline-item">
                      <div className="timeline-dot-wrap">
                        <div className={`timeline-dot${isDone ? ' done' : isActive ? ' active' : ''}`} />
                        {i < arr.length - 1 && <div className="timeline-line" />}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-label" style={{ color: isDone || isActive ? 'var(--text)' : 'var(--text-muted)' }}>
                          {step.label}
                        </div>
                        {step.time && (
                          <div className="timeline-time">
                            {format(new Date(step.time), 'dd MMM, HH:mm')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {order.status === 'failed' && (
                  <div className="timeline-item">
                    <div className="timeline-dot-wrap">
                      <div className="timeline-dot" style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }} />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-label" style={{ color: 'var(--danger)' }}>Delivery Failed</div>
                      {delivery?.failed_at && (
                        <div className="timeline-time">{format(new Date(delivery.failed_at), 'dd MMM, HH:mm')}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!['delivered', 'failed', 'cancelled'].includes(order.status) && (
          <div className="panel-footer" style={{ flexWrap: 'wrap' }}>
            {order.status === 'pending' && (
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => setShowAssign(true)}
                disabled={actionLoading}
              >
                <Bike size={14} /> Assign Rider
              </button>
            )}

            {['assigned', 'rider_accepted'].includes(order.status) && (
              <>
                <button
                  className="btn btn-success"
                  style={{ flex: 1 }}
                  disabled={actionLoading}
                  onClick={() => updateStatus('picked_up')}
                >
                  <CheckCircle size={14} /> Mark Picked Up
                </button>
                <button
                  className="btn btn-danger"
                  disabled={actionLoading}
                  onClick={() => updateStatus('failed')}
                >
                  <AlertCircle size={14} /> Failed
                </button>
              </>
            )}

            {['picked_up', 'in_transit'].includes(order.status) && (
              <>
                <button
                  className="btn btn-success"
                  style={{ flex: 1 }}
                  disabled={actionLoading}
                  onClick={() => updateStatus('delivered')}
                >
                  <CheckCircle size={14} /> Mark Delivered
                </button>
                <button
                  className="btn btn-danger"
                  disabled={actionLoading}
                  onClick={() => updateStatus('failed')}
                >
                  <AlertCircle size={14} /> Failed
                </button>
              </>
            )}

            {actionLoading && (
              <div className="spinner" style={{ width: 18, height: 18 }} />
            )}
          </div>
        )}
      </aside>

      {showAssign && (
        <AssignRiderModal
          order={order}
          onClose={() => setShowAssign(false)}
          onAssigned={(updated) => {
            setOrder(updated);
            onOrderUpdated(updated);
            setShowAssign(false);
          }}
        />
      )}
    </>
  );
}
