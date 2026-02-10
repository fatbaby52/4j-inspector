// components/layout/Header.tsx

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { OfflineIndicator } from '@/components/common/OfflineIndicator';
import { SyncStatusIndicator } from '@/components/sync/SyncStatusIndicator';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
  rightContent?: React.ReactNode;
  className?: string;
}

export function Header({
  title = '4J Inspector',
  showBack = false,
  backTo,
  rightContent,
  className
}: HeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 bg-white border-b border-gray-200',
        'safe-top',
        className
      )}
    >
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
              aria-label="Go back"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <OfflineIndicator />
          <SyncStatusIndicator />
          {rightContent}
        </div>
      </div>
    </header>
  );
}

export default Header;
