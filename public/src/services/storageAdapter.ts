/**
 * Unified Storage Interface
 * Works on both web (IndexedDB) and native apps (SQLite)
 */

export interface AudioFile {
  videoId: string;
  blob: Blob | string; // Blob for web, base64 string for native
  size: number;
  downloadedAt: string;
}

export interface TrackMetadata {
  videoId: string;
  trackId: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  duration: number;
  downloadedAt: string;
  lastPlayedAt?: string;
  playCount: number;
}

export interface StorageAdapter {
  init(): Promise<void>;
  saveAudioFile(videoId: string, blob: Blob): Promise<void>;
  getAudioFile(videoId: string): Promise<Blob | null>;
  hasAudioFile(videoId: string): Promise<boolean>;
  deleteAudioFile(videoId: string): Promise<void>;
  saveMetadata(metadata: TrackMetadata): Promise<void>;
  getMetadata(videoId: string): Promise<TrackMetadata | null>;
  getAllMetadata(): Promise<TrackMetadata[]>;
  deleteMetadata(videoId: string): Promise<void>;
  getStorageUsage(): Promise<{ totalSize: number; trackCount: number }>;
  clearAll(): Promise<void>;
  deleteTrack(videoId: string): Promise<void>;
}

/**
 * Platform Detection
 */
export class PlatformDetector {
  static isNative(): boolean {
    // Check if running in native WebView
    return !!(window as any).ReactNativeWebView || 
           !!(window as any).AndroidBridge ||
           !!(window as any).webkit?.messageHandlers;
  }

  static isWeb(): boolean {
    return !this.isNative();
  }
}

/**
 * Factory to get the correct storage adapter
 */
export class StorageFactory {
  private static instance: StorageAdapter | null = null;

  static async getStorage(): Promise<StorageAdapter> {
    if (this.instance) {
      return this.instance;
    }

    if (PlatformDetector.isNative()) {
      const { SQLiteAdapter } = await import('./sqliteAdapter');
      this.instance = new SQLiteAdapter();
    } else {
      const { IndexedDBAdapter } = await import('./indexedDBAdapter');
      this.instance = new IndexedDBAdapter();
    }

    await this.instance.init();
    return this.instance;
  }
}

// Export singleton getter
export const getOfflineStorage = () => StorageFactory.getStorage();