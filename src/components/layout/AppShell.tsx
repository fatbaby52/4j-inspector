// components/layout/AppShell.tsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import { OfflineBanner } from '@/components/common/OfflineIndicator';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children?: React.ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className={cn('min-h-screen bg-gray-50 flex flex-col', className)}>
      <OfflineBanner />
      <main className="flex-1 flex flex-col">
        {children || <Outlet />}
      </main>
    </div>
  );
}

export default AppShell;
