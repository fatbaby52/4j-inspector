// db/index.ts

export * from './database';
export { inspectionDB as db } from './database';
export * from './syncQueue';
export { syncQueueDB } from './syncQueue';
export { photoStore } from './photoStore';

// Re-export for convenience
export type { SyncQueueItem } from '@/types/inspection';
