'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const navItems = [
  { href: '/dashboard', label: 'Orders', icon: '📦', exact: true },
  { href: '/dashboard/riders', label: 'Riders', icon: '🏍️' },
  { href: '/dashboard/zones', label: 'Zones', icon: '🗺️' },
  { href: '/dashboard/couriers', label: 'Couriers', icon: '🚚' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🚀</div>
        <div>
          <div className="sidebar-logo-text">RiderOps</div>
          <div className="sidebar-logo-sub">Kenya Delivery Hub</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Operations</div>

        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx('nav-link', isActive && 'active')}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        <div className="sidebar-section-label" style={{ marginTop: 8 }}>
          Integrations
        </div>

        <a
          href="https://dispatch.shipday.com"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-link"
        >
          <span style={{ fontSize: 16 }}>📍</span>
          Shipday Map
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>↗</span>
        </a>
      </nav>

      {/* Footer */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        fontSize: 11,
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span className="live-dot" />
        System Live
      </div>
    </aside>
  );
}
