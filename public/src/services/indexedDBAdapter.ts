/**
 * IndexedDB Adapter for Web Browsers
 */

import { StorageAdapter, TrackMetadata } from './storageAdapter';

const DB_NAME = 'VibeStreamOffline';
const DB_VERSION = 1;
const AUDIO_STORE = 'audioFiles';
const METADATA_STORE = 'trackMetadata';

interface AudioFile {
  videoId: string;
  blob: Blob;
  size: number;
  downloadedAt: string;
}

export class IndexedDBAdapter implements StorageAdapter {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ IndexedDB failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized (Web)');
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(AUDIO_STORE)) {
          const audioStore = db.createObjectStore(AUDIO_STORE, { keyPath: 'videoId' });
          audioStore.createIndex('downloadedAt', 'downloadedAt', { unique: false });
          audioStore.createIndex('size', 'size', { unique: false });
        }

        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          const metadataStore = db.createObjectStore(METADATA_STORE, { keyPath: 'videoId' });
          metadataStore.createIndex('title', 'title', { unique: false });
          metadataStore.createIndex('artist', 'artist', { unique: false });
          metadataStore.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  async saveAudioFile(videoId: string, blob: Blob): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([AUDIO_STORE], 'readwrite');
      const store = transaction.objectStore(AUDIO_STORE);

      const audioFile: AudioFile = {
        videoId,
        blob,
        size: blob.size,
        downloadedAt: new Date().toISOString(),
      };

      const request = store.put(audioFile);

      request.onsuccess = () => {
        console.log(`✅ Audio saved (IndexedDB): ${videoId}`);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getAudioFile(videoId: string): Promise<Blob | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([AUDIO_STORE], 'readonly');
      const store = transaction.objectStore(AUDIO_STORE);
      const request = store.get(videoId);

      request.onsuccess = () => {
        const result = request.result as AudioFile | undefined;
        resolve(result ? result.blob : null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async hasAudioFile(videoId: string): Promise<boolean> {
    const blob = await this.getAudioFile(videoId);
    return blob !== null;
  }

  async deleteAudioFile(videoId: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([AUDIO_STORE], 'readwrite');
      const store = transaction.objectStore(AUDIO_STORE);
      const request = store.delete(videoId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveMetadata(metadata: TrackMetadata): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([METADATA_STORE], 'readwrite');
      const store = transaction.objectStore(METADATA_STORE);
      const request = store.put(metadata);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getMetadata(videoId: string): Promise<TrackMetadata | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([METADATA_STORE], 'readonly');
      const store = transaction.objectStore(METADATA_STORE);
      const request = store.get(videoId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllMetadata(): Promise<TrackMetadata[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([METADATA_STORE], 'readonly');
      const store = transaction.objectStore(METADATA_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMetadata(videoId: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([METADATA_STORE], 'readwrite');
      const store = transaction.objectStore(METADATA_STORE);
      const request = store.delete(videoId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getStorageUsage(): Promise<{ totalSize: number; trackCount: number }> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([AUDIO_STORE], 'readonly');
      const store = transaction.objectStore(AUDIO_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const files = request.result as AudioFile[];
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        resolve({ totalSize, trackCount: files.length });
      };

      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([AUDIO_STORE, METADATA_STORE], 'readwrite');
      
      transaction.objectStore(AUDIO_STORE).clear();
      transaction.objectStore(METADATA_STORE).clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async deleteTrack(videoId: string): Promise<void> {
    await Promise.all([
      this.deleteAudioFile(videoId),
      this.deleteMetadata(videoId),
    ]);
  }
}