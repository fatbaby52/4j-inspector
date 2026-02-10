// db/syncQueue.ts

import Dexie, { type Table } from 'dexie';
import type { SyncQueueItem } from '@/types/inspection';

class SyncQueueDB extends Dexie {
  queue!: Table<SyncQueueItem, string>;

  constructor() {
    super('4jSyncQueue');
    this.version(1).stores({
      queue: 'id, inspectionId, status, createdAt'
    });
  }
}

export const syncQueueDB = new SyncQueueDB();

// ============================================
// QUEUE OPERATIONS
// ============================================

export async function addToQueue(
  item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'attempts' | 'status'>
): Promise<string> {
  const id = crypto.randomUUID();
  await syncQueueDB.queue.add({
    ...item,
    id,
    status: 'queued',
    attempts: 0,
    createdAt: new Date()
  });
  return id;
}

export async function getQueuedItems(): Promise<SyncQueueItem[]> {
  return syncQueueDB.queue
    .where('status')
    .anyOf(['queued', 'failed'])
    .sortBy('createdAt');
}

export async function getQueueItemsByInspection(inspectionId: string): Promise<SyncQueueItem[]> {
  return syncQueueDB.queue
    .where('inspectionId')
    .equals(inspectionId)
    .toArray();
}

export async function markInProgress(id: string): Promise<void> {
  await syncQueueDB.queue.update(id, {
    status: 'in-progress',
    lastAttempt: new Date()
  });
}

export async function markCompleted(id: string): Promise<void> {
  await syncQueueDB.queue.update(id, { status: 'completed' });
}

export async function markFailed(id: string, error: string): Promise<void> {
  const item = await syncQueueDB.queue.get(id);
  if (item) {
    await syncQueueDB.queue.update(id, {
      status: 'failed',
      attempts: item.attempts + 1,
      errorMessage: error,
      lastAttempt: new Date()
    });
  }
}

export async function clearCompleted(): Promise<void> {
  await syncQueueDB.queue.where('status').equals('completed').delete();
}

export async function clearAllForInspection(inspectionId: string): Promise<void> {
  await syncQueueDB.queue.where('inspectionId').equals(inspectionId).delete();
}

export async function getQueueStats(): Promise<{
  queued: number;
  inProgress: number;
  failed: number;
  completed: number;
  total: number;
}> {
  const all = await syncQueueDB.queue.toArray();
  return {
    queued: all.filter(i => i.status === 'queued').length,
    inProgress: all.filter(i => i.status === 'in-progress').length,
    failed: all.filter(i => i.status === 'failed').length,
    completed: all.filter(i => i.status === 'completed').length,
    total: all.length
  };
}

export async function retryFailed(): Promise<void> {
  await syncQueueDB.queue
    .where('status')
    .equals('failed')
    .modify({ status: 'queued', attempts: 0 });
}

export async function resetAllItems(): Promise<void> {
  // Reset ALL items to queued with 0 attempts
  await syncQueueDB.queue.toCollection().modify({ status: 'queued', attempts: 0 });
}

export async function getQueueItem(id: string): Promise<SyncQueueItem | undefined> {
  return syncQueueDB.queue.get(id);
}
