// hooks/useDeviceType.ts

import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function useDeviceType(): {
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  isLoading: boolean;
} {
  const [deviceType, setDeviceType] = useState<DeviceType>(() => detectDeviceType());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);

    const handleResize = () => {
      setDeviceType(detectDeviceType());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  const isDesktop = deviceType === 'desktop';
  const isTouchDevice = isMobile || isTablet;

  return { deviceType, isMobile, isTablet, isDesktop, isTouchDevice, isLoading };
}

function detectDeviceType(): DeviceType {
  const userAgent = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;

  // Check for mobile user agents
  const isMobileUA = /iphone|ipod|android.*mobile|webos|blackberry|windows phone/i.test(userAgent);

  // Check for tablet user agents
  const isTabletUA = /ipad|android(?!.*mobile)/i.test(userAgent);

  // If we can detect from UA, use that
  if (isMobileUA) return 'mobile';
  if (isTabletUA) return 'tablet';

  // Fall back to screen width detection
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Check if the current device is allowed for a given inspection status.
 * Field phases (field-draft, field-complete) should be on mobile/tablet.
 * Review phases should be on desktop.
 */
export function isDeviceAllowedForStatus(
  deviceType: DeviceType,
  status: 'field-draft' | 'field-complete' | 'review-in-progress' | 'review-complete' | 'report-generated'
): boolean {
  const isFieldPhase = status === 'field-draft' || status === 'field-complete';
  const isTouchDevice = deviceType === 'mobile' || deviceType === 'tablet';

  if (isFieldPhase) {
    return isTouchDevice;
  }

  // Review and report phases should be on desktop
  return deviceType === 'desktop';
}

export default useDeviceType;
