'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import type { Order, DashboardStats } from '@/lib/types';
import { useToast } from '@/components/Toast';
import OrderDetailPanel from '@/components/OrderDetailPanel';

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    pending: 'Pending',
    assigned: 'Assigned',
    rider_accepted: 'Accepted',
    picked_up: 'Picked Up',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    failed: 'Failed',
    cancelled: 'Cancelled',
  };
  const pulse = ['assigned', 'rider_accepted', 'picked_up', 'in_transit'].includes(status);
  return (
    <span className={`badge badge-${status}`}>
      <span className={`badge-dot${pulse ? ' pulse' : ''}`} style={{ background: 'currentColor' }} />
      {labels[status] ?? status}
    </span>
  );
}

// ── Type Badge ────────────────────────────────────────────────────────────────

function TypeBadge({ type, courier }: { type: string; courier?: string }) {
  if (type === 'last_mile') {
    return <span className="badge badge-last_mile">🏍️ Last Mile</span>;
  }
  const labels: Record<string, string> = { fargo: 'Fargo', pickup_mtaani: 'Pickup Mtaani', g4s: 'G4S' };
  return (
    <span className="badge badge-long_distance">
      🚚 {courier ? (labels[courier] ?? courier) : 'Long Distance'}
    </span>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, iconBg, sub,
}: {
  label: string; value: number | string; icon: string; iconBg: string; sub?: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className="stat-card-icon" style={{ background: iconBg }}>{icon}</div>
      </div>
      <div className="stat-card-value">{value}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className="skeleton" style={{ width: 80, height: 10 }} />
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)' }} />
      </div>
      <div className="skeleton" style={{ width: 60, height: 28, marginTop: 4 }} />
      <div className="skeleton" style={{ width: 100, height: 10, marginTop: 4 }} />
    </div>
  );
}

