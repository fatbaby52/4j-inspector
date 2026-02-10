// components/layout/DeviceGate.tsx

import React from 'react';
import { useDeviceType } from '@/hooks/useDeviceType';

interface DeviceGateProps {
  children: React.ReactNode;
  allowedDevices: ('mobile' | 'tablet' | 'desktop')[];
  fallback?: React.ReactNode;
  message?: string;
}

export function DeviceGate({
  children,
  allowedDevices,
  fallback,
  message,
}: DeviceGateProps) {
  const { deviceType, isLoading } = useDeviceType();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-500">Checking device...</p>
        </div>
      </div>
    );
  }

  const isAllowed = allowedDevices.includes(deviceType);

  if (!isAllowed) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const deviceMessages: Record<string, { icon: string; title: string; description: string }> = {
      'mobile-only': {
        icon: '📱',
        title: 'Mobile Device Required',
        description: 'This feature is optimized for mobile devices. Please access it from your phone or tablet.',
      },
      'tablet-only': {
        icon: '📱',
        title: 'Tablet Required',
        description: 'This feature is designed for tablet use. Please access it from your iPad.',
      },
      'desktop-only': {
        icon: '🖥️',
        title: 'Desktop Required',
        description: 'This feature is designed for desktop use. Please access it from a computer.',
      },
      'field-devices': {
        icon: '📱',
        title: 'Field Device Required',
        description: 'Field data collection is designed for mobile devices and tablets.',
      },
    };

    // Determine message based on allowed devices
    let messageKey = 'field-devices';
    if (allowedDevices.length === 1) {
      if (allowedDevices[0] === 'desktop') messageKey = 'desktop-only';
      else if (allowedDevices[0] === 'tablet') messageKey = 'tablet-only';
      else if (allowedDevices[0] === 'mobile') messageKey = 'mobile-only';
    } else if (allowedDevices.includes('desktop') && !allowedDevices.includes('mobile')) {
      messageKey = 'desktop-only';
    }

    const messageContent = deviceMessages[messageKey];

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <span className="text-6xl mb-6 block">{messageContent.icon}</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {messageContent.title}
          </h1>
          <p className="text-gray-600 mb-6">
            {message || messageContent.description}
          </p>
          <div className="text-sm text-gray-500">
            Current device: <span className="font-medium capitalize">{deviceType}</span>
          </div>
          <button
            onClick={() => window.history.back()}
            className="mt-6 px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default DeviceGate;
