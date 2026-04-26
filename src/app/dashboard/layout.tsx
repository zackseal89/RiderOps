import Sidebar from '@/components/Sidebar';
import { ToastProvider } from '@/components/Toast';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RiderOps Kenya — Dashboard',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="layout">
        <Sidebar />
        <main className="main">{children}</main>
      </div>
    </ToastProvider>
  );
}
