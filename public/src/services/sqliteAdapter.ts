/**
 * SQLite Adapter for Native Apps (Android/iOS)
 * This communicates with native code through a bridge
 */

import { StorageAdapter, TrackMetadata } from './storageAdapter';

// Bridge interface for native communication
interface NativeBridge {
  executeSQL(query: string, params?: any[]): Promise<any>;
  blobToBase64(blob: Blob): Promise<string>;
  base64ToBlob(base64: string, mimeType: string): Promise<Blob>;
}

export class SQLiteAdapter implements StorageAdapter {
  private bridge: NativeBridge;

  constructor() {
    this.bridge = this.getNativeBridge();
  }

  private getNativeBridge(): NativeBridge {
    // Android WebView bridge
    if ((window as any).AndroidBridge) {
      return {
        executeSQL: async (query, params) => {
          const result = await (window as any).AndroidBridge.executeSQL(
            JSON.stringify({ query, params })
          );
          return JSON.parse(result);
        },
        blobToBase64: async (blob) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve(base64);
            };
            reader.readAsDataURL(blob);
          });
        },
        base64ToBlob: async (base64, mimeType) => {
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          return new Blob([byteArray], { type: mimeType });
        },
      };
    }

    // iOS WebKit bridge
    if ((window as any).webkit?.messageHandlers) {
      return {
        executeSQL: async (query, params) => {
          return new Promise((resolve) => {
            const callbackId = `sql_${Date.now()}_${Math.random()}`;
            (window as any)[callbackId] = resolve;
            (window as any).webkit.messageHandlers.sqlBridge.postMessage({
              callbackId,
              query,
              params,
            });
          });
        },
        blobToBase64: async (blob) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve(base64);
            };
            reader.readAsDataURL(blob);
          });
        },
        base64ToBlob: async (base64, mimeType) => {
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          return new Blob([byteArray], { type: mimeType });
        },
      };
    }

    throw new Error('Native bridge not found');
  }

  async init(): Promise<void> {
    // Create tables
    await this.bridge.executeSQL(`
      CREATE TABLE IF NOT EXISTS audio_files (
        video_id TEXT PRIMARY KEY,
        blob_data TEXT,
        size INTEGER,
        downloaded_at TEXT
      )
    `);

    await this.bridge.executeSQL(`
      CREATE TABLE IF NOT EXISTS track_metadata (
        video_id TEXT PRIMARY KEY,
        track_id TEXT,
        title TEXT,
        artist TEXT,
        album TEXT,
        cover_url TEXT,
        duration INTEGER,
        downloaded_at TEXT,
        last_played_at TEXT,
        play_count INTEGER
      )
    `);

    // Create indices
    await this.bridge.executeSQL(`
      CREATE INDEX IF NOT EXISTS idx_audio_downloaded 
      ON audio_files(downloaded_at)
    `);

    await this.bridge.executeSQL(`
      CREATE INDEX IF NOT EXISTS idx_metadata_title 
      ON track_metadata(title)
    `);

    console.log('✅ SQLite initialized (Native)');
  }

  async saveAudioFile(videoId: string, blob: Blob): Promise<void> {
    const base64 = await this.bridge.blobToBase64(blob);
    
    await this.bridge.executeSQL(
      `INSERT OR REPLACE INTO audio_files (video_id, blob_data, size, downloaded_at)
       VALUES (?, ?, ?, ?)`,
      [videoId, base64, blob.size, new Date().toISOString()]
    );

    console.log(`✅ Audio saved (SQLite): ${videoId}`);
  }

  async getAudioFile(videoId: string): Promise<Blob | null> {
    const result = await this.bridge.executeSQL(
      'SELECT blob_data FROM audio_files WHERE video_id = ?',
      [videoId]
    );

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const base64 = result.rows[0].blob_data;
    return this.bridge.base64ToBlob(base64, 'audio/mpeg');
  }

  async hasAudioFile(videoId: string): Promise<boolean> {
    const result = await this.bridge.executeSQL(
      'SELECT 1 FROM audio_files WHERE video_id = ? LIMIT 1',
      [videoId]
    );
    return result.rows && result.rows.length > 0;
  }

  async deleteAudioFile(videoId: string): Promise<void> {
    await this.bridge.executeSQL(
      'DELETE FROM audio_files WHERE video_id = ?',
      [videoId]
    );
  }

  async saveMetadata(metadata: TrackMetadata): Promise<void> {
    await this.bridge.executeSQL(
      `INSERT OR REPLACE INTO track_metadata 
       (video_id, track_id, title, artist, album, cover_url, duration, 
        downloaded_at, last_played_at, play_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        metadata.videoId,
        metadata.trackId,
        metadata.title,
        metadata.artist,
        metadata.album,
        metadata.coverUrl,
        metadata.duration,
        metadata.downloadedAt,
        metadata.lastPlayedAt || null,
        metadata.playCount,
      ]
    );
  }

  async getMetadata(videoId: string): Promise<TrackMetadata | null> {
    const result = await this.bridge.executeSQL(
      'SELECT * FROM track_metadata WHERE video_id = ?',
      [videoId]
    );

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      videoId: row.video_id,
      trackId: row.track_id,
      title: row.title,
      artist: row.artist,
      album: row.album,
      coverUrl: row.cover_url,
      duration: row.duration,
      downloadedAt: row.downloaded_at,
      lastPlayedAt: row.last_played_at,
      playCount: row.play_count,
    };
  }

  async getAllMetadata(): Promise<TrackMetadata[]> {
    const result = await this.bridge.executeSQL(
      'SELECT * FROM track_metadata ORDER BY downloaded_at DESC'
    );

    if (!result.rows) {
      return [];
    }

    return result.rows.map((row: any) => ({
      videoId: row.video_id,
      trackId: row.track_id,
      title: row.title,
      artist: row.artist,
      album: row.album,
      coverUrl: row.cover_url,
      duration: row.duration,
      downloadedAt: row.downloaded_at,
      lastPlayedAt: row.last_played_at,
      playCount: row.play_count,
    }));
  }

  async deleteMetadata(videoId: string): Promise<void> {
    await this.bridge.executeSQL(
      'DELETE FROM track_metadata WHERE video_id = ?',
      [videoId]
    );
  }

  async getStorageUsage(): Promise<{ totalSize: number; trackCount: number }> {
    const result = await this.bridge.executeSQL(
      'SELECT COUNT(*) as count, SUM(size) as total FROM audio_files'
    );

    return {
      trackCount: result.rows[0].count || 0,
      totalSize: result.rows[0].total || 0,
    };
  }

  async clearAll(): Promise<void> {
    await this.bridge.executeSQL('DELETE FROM audio_files');
    await this.bridge.executeSQL('DELETE FROM track_metadata');
  }

  async deleteTrack(videoId: string): Promise<void> {
    await Promise.all([
      this.deleteAudioFile(videoId),
      this.deleteMetadata(videoId),
    ]);
  }
}