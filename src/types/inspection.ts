// types/inspection.ts

export type InspectionType = 'home' | 'facility';
export type Grade = 'good' | 'fair' | 'poor' | 'na';
export type ReviewStatus = 'pending' | 'accepted' | 'declined' | 'edited';
export type InspectionStatus =
  | 'field-draft'
  | 'field-complete'
  | 'review-in-progress'
  | 'review-complete'
  | 'report-generated';

export type SyncStatus = 'local' | 'queued' | 'syncing' | 'synced' | 'error';

// ============================================
// PHOTO MODEL (Stored separately from main data)
// ============================================

export interface Photo {
  id: string;                    // UUID
  inspectionId: string;
  observationId: string;

  // Local storage
  localBlobId?: string;          // Reference to IndexedDB blob store
  thumbnailBlobId?: string;      // Smaller version for UI

  // Cloud storage (after sync)
  storageKey?: string;           // Supabase Storage key
  storageUrl?: string;           // Public/signed URL

  // Metadata
  timestamp: Date;
  caption?: string;
  originalSize: number;          // Bytes, for tracking
  compressedSize: number;

  syncStatus: SyncStatus;
}

// ============================================
// NOTE MODEL
// ============================================

export interface Note {
  id: string;                    // UUID
  rawText: string;               // Original field note (typed or voice)
  inputMethod: 'typed' | 'voice';
  cleanedText?: string;          // AI-polished version
  reviewStatus: ReviewStatus;
  timestamp: Date;
}

// ============================================
// OBSERVATION MODEL (Core of inspection data)
// ============================================

export interface Observation {
  id: string;                    // UUID
  itemId: string;                // e.g., 'ext-foundation'
  grade: Grade;
  photoIds: string[];            // References to Photo records
  notes: Note[];
  timestamp: Date;
  updatedAt: Date;
}

// ============================================
// CLIENT INFORMATION
// ============================================

export interface ClientInfo {
  name: string;
  company?: string;
  email: string;
  phone: string;
}

// ============================================
// BUILDING DATA
// ============================================

export interface BuildingData {
  lotSize: string;
  buildingSize: string;
  yearBuilt: string;
  propertyType: string;                    // Single select
  foundationType: string;                  // Single select
  roofType: string;                        // Single select
  exteriorMaterials: string[];             // Multi-select
  ceilingStructure: string;                // Single select
  interiorWallMaterials: string[];         // Multi-select
  floorTypes: string[];                    // Multi-select
  windowType: string;                      // Single select
  generatorType: string;                   // Single select
  rvParking: boolean;
  additionalParking: string;
  additionalFeatures: string;
}

// ============================================
// AI-GENERATED CONTENT
// ============================================

export interface AIContent {
  text: string;
  reviewStatus: ReviewStatus;
  revisionHistory: string[];
  lastFeedback?: string;
}

export interface Recommendation {
  id: string;                              // UUID
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  estimatedUrgency: string;
  reviewStatus: ReviewStatus;
}

// ============================================
// MAIN INSPECTION MODEL
// ============================================

export interface Inspection {
  id: string;                              // UUID
  type: InspectionType;
  status: InspectionStatus;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  fieldCompletedAt?: Date;
  reviewCompletedAt?: Date;
  reportGeneratedAt?: Date;

  // Device tracking (for conflict prevention)
  lastEditedByDeviceId: string;
  lastEditedByDeviceType: 'mobile' | 'desktop';

  // Sync
  syncStatus: SyncStatus;
  lastSyncedAt?: Date;
  version: number;                         // Increment on each save

  // Inspector Info
  inspectorId: string;                     // Supabase Auth user ID
  inspectorName: string;
  inspectorSignature?: string;             // Base64 data URL
  inspectionDate: Date;

  // Client Info
  clientInfo: ClientInfo;

  // Property Info
  propertyAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  facadePhotoId?: string;                  // Reference to Photo record

  // Building Data
  buildingData: BuildingData;

  // Observations (keyed by itemId, array for multiple observations)
  observations: Record<string, Observation[]>;

  // AI Generated Content (populated during review phase)
  executiveSummary?: AIContent;
  recommendations: Recommendation[];

  // Report
  reportStorageKey?: string;               // Supabase Storage key for PDF
  reportUrl?: string;
}

// ============================================
// SYNC QUEUE ITEM
// ============================================

export interface SyncQueueItem {
  id: string;                              // UUID
  inspectionId: string;
  action: 'create' | 'update' | 'upload-photo';
  payload: unknown;                        // The data to sync
  status: 'queued' | 'in-progress' | 'completed' | 'failed';
  attempts: number;
  lastAttempt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

// ============================================
// HELPER TYPES
// ============================================

export interface InspectionItemDef {
  id: string;
  name: string;
  categoryId: string;
}

export interface InspectionCategory {
  id: string;
  name: string;
  icon: string;
  limitations: string;
  items: InspectionItemDef[];
}

// ============================================
// DEFAULT VALUES
// ============================================

export const createDefaultClientInfo = (): ClientInfo => ({
  name: '',
  company: '',
  email: '',
  phone: '',
});

export const createDefaultBuildingData = (): BuildingData => ({
  lotSize: '',
  buildingSize: '',
  yearBuilt: '',
  propertyType: '',
  foundationType: '',
  roofType: '',
  exteriorMaterials: [],
  ceilingStructure: '',
  interiorWallMaterials: [],
  floorTypes: [],
  windowType: '',
  generatorType: '',
  rvParking: false,
  additionalParking: '',
  additionalFeatures: '',
});

export const createDefaultInspection = (
  inspectorId: string,
  inspectorName: string,
  type: InspectionType,
  deviceId: string,
  deviceType: 'mobile' | 'desktop'
): Omit<Inspection, 'id'> => ({
  type,
  status: 'field-draft',
  createdAt: new Date(),
  updatedAt: new Date(),
  lastEditedByDeviceId: deviceId,
  lastEditedByDeviceType: deviceType,
  syncStatus: 'local',
  version: 1,
  inspectorId,
  inspectorName,
  inspectionDate: new Date(),
  clientInfo: createDefaultClientInfo(),
  propertyAddress: {
    street: '',
    city: '',
    state: '',
    zip: '',
  },
  buildingData: createDefaultBuildingData(),
  observations: {},
  recommendations: [],
});
