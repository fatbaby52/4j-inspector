// db/database.ts

import Dexie, { type Table } from 'dexie';
import type { Inspection, Photo } from '@/types/inspection';

export class InspectionDB extends Dexie {
  inspections!: Table<Inspection, string>;
  photos!: Table<Photo, string>;

  constructor() {
    super('4jInspectionDB');

    this.version(1).stores({
      inspections: 'id, status, inspectorId, syncStatus, updatedAt',
      photos: 'id, inspectionId, observationId, syncStatus'
    });
  }
}

export const inspectionDB = new InspectionDB();

// ============================================
// INSPECTION OPERATIONS
// ============================================

export async function saveInspection(inspection: Inspection): Promise<void> {
  await inspectionDB.inspections.put({
    ...inspection,
    updatedAt: new Date(),
    version: inspection.version + 1
  });
}

export async function getInspection(id: string): Promise<Inspection | undefined> {
  return inspectionDB.inspections.get(id);
}

export async function getAllInspections(): Promise<Inspection[]> {
  return inspectionDB.inspections
    .orderBy('updatedAt')
    .reverse()
    .toArray();
}

export async function getInspectionsByStatus(status: Inspection['status']): Promise<Inspection[]> {
  return inspectionDB.inspections
    .where('status')
    .equals(status)
    .toArray();
}

export async function getInspectionsByInspector(inspectorId: string): Promise<Inspection[]> {
  return inspectionDB.inspections
    .where('inspectorId')
    .equals(inspectorId)
    .reverse()
    .sortBy('updatedAt');
}

export async function deleteInspection(id: string): Promise<void> {
  await inspectionDB.transaction('rw', [inspectionDB.inspections, inspectionDB.photos], async () => {
    // Delete all photos for this inspection
    await inspectionDB.photos.where('inspectionId').equals(id).delete();
    // Delete the inspection
    await inspectionDB.inspections.delete(id);
  });
}

// ============================================
// PHOTO OPERATIONS
// ============================================

export async function savePhoto(photo: Photo): Promise<void> {
  await inspectionDB.photos.put(photo);
}

export async function getPhoto(id: string): Promise<Photo | undefined> {
  return inspectionDB.photos.get(id);
}

export async function getPhotosByInspection(inspectionId: string): Promise<Photo[]> {
  return inspectionDB.photos
    .where('inspectionId')
    .equals(inspectionId)
    .toArray();
}

export async function getPhotosByObservation(observationId: string): Promise<Photo[]> {
  return inspectionDB.photos
    .where('observationId')
    .equals(observationId)
    .toArray();
}

export async function deletePhoto(id: string): Promise<void> {
  await inspectionDB.photos.delete(id);
}

export async function getPhotoCount(inspectionId: string): Promise<number> {
  return inspectionDB.photos
    .where('inspectionId')
    .equals(inspectionId)
    .count();
}

// ============================================
// SYNC HELPERS
// ============================================

export async function getUnsyncedInspections(): Promise<Inspection[]> {
  return inspectionDB.inspections
    .where('syncStatus')
    .anyOf(['local', 'queued', 'error'])
    .toArray();
}

export async function getUnsyncedPhotos(): Promise<Photo[]> {
  return inspectionDB.photos
    .where('syncStatus')
    .anyOf(['local', 'queued', 'error'])
    .toArray();
}

export async function markInspectionSynced(id: string): Promise<void> {
  await inspectionDB.inspections.update(id, {
    syncStatus: 'synced',
    lastSyncedAt: new Date()
  });
}

export async function markPhotoSynced(id: string, storageKey: string, storageUrl: string): Promise<void> {
  await inspectionDB.photos.update(id, {
    syncStatus: 'synced',
    storageKey,
    storageUrl
  });
}

// ============================================
// CLOUD SYNC HELPERS
// ============================================

/**
 * Save an inspection from the cloud to local storage.
 * Only overwrites if cloud version is newer or local doesn't exist.
 */
export async function saveCloudInspection(cloudInspection: any): Promise<void> {
  const localInspection = await inspectionDB.inspections.get(cloudInspection.id);

  // Convert cloud format (snake_case) to local format (camelCase)
  const inspection: Inspection = {
    id: cloudInspection.id,
    type: cloudInspection.type,
    status: cloudInspection.status,
    createdAt: new Date(cloudInspection.created_at),
    updatedAt: new Date(cloudInspection.updated_at),
    fieldCompletedAt: cloudInspection.field_completed_at ? new Date(cloudInspection.field_completed_at) : undefined,
    reviewCompletedAt: cloudInspection.review_completed_at ? new Date(cloudInspection.review_completed_at) : undefined,
    reportGeneratedAt: cloudInspection.report_generated_at ? new Date(cloudInspection.report_generated_at) : undefined,
    lastEditedByDeviceId: cloudInspection.last_edited_by_device_id || '',
    lastEditedByDeviceType: cloudInspection.last_edited_by_device_type || 'mobile',
    syncStatus: 'synced',
    lastSyncedAt: new Date(),
    version: cloudInspection.version || 1,
    inspectorId: cloudInspection.inspector_id,
    inspectorName: cloudInspection.inspector_name,
    inspectorSignature: cloudInspection.inspector_signature,
    inspectionDate: new Date(cloudInspection.inspection_date),
    clientInfo: cloudInspection.client_info || { name: '', email: '', phone: '' },
    propertyAddress: cloudInspection.property_address || { street: '', city: '', state: '', zip: '' },
    facadePhotoId: cloudInspection.facade_photo_id,
    buildingData: cloudInspection.building_data || {},
    observations: cloudInspection.observations || {},
    executiveSummary: cloudInspection.executive_summary,
    recommendations: cloudInspection.recommendations || [],
    reportStorageKey: cloudInspection.report_storage_key,
    reportUrl: cloudInspection.report_url,
  };

  // If local doesn't exist, or cloud is newer, save it
  if (!localInspection) {
    await inspectionDB.inspections.put(inspection);
  } else {
    // Compare versions - cloud wins if higher version
    const cloudVersion = cloudInspection.version || 1;
    const localVersion = localInspection.version || 1;

    // Also check if local has unsynced changes
    if (localInspection.syncStatus === 'synced' || cloudVersion > localVersion) {
      await inspectionDB.inspections.put(inspection);
    }
    // If local has unsynced changes, keep local version
  }
}
