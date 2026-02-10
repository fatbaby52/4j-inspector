// hooks/useCamera.ts

import { useRef, useCallback, useState } from 'react';
import { usePhotoCompression, type CompressedPhoto } from './usePhotoCompression';

export interface UseCameraReturn {
  inputRef: React.RefObject<HTMLInputElement | null>;
  openCamera: () => void;
  openGallery: () => void;
  isProcessing: boolean;
  error: string | null;
  clearError: () => void;
}

export function useCamera(
  onPhotoCapture: (photo: CompressedPhoto) => void | Promise<void>
): UseCameraReturn {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { compressPhoto } = usePhotoCompression();

  const handleFileChange = useCallback(
    async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) return;

      // Reset input so the same file can be selected again
      target.value = '';

      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const compressed = await compressPhoto(file);
        await onPhotoCapture(compressed);
      } catch (err) {
        console.error('Error processing photo:', err);
        setError('Failed to process photo. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    },
    [compressPhoto, onPhotoCapture]
  );

  const openCamera = useCallback(() => {
    if (inputRef.current) {
      // Set capture attribute for camera
      inputRef.current.setAttribute('capture', 'environment');
      inputRef.current.accept = 'image/*';
      inputRef.current.onchange = handleFileChange as EventListener;
      inputRef.current.click();
    }
  }, [handleFileChange]);

  const openGallery = useCallback(() => {
    if (inputRef.current) {
      // Remove capture attribute for gallery
      inputRef.current.removeAttribute('capture');
      inputRef.current.accept = 'image/*';
      inputRef.current.onchange = handleFileChange as EventListener;
      inputRef.current.click();
    }
  }, [handleFileChange]);

  const clearError = useCallback(() => setError(null), []);

  return {
    inputRef,
    openCamera,
    openGallery,
    isProcessing,
    error,
    clearError,
  };
}

export default useCamera;
