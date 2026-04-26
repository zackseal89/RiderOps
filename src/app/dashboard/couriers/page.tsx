'use client';

const couriers = [
  {
    id: 'fargo',
    name: 'Fargo Courier',
    logo: '🟠',
    description: 'Kenya\'s leading courier with nationwide coverage. Strong in major urban centres.',
    website: 'https://www.fargocourier.co.ke',
    coverage: 'Nairobi, Mombasa, Kisumu, Nakuru, Eldoret, Thika + 47 counties',
    pricing: 'From KES 400 (Nairobi) · KES 600–1200 (upcountry)',
    sla: '1–2 business days (Nairobi) · 2–5 days (upcountry)',
    apiStatus: 'contact',
    envKey: 'FARGO_API_KEY',
  },
  {
    id: 'pickup_mtaani',
    name: 'Pickup Mtaani',
    logo: '🟢',
    description: 'Widest last-mile agent network in Kenya with 4,000+ pickup points. Ideal for nationwide reach.',
    website: 'https://www.pickupmtaani.com',
    coverage: '47 counties · 4,000+ agent points',
    pricing: 'From KES 200 per parcel',
    sla: '1–3 business days',
    apiStatus: 'available',
    envKey: 'PICKUP_MTAANI_API_KEY',
  },
  {
    id: 'g4s',
    name: 'G4S Courier',
    logo: '🔴',
    description: 'International logistics company with secure parcel delivery across Kenya and East Africa.',
    website: 'https://www.g4s.com/en-ke',
    coverage: 'Kenya + East Africa (Uganda, Tanzania, Rwanda)',
    pricing: 'From KES 500 per shipment',
    sla: '1–2 business days',
    apiStatus: 'contact',
    envKey: 'G4S_API_KEY',
  },
];

function ApiStatusBadge({ status }: { status: string }) {
  if (status === 'available') {
    return <span className="badge badge-delivered">✓ API Available</span>;
  }
  return <span className="badge badge-warning" style={{
    background: 'rgba(245,158,11,0.15)',
    color: '#F59E0B',
  }}>📧 Contact for API Access</span>;
}

export default function CouriersPage() {
  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-title">Courier Partners</span>
          <span className="topbar-sub">Long-distance delivery for orders outside your rider zones</span>
        </div>
      </div>

      <div className="page-content">
        <div style={{
          background: 'rgba(139,92,246,0.08)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 'var(--radius)',
          padding: '14px 18px',
          marginBottom: 24,
          fontSize: 13,
          color: 'var(--text-secondary)',
          display: 'flex',
          gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>🚚</span>
          <div>
            <strong style={{ color: 'var(--text)' }}>Automatic courier selection:</strong> When an order is outside your
            last-mile zones, the system picks the best courier based on the destination.
            Add your API keys to <code style={{ fontFamily: 'monospace', background: 'var(--surface-2)', padding: '1px 6px', borderRadius: 4 }}>.env.local</code> to enable live booking.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {couriers.map((courier) => (
            <div key={courier.id} className="table-card" style={{ padding: 24 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                  }}>
                    {courier.logo}
                  </div>
                  <div>
                    <div className="font-bold" style={{ fontSize: 16 }}>{courier.name}</div>
                    <ApiStatusBadge status={courier.apiStatus} />
                  </div>
                </div>
                <a
                  href={courier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                >
                  Visit Website ↗
                </a>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                {courier.description}
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
                marginBottom: 16,
              }}>
                {[
                  { label: 'Coverage', value: courier.coverage },
                  { label: 'Pricing', value: courier.pricing },
                  { label: 'Delivery SLA', value: courier.sla },
                ].map((item) => (
                  <div key={item.label} style={{
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text)' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontFamily: 'monospace',
                fontSize: 12,
                color: 'var(--text-muted)',
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>.env.local: </span>
                <span style={{ color: 'var(--accent)' }}>{courier.envKey}</span>
                <span>=your_api_key_here</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
