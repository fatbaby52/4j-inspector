// services/photoService.ts

import { inspectionDB, getPhotoCount } from '@/db/database';

const MAX_PHOTOS = 100;
const WARNING_THRESHOLD = 75;

export interface StorageUsage {
  photoCount: number;
  isAtLimit: boolean;
  isNearLimit: boolean;
  canAddPhotos: boolean;
  warningMessage: string | null;
}

/**
 * Get storage usage statistics for an inspection
 */
export async function getStorageUsage(inspectionId: string): Promise<StorageUsage> {
  const photoCount = await getPhotoCount(inspectionId);

  const isAtLimit = photoCount >= MAX_PHOTOS;
  const isNearLimit = photoCount >= WARNING_THRESHOLD && !isAtLimit;
  const canAddPhotos = !isAtLimit;

  let warningMessage: string | null = null;
  if (isAtLimit) {
    warningMessage = `Photo limit reached (${photoCount}/${MAX_PHOTOS}). Delete some photos to add more.`;
  } else if (isNearLimit) {
    warningMessage = `Approaching photo limit (${photoCount}/${MAX_PHOTOS}).`;
  }

  return {
    photoCount,
    isAtLimit,
    isNearLimit,
    canAddPhotos,
    warningMessage,
  };
}

/**
 * Get total storage size for an inspection
 */
export async function getStorageSize(inspectionId: string): Promise<{
  totalBytes: number;
  formattedSize: string;
}> {
  const photos = await inspectionDB.photos
    .where('inspectionId')
    .equals(inspectionId)
    .toArray();

  const totalBytes = photos.reduce((sum, p) => sum + (p.compressedSize || 0), 0);

  return {
    totalBytes,
    formattedSize: formatBytes(totalBytes),
  };
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const MAX_PHOTO_COUNT = MAX_PHOTOS;
export const PHOTO_WARNING_THRESHOLD = WARNING_THRESHOLD;