// ── Table Skeleton ────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 7 }).map((_, i) => (
        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
          <td style={{ padding: '12px 16px' }}><div className="skeleton" style={{ width: 60, height: 12 }} /></td>
          <td style={{ padding: '12px 16px' }}>
            <div className="skeleton" style={{ width: 120, height: 12 }} />
            <div className="skeleton" style={{ width: 80, height: 10, marginTop: 4 }} />
          </td>
          <td style={{ padding: '12px 16px' }}><div className="skeleton" style={{ width: 160, height: 12 }} /></td>
          <td style={{ padding: '12px 16px' }}><div className="skeleton" style={{ width: 70, height: 20, borderRadius: 999 }} /></td>
          <td style={{ padding: '12px 16px' }}><div className="skeleton" style={{ width: 70, height: 20, borderRadius: 999 }} /></td>
          <td style={{ padding: '12px 16px' }}><div className="skeleton" style={{ width: 90, height: 12 }} /></td>
          <td style={{ padding: '12px 16px' }}><div className="skeleton" style={{ width: 70, height: 12 }} /></td>
          <td style={{ padding: '12px 16px' }}><div className="skeleton" style={{ width: 80, height: 12 }} /></td>
        </tr>
      ))}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100', offset: '0' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('delivery_type', typeFilter);

      const [ordersRes, statsRes] = await Promise.all([
        fetch(`/api/orders?${params}`),
        fetch('/api/stats'),
      ]);

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.orders ?? []);
        setTotal(data.total ?? 0);
      }
      if (statsRes.ok) setStats(await statsRes.json());
    } catch {
      toast('Failed to refresh data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, typeFilter, toast]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const statusFilters = [
    { value: 'all',       label: 'All' },
    { value: 'pending',   label: 'Pending' },
    { value: 'assigned',  label: 'Assigned' },
    { value: 'in_transit',label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'failed',    label: 'Failed' },
  ];

  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(o =>
      o.shopify_order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      (o.customer_phone ?? '').includes(q) ||
      o.delivery_address.toLowerCase().includes(q)
    );
  }, [orders, search]);

  const handleOrderUpdated = useCallback((updated: Order) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
    setSelectedOrder(updated);
  }, []);

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-title">Order Queue</span>
          <span className="topbar-sub">
            {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
        <div className="topbar-right">
          <div className="flex items-center gap-2" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            <span className="live-dot" />
            Live · 30s refresh
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            aria-label="Refresh"
          >
            <RefreshCw size={13} style={{ transition: 'transform 0.4s', transform: refreshing ? 'rotate(360deg)' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid">
          {loading && !orders.length ? (
            Array.from({ length: 5 }).map((_, i) => <StatSkeleton key={i} />)
          ) : (
            <>
              <StatCard label="Total Orders"       value={stats?.totalOrders ?? '—'}      icon="📦" iconBg="rgba(37,99,235,0.15)"   sub="All time" />
              <StatCard label="Pending"             value={stats?.pendingOrders ?? '—'}    icon="⏳" iconBg="rgba(245,158,11,0.15)"  sub="Awaiting assignment" />
              <StatCard label="Active Deliveries"   value={stats?.activeDeliveries ?? '—'} icon="🏍️" iconBg="rgba(139,92,246,0.15)" sub="En route now" />
              <StatCard label="Delivered Today"     value={stats?.deliveredToday ?? '—'}   icon="✅" iconBg="rgba(16,185,129,0.15)"  sub="Since midnight" />
              <StatCard label="Available Riders"    value={stats?.availableRiders ?? '—'}  icon="🟢" iconBg="rgba(16,185,129,0.1)"   sub={`${stats?.busyRiders ?? 0} busy`} />
            </>
          )}
        </div>

        {/* Table Card */}
        <div className="table-card">
          <div className="table-header">
            <span className="table-title">
              Orders
              {!loading && (
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 13, marginLeft: 8 }}>
                  {filteredOrders.length !== total ? `${filteredOrders.length} of ` : ''}{total} total
                </span>
              )}
            </span>
            <div className="table-actions">
              {/* Search */}
              <div className="search-wrap">
                <Search size={14} />
                <input
                  className="search-input"
                  type="search"
                  placeholder="Search orders…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="Search orders"
                />
              </div>
              {/* Type filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}
                aria-label="Filter by delivery type"
              >
                <option value="all">All Types</option>
                <option value="last_mile">Last Mile</option>
                <option value="long_distance">Long Distance</option>
              </select>
            </div>
          </div>

          {/* Status pills */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="filter-pills">
              {statusFilters.map((f) => (
                <button
                  key={f.value}
                  className={`pill${statusFilter === f.value ? ' active' : ''}`}
                  onClick={() => setStatusFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {['Order #', 'Customer', 'Address', 'Type', 'Status', 'Rider', 'Amount', 'Date'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody><TableSkeleton /></tbody>
              </table>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-title">
                {search ? 'No matching orders' : 'No orders yet'}
              </div>
              <div className="empty-state-desc">
                {search
                  ? 'Try a different search term or clear the filter.'
                  : 'Orders will appear here automatically once your Shopify webhook is connected.'}
              </div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {['Order #', 'Customer', 'Address', 'Type', 'Status', 'Rider', 'Amount', 'Date'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const assignedRider = order.rms_deliveries?.[0]?.rms_riders;
                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        style={{ cursor: 'pointer' }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Order #${order.shopify_order_number} — ${order.customer_name}`}
                        onKeyDown={e => e.key === 'Enter' && setSelectedOrder(order)}
                      >
                        <td>
                          <span className="font-semibold" style={{ color: 'var(--primary-light)' }}>
                            #{order.shopify_order_number}
                          </span>
                        </td>
                        <td>
                          <div className="font-medium truncate" style={{ maxWidth: 150 }}>
                            {order.customer_name}
                          </div>
                          {order.customer_phone && (
                            <div className="text-sm text-muted">{order.customer_phone}</div>
                          )}
                        </td>
                        <td>
                          <div className="truncate" style={{ maxWidth: 180 }}>
                            {order.delivery_address}
                          </div>
                          {order.delivery_town && (
                            <div className="text-sm text-muted">{order.delivery_town}</div>
                          )}
                        </td>
                        <td>
                          <TypeBadge type={order.delivery_type} courier={order.courier_partner ?? undefined} />
                        </td>
                        <td><StatusBadge status={order.status} /></td>
                        <td>
                          {assignedRider ? (
                            <div>
                              <div className="font-medium">{assignedRider.name}</div>
                              <div className="text-sm text-muted">{assignedRider.phone}</div>
                            </div>
                          ) : order.courier_tracking_id ? (
                            <div>
                              <div className="text-sm text-secondary">{order.courier_partner?.toUpperCase()}</div>
                              <div className="text-sm text-muted">{order.courier_tracking_id}</div>
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          <span className="font-semibold">
                            KES {order.order_total_kes?.toLocaleString() ?? '—'}
                          </span>
                        </td>
                        <td>
                          <span className="text-muted" style={{ fontSize: 12 }}>
                            {format(new Date(order.created_at), 'dd MMM, HH:mm')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Side Panel */}
      {selectedOrder && (
        <OrderDetailPanel
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={handleOrderUpdated}
        />
      )}
    </>
  );
}
