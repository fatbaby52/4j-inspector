// components/auth/AuthProvider.tsx

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initialize, isInitialized } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initialize();
      setIsReady(true);
    };

    if (!isInitialized) {
      init();
    } else {
      setIsReady(true);
    }
  }, [initialize, isInitialized]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p className="text-gray-500">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthProvider;
