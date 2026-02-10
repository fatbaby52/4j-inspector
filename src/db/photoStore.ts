// db/photoStore.ts

import Dexie, { type Table } from 'dexie';

interface PhotoBlob {
  id: string;
  blob: Blob;
  createdAt: Date;
}

class PhotoBlobDB extends Dexie {
  blobs!: Table<PhotoBlob, string>;

  constructor() {
    super('4jPhotoBlobStore');

    this.version(1).stores({
      blobs: 'id, createdAt'
    });
  }
}

const photoBlobDB = new PhotoBlobDB();

// ============================================
// BLOB OPERATIONS
// ============================================

export const photoStore = {
  async saveBlob(id: string, blob: Blob): Promise<void> {
    await photoBlobDB.blobs.put({
      id,
      blob,
      createdAt: new Date()
    });
  },

  async getBlob(id: string): Promise<Blob | undefined> {
    const record = await photoBlobDB.blobs.get(id);
    return record?.blob;
  },

  async deleteBlob(id: string): Promise<void> {
    await photoBlobDB.blobs.delete(id);
  },

  async deleteBlobs(ids: string[]): Promise<void> {
    await photoBlobDB.blobs.bulkDelete(ids);
  },

  async getBlobUrl(id: string): Promise<string | undefined> {
    const blob = await this.getBlob(id);
    if (blob) {
      return URL.createObjectURL(blob);
    }
    return undefined;
  },

  async getAllBlobIds(): Promise<string[]> {
    return photoBlobDB.blobs.toCollection().primaryKeys();
  },

  async getStorageUsage(): Promise<number> {
    const blobs = await photoBlobDB.blobs.toArray();
    return blobs.reduce((total, record) => total + record.blob.size, 0);
  },

  async clearOldBlobs(maxAgeDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    const oldBlobs = await photoBlobDB.blobs
      .where('createdAt')
      .below(cutoffDate)
      .toArray();

    await photoBlobDB.blobs.bulkDelete(oldBlobs.map(b => b.id));
    return oldBlobs.length;
  }
};

export default photoStore;
