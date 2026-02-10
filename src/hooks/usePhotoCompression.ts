// hooks/usePhotoCompression.ts

import { useCallback } from 'react';

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.8;
const THUMBNAIL_SIZE = 200;
const THUMBNAIL_QUALITY = 0.7;

export interface CompressedPhoto {
  fullSize: Blob;
  thumbnail: Blob;
  originalSize: number;
  compressedSize: number;
}

export function usePhotoCompression() {
  const compressPhoto = useCallback(async (file: File | Blob): Promise<CompressedPhoto> => {
    const originalSize = file.size;

    // Create image from file
    const img = await createImageFromBlob(file);

    // Compress full size
    const fullSize = await resizeAndCompress(img, MAX_DIMENSION, JPEG_QUALITY);

    // Create thumbnail
    const thumbnail = await resizeAndCompress(img, THUMBNAIL_SIZE, THUMBNAIL_QUALITY);

    // Clean up object URL
    URL.revokeObjectURL(img.src);

    return {
      fullSize,
      thumbnail,
      originalSize,
      compressedSize: fullSize.size,
    };
  }, []);

  return { compressPhoto };
}

async function createImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(blob);
  });
}

async function resizeAndCompress(
  img: HTMLImageElement,
  maxDimension: number,
  quality: number
): Promise<Blob> {
  // Calculate new dimensions
  let { width, height } = img;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = (height / width) * maxDimension;
      width = maxDimension;
    } else {
      width = (width / height) * maxDimension;
      height = maxDimension;
    }
  }

  // Draw to canvas
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to compress image'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Convert a blob to base64 data URL
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

export default usePhotoCompression;
