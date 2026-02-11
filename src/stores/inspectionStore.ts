// stores/inspectionStore.ts

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Inspection,
  InspectionType,
  Observation,
  Note,
  Grade,
  Photo
} from '@/types/inspection';
import { createDefaultInspection } from '@/types/inspection';
import {
  saveInspection,
  getInspection,
  getAllInspections,
  deleteInspection as deleteInspectionFromDB,
  savePhoto,
  deletePhoto as deletePhotoFromDB,
  getPhotoCount,
  saveCloudInspection
} from '@/db/database';
import { pullAllInspections } from '@/services/syncService';
import { photoStore } from '@/db/photoStore';
import { addToQueue } from '@/db/syncQueue';

interface InspectionState {
  // Current inspection being edited
  currentInspection: Inspection | null;

  // All inspections (for list view)
  inspections: Inspection[];

  // Loading states
  isLoading: boolean;
  isSaving: boolean;

  // Photo count for current inspection
  photoCount: number;

  // Actions
  loadInspections: () => Promise<void>;
  loadInspection: (id: string) => Promise<void>;
  createInspection: (
    type: InspectionType,
    inspectorId: string,
    inspectorName: string
  ) => Promise<string>;
  updateInspection: (updates: Partial<Inspection>) => Promise<void>;
  deleteInspection: (id: string) => Promise<void>;

  // Observation actions
  addObservation: (itemId: string, grade: Grade) => Promise<string>;
  updateObservation: (itemId: string, observationId: string, updates: Partial<Observation>) => Promise<void>;
  deleteObservation: (itemId: string, observationId: string) => Promise<void>;

  // Note actions
  addNote: (itemId: string, observationId: string, text: string, inputMethod: 'typed' | 'voice') => Promise<string>;
  updateNote: (itemId: string, observationId: string, noteId: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (itemId: string, observationId: string, noteId: string) => Promise<void>;

  // Photo actions
  addPhoto: (
    observationId: string,
    blob: Blob,
    thumbnailBlob: Blob,
    originalSize: number,
    compressedSize: number
  ) => Promise<string>;
  deletePhotoFromObservation: (itemId: string, observationId: string, photoId: string) => Promise<void>;
  refreshPhotoCount: () => Promise<void>;

  // Status actions
  markFieldComplete: () => Promise<void>;
  startReview: () => Promise<void>;
  markReviewComplete: () => Promise<void>;

  // Utility
  getDeviceInfo: () => { deviceId: string; deviceType: 'mobile' | 'desktop' };
  clearCurrentInspection: () => void;
}

// Get or create device ID
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('4j-device-id');
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem('4j-device-id', deviceId);
  }
  return deviceId;
};

// Detect device type
const getDeviceType = (): 'mobile' | 'desktop' => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /iphone|ipad|ipod|android|webos|blackberry|windows phone/i.test(userAgent);
  const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
  return isMobile || isTablet ? 'mobile' : 'desktop';
};

