// components/layout/Navigation.tsx

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/inspections', label: 'Inspections', icon: '📋' },
  { path: '/settings', label: 'Settings', icon: '⚙️' }
];

export function Navigation() {
  const location = useLocation();

  // Don't show navigation on inspection detail pages
  if (location.pathname.includes('/inspection/')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-2',
                'min-w-[64px] rounded-lg transition-colors touch-manipulation',
                isActive
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default Navigation;
