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
