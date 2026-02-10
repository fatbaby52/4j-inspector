// services/syncService.ts

import { supabase } from './supabaseClient';
import {
  getQueuedItems,
  markInProgress,
  markCompleted,
  markFailed,
  clearCompleted,
  getQueueStats,
} from '@/db/syncQueue';
import {
  markInspectionSynced,
  markPhotoSynced,
} from '@/db/database';
import { photoStore } from '@/db/photoStore';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // Exponential backoff

export interface SyncResult {
  success: boolean;
  errors: string[];
  syncedCount: number;
  failedCount: number;
}

// ============================================
// SYNC TRIGGERS
// ============================================

let syncListenersInitialized = false;

export function initSyncListeners() {
  if (syncListenersInitialized) return;
  syncListenersInitialized = true;

  // Sync on app open / resume
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      processQueue();
    }
  });

  // Sync when coming online
  window.addEventListener('online', () => {
    processQueue();
  });
}

// ============================================
// MANUAL SYNC
// ============================================

export async function syncNow(): Promise<SyncResult> {
  if (!navigator.onLine) {
    return { success: false, errors: ['No internet connection'], syncedCount: 0, failedCount: 0 };
  }

  return processQueue();
}

// ============================================
// QUEUE PROCESSOR
// ============================================

async function processQueue(): Promise<SyncResult> {
  const errors: string[] = [];
  let syncedCount = 0;
  let failedCount = 0;

  const items = await getQueuedItems();

  for (const item of items) {
    // Skip if too many retries
    if (item.attempts >= MAX_RETRIES) {
      failedCount++;
      continue;
    }

    try {
      await markInProgress(item.id);

      switch (item.action) {
        case 'create':
        case 'update':
          await syncInspection(item.payload);
          break;
        case 'upload-photo':
          await uploadPhoto(item.payload as {
            photoId: string;
            inspectionId: string;
            localBlobId: string;
          });
          break;
      }

      await markCompleted(item.id);
      syncedCount++;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Sync failed for ${item.action}:`, errorMsg, item);
      errors.push(`${item.action} failed: ${errorMsg}`);
      await markFailed(item.id, errorMsg);
      failedCount++;

      // Short delay before next item
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  // Clean up completed items
  await clearCompleted();

  return {
    success: errors.length === 0,
    errors,
    syncedCount,
    failedCount,
  };
}

// ============================================
// INSPECTION SYNC
// ============================================

async function syncInspection(inspection: any): Promise<void> {
  // Always use a fixed valid UUID for inspector_id since we removed auth
  const fixedInspectorId = '00000000-0000-0000-0000-000000000001';

  const payload = {
    id: inspection.id,
    type: inspection.type,
    status: inspection.status,
    inspector_id: fixedInspectorId,
    inspector_name: inspection.inspectorName || inspection.inspector_name || 'Inspector',
    inspection_date: inspection.inspectionDate || new Date().toISOString(),
    client_info: inspection.clientInfo || {},
    property_address: inspection.propertyAddress || {},
    building_data: inspection.buildingData || {},
    observations: inspection.observations || {},
    executive_summary: inspection.executiveSummary || null,
    recommendations: inspection.recommendations || [],
    facade_photo_id: inspection.facadePhotoId || null,
    version: inspection.version || 1,
    last_edited_by_device_id: inspection.lastEditedByDeviceId || null,
    last_edited_by_device_type: inspection.lastEditedByDeviceType || null,
    updated_at: new Date().toISOString(),
  };

  console.log('Syncing inspection:', payload);

  const { error } = await supabase!
    .from('inspections')
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    console.error('Inspection sync error:', error);
    throw new Error(`Inspection sync failed: ${error.message}`);
  }

  await markInspectionSynced(inspection.id);
}

// ============================================
// PHOTO UPLOAD
// ============================================

async function uploadPhoto(photoData: {
  photoId: string;
  inspectionId: string;
  localBlobId: string;
}): Promise<void> {
  console.log('Uploading photo:', photoData);

  // Get the full photo record from local DB to get all metadata
  const { getPhoto } = await import('@/db/database');
  const localPhoto = await getPhoto(photoData.photoId);
  if (!localPhoto) {
    console.error('Photo record not found locally:', photoData.photoId);
    throw new Error(`Photo record not found locally (ID: ${photoData.photoId})`);
  }
  console.log('Local photo record:', localPhoto);

  // Get blob from local storage
  const blob = await photoStore.getBlob(photoData.localBlobId);
  if (!blob) {
    console.error('Blob not found for ID:', photoData.localBlobId);
    throw new Error(`Photo blob not found locally (ID: ${photoData.localBlobId})`);
  }
  console.log('Blob found, size:', blob.size);

  // Upload to Supabase Storage
  const path = `inspections/${photoData.inspectionId}/${photoData.photoId}.jpg`;
  console.log('Uploading to path:', path);

  const { error: storageError } = await supabase!.storage
    .from('inspection-photos')
    .upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (storageError) {
    console.error('Storage upload error:', storageError);
    throw new Error(`Storage upload failed: ${storageError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase!.storage
    .from('inspection-photos')
    .getPublicUrl(path);

  const storageUrl = urlData.publicUrl;
  console.log('Storage URL:', storageUrl);

  // Insert record into Supabase photos TABLE (so generate-pdf can find it)
  const photoRecord = {
    id: photoData.photoId,
    inspection_id: photoData.inspectionId,
    observation_id: localPhoto.observationId,
    storage_key: path,
    storage_url: storageUrl,
    caption: localPhoto.caption || null,
    original_size: localPhoto.originalSize || null,
    compressed_size: localPhoto.compressedSize || null,
    created_at: localPhoto.timestamp ? new Date(localPhoto.timestamp).toISOString() : new Date().toISOString(),
  };

  console.log('Inserting photo record into database:', photoRecord);

  const { error: dbError } = await supabase!
    .from('photos')
    .upsert(photoRecord, { onConflict: 'id' });

  if (dbError) {
    console.error('Photo database insert error:', dbError);
    throw new Error(`Photo database insert failed: ${dbError.message}`);
  }

  // Update local photo record with storage info
  await markPhotoSynced(photoData.photoId, path, storageUrl);
  console.log('Photo upload complete:', photoData.photoId);
}

// ============================================
// PULL FROM CLOUD
// ============================================

export async function pullInspection(inspectionId: string): Promise<any> {
  const { data, error } = await supabase
    .from('inspections')
    .select('*')
    .eq('id', inspectionId)
    .single();

  if (error) throw error;
  return data;
}

export async function pullAllInspections(inspectorId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('inspections')
    .select('*')
    .eq('inspector_id', inspectorId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============================================
// EXPORTS
// ============================================

export { getQueueStats };
