// components/common/SignatureCapture.tsx

import React, { useRef, useCallback, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface SignatureCaptureProps {
  value?: string; // Base64 data URL
  onChange: (dataUrl: string | undefined) => void;
  label?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function SignatureCapture({
  value,
  onChange,
  label = 'Signature',
  width = 400,
  height = 200,
  className,
}: SignatureCaptureProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width, height });

  // Adjust canvas size to container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        setCanvasSize({
          width: Math.min(containerWidth - 4, width), // -4 for border
          height: height,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [width, height]);

  // Load existing signature
  useEffect(() => {
    if (value && sigRef.current) {
      sigRef.current.fromDataURL(value);
      setIsEmpty(false);
    }
  }, [value]);

  const handleEnd = useCallback(() => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const dataUrl = sigRef.current.toDataURL('image/png');
      onChange(dataUrl);
      setIsEmpty(false);
    }
  }, [onChange]);

  const handleClear = useCallback(() => {
    if (sigRef.current) {
      sigRef.current.clear();
      onChange(undefined);
      setIsEmpty(true);
    }
  }, [onChange]);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div
        ref={containerRef}
        className={cn(
          'relative border-2 rounded-lg bg-white overflow-hidden',
          isEmpty ? 'border-dashed border-gray-300' : 'border-solid border-gray-400'
        )}
      >
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          canvasProps={{
            width: canvasSize.width,
            height: canvasSize.height,
            className: 'signature-canvas',
          }}
          onEnd={handleEnd}
        />

        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-sm">Sign here</p>
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={isEmpty}
        >
          Clear Signature
        </Button>
      </div>
    </div>
  );
}

export default SignatureCapture;
