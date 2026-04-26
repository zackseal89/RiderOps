'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Package, Bike, Map, Truck, ExternalLink, Zap } from 'lucide-react';
import { clsx } from 'clsx';

interface NavItem {
  href: string;
  label: string;
  Icon: React.ElementType;
  exact?: boolean;
  badge?: number;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetch_ = () =>
      fetch('/api/stats')
        .then(r => r.json())
        .then(d => { if (!cancelled) setPendingCount(d.pendingOrders ?? 0); })
        .catch(() => {});

    fetch_();
    const interval = setInterval(fetch_, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const navItems: NavItem[] = [
    { href: '/dashboard',          label: 'Orders',   Icon: Package, exact: true, badge: pendingCount ?? undefined },
    { href: '/dashboard/riders',   label: 'Riders',   Icon: Bike },
    { href: '/dashboard/zones',    label: 'Zones',    Icon: Map },
    { href: '/dashboard/couriers', label: 'Couriers', Icon: Truck },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap size={16} color="#fff" fill="#fff" />
        </div>
        <div>
          <div className="sidebar-logo-text">RiderOps</div>
          <div className="sidebar-logo-sub">Kenya Delivery Hub</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Operations</div>

        {navItems.map(({ href, label, Icon, exact, badge }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={clsx('nav-link', isActive && 'active')}
            >
              <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
              <span style={{ flex: 1 }}>{label}</span>
              {badge !== undefined && badge > 0 && (
                <span className="nav-badge">{badge}</span>
              )}
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
          <ExternalLink size={15} strokeWidth={1.8} />
          <span style={{ flex: 1 }}>Shipday Map</span>
          <ExternalLink size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </a>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <span className="live-dot" />
        System Live
      </div>
    </aside>
  );
}