export const useInspectionStore = create<InspectionState>((set, get) => ({
  currentInspection: null,
  inspections: [],
  isLoading: false,
  isSaving: false,
  photoCount: 0,

  loadInspections: async () => {
    set({ isLoading: true });
    try {
      // First, try to pull from cloud if online
      if (navigator.onLine) {
        try {
          // Use the fixed inspector ID that syncService uses
          const fixedInspectorId = '00000000-0000-0000-0000-000000000001';
          const cloudInspections = await pullAllInspections(fixedInspectorId);

          // Save each cloud inspection to local DB (merges with existing)
          for (const cloudInspection of cloudInspections) {
            await saveCloudInspection(cloudInspection);
          }
          console.log(`Pulled ${cloudInspections.length} inspections from cloud`);
        } catch (error) {
          console.warn('Failed to pull from cloud, using local data:', error);
        }
      }

      // Then load all inspections from local DB (now includes merged cloud data)
      const inspections = await getAllInspections();
      set({ inspections });
    } finally {
      set({ isLoading: false });
    }
  },

  loadInspection: async (id: string) => {
    set({ isLoading: true });
    try {
      const inspection = await getInspection(id);
      if (inspection) {
        set({ currentInspection: inspection });
        await get().refreshPhotoCount();
      }
    } finally {
      set({ isLoading: false });
    }
  },

  createInspection: async (type, inspectorId, inspectorName) => {
    const { deviceId, deviceType } = get().getDeviceInfo();
    const id = uuidv4();

    const inspection: Inspection = {
      ...createDefaultInspection(inspectorId, inspectorName, type, deviceId, deviceType),
      id
    };

    await saveInspection(inspection);

    // Add to sync queue
    await addToQueue({
      inspectionId: id,
      action: 'create',
      payload: inspection
    });

    set({ currentInspection: inspection, photoCount: 0 });
    await get().loadInspections();

    return id;
  },

  updateInspection: async (updates) => {
    const current = get().currentInspection;
    if (!current) return;

    set({ isSaving: true });
    try {
      const { deviceId, deviceType } = get().getDeviceInfo();

      const updated: Inspection = {
        ...current,
        ...updates,
        updatedAt: new Date(),
        lastEditedByDeviceId: deviceId,
        lastEditedByDeviceType: deviceType,
        syncStatus: 'local'
      };

      await saveInspection(updated);

      // Add to sync queue
      await addToQueue({
        inspectionId: updated.id,
        action: 'update',
        payload: updated
      });

      set({ currentInspection: updated });
    } finally {
      set({ isSaving: false });
    }
  },

  deleteInspection: async (id: string) => {
    await deleteInspectionFromDB(id);

    const current = get().currentInspection;
    if (current?.id === id) {
      set({ currentInspection: null, photoCount: 0 });
    }

    await get().loadInspections();
  },

  addObservation: async (itemId: string, grade: Grade) => {
    const current = get().currentInspection;
    if (!current) return '';

    const observationId = uuidv4();
    const observation: Observation = {
      id: observationId,
      itemId,
      grade,
      photoIds: [],
      notes: [],
      timestamp: new Date(),
      updatedAt: new Date()
    };

    const observations = { ...current.observations };
    if (!observations[itemId]) {
      observations[itemId] = [];
    }
    observations[itemId] = [...observations[itemId], observation];

    await get().updateInspection({ observations });
    return observationId;
  },

  updateObservation: async (itemId: string, observationId: string, updates: Partial<Observation>) => {
    const current = get().currentInspection;
    if (!current) return;

    const observations = { ...current.observations };
    const itemObservations = observations[itemId];

    if (itemObservations) {
      observations[itemId] = itemObservations.map(obs =>
        obs.id === observationId
          ? { ...obs, ...updates, updatedAt: new Date() }
          : obs
      );
      await get().updateInspection({ observations });
    }
  },

  deleteObservation: async (itemId: string, observationId: string) => {
    const current = get().currentInspection;
    if (!current) return;

    const observations = { ...current.observations };
    const itemObservations = observations[itemId];

    if (itemObservations) {
      // Get photo IDs to delete
      const observation = itemObservations.find(obs => obs.id === observationId);
      if (observation) {
        // Delete photos from storage
        for (const photoId of observation.photoIds) {
          await deletePhotoFromDB(photoId);
        }
      }

      observations[itemId] = itemObservations.filter(obs => obs.id !== observationId);

      if (observations[itemId].length === 0) {
        delete observations[itemId];
      }

      await get().updateInspection({ observations });
      await get().refreshPhotoCount();
    }
  },

  addNote: async (itemId: string, observationId: string, text: string, inputMethod: 'typed' | 'voice') => {
    const noteId = uuidv4();
    const note: Note = {
      id: noteId,
      rawText: text,
      inputMethod,
      reviewStatus: 'pending',
      timestamp: new Date()
    };

    const current = get().currentInspection;
    if (!current) return '';

    const observations = { ...current.observations };
    const itemObservations = observations[itemId];

    if (itemObservations) {
      observations[itemId] = itemObservations.map(obs =>
        obs.id === observationId
          ? { ...obs, notes: [...obs.notes, note], updatedAt: new Date() }
          : obs
      );
      await get().updateInspection({ observations });
    }

    return noteId;
  },

  updateNote: async (itemId: string, observationId: string, noteId: string, updates: Partial<Note>) => {
    const current = get().currentInspection;
    if (!current) return;

    const observations = { ...current.observations };
    const itemObservations = observations[itemId];

    if (itemObservations) {
      observations[itemId] = itemObservations.map(obs =>
        obs.id === observationId
          ? {
              ...obs,
              notes: obs.notes.map(note =>
                note.id === noteId ? { ...note, ...updates } : note
              ),
              updatedAt: new Date()
            }
          : obs
      );
      await get().updateInspection({ observations });
    }
  },

  deleteNote: async (itemId: string, observationId: string, noteId: string) => {
    const current = get().currentInspection;
    if (!current) return;

    const observations = { ...current.observations };
    const itemObservations = observations[itemId];

    if (itemObservations) {
      observations[itemId] = itemObservations.map(obs =>
        obs.id === observationId
          ? {
              ...obs,
              notes: obs.notes.filter(note => note.id !== noteId),
              updatedAt: new Date()
            }
          : obs
      );
      await get().updateInspection({ observations });
    }
  },

  addPhoto: async (observationId, blob, thumbnailBlob, originalSize, compressedSize) => {
    const current = get().currentInspection;
    if (!current) return '';

    const photoId = uuidv4();
    const localBlobId = uuidv4();
    const thumbnailBlobId = uuidv4();

    // Store blobs
    await photoStore.saveBlob(localBlobId, blob);
    await photoStore.saveBlob(thumbnailBlobId, thumbnailBlob);

    // Find the observation to get itemId
    let foundItemId = '';
    for (const [itemId, observations] of Object.entries(current.observations)) {
      if (observations.some(obs => obs.id === observationId)) {
        foundItemId = itemId;
        break;
      }
    }

    // Create photo record
    const photo: Photo = {
      id: photoId,
      inspectionId: current.id,
      observationId,
      localBlobId,
      thumbnailBlobId,
      timestamp: new Date(),
      originalSize,
      compressedSize,
      syncStatus: 'local'
    };

    await savePhoto(photo);

    // Add to sync queue for upload
    await addToQueue({
      inspectionId: current.id,
      action: 'upload-photo',
      payload: {
        photoId,
        inspectionId: current.id,
        localBlobId
      }
    });

    // Update observation with photo ID
    if (foundItemId) {
      const observations = { ...current.observations };
      observations[foundItemId] = observations[foundItemId].map(obs =>
        obs.id === observationId
          ? { ...obs, photoIds: [...obs.photoIds, photoId], updatedAt: new Date() }
          : obs
      );
      await get().updateInspection({ observations });
    }

    await get().refreshPhotoCount();
    return photoId;
  },

  deletePhotoFromObservation: async (itemId: string, observationId: string, photoId: string) => {
    const current = get().currentInspection;
    if (!current) return;

    // Delete from database and blob store
    await deletePhotoFromDB(photoId);

    // Update observation
    const observations = { ...current.observations };
    const itemObservations = observations[itemId];

    if (itemObservations) {
      observations[itemId] = itemObservations.map(obs =>
        obs.id === observationId
          ? {
              ...obs,
              photoIds: obs.photoIds.filter(id => id !== photoId),
              updatedAt: new Date()
            }
          : obs
      );
      await get().updateInspection({ observations });
    }

    await get().refreshPhotoCount();
  },

  refreshPhotoCount: async () => {
    const current = get().currentInspection;
    if (current) {
      const count = await getPhotoCount(current.id);
      set({ photoCount: count });
    }
  },

  markFieldComplete: async () => {
    await get().updateInspection({
      status: 'field-complete',
      fieldCompletedAt: new Date()
    });
  },

  startReview: async () => {
    await get().updateInspection({
      status: 'review-in-progress'
    });
  },

  markReviewComplete: async () => {
    await get().updateInspection({
      status: 'review-complete',
      reviewCompletedAt: new Date()
    });
  },

  getDeviceInfo: () => ({
    deviceId: getDeviceId(),
    deviceType: getDeviceType()
  }),

  clearCurrentInspection: () => {
    set({ currentInspection: null, photoCount: 0 });
  }
}));

export default useInspectionStore;
