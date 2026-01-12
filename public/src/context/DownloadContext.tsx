import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Track } from '../types/types';
import { useAuth } from './AuthContext';
import { streamAPI } from '../services/api';

interface DownloadedTrack {
  track: Track;
  downloadedAt: string;
  fileSize?: number;
  localPath?: string; // Will be used with SQLite later
}

interface DownloadProgress {
  trackId: string;
  progress: number; // 0-100
  status: 'downloading' | 'completed' | 'failed';
}

interface DownloadContextType {
  downloadedTracks: DownloadedTrack[];
  downloadQueue: DownloadProgress[];
  isDownloaded: (trackId: string) => boolean;
  isDownloading: (trackId: string) => boolean;
  downloadTrack: (track: Track) => Promise<void>;
  removeDownload: (trackId: string) => void;
  getDownloadedCount: () => number;
  clearDownloads: () => void;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

interface DownloadProviderProps {
  children: ReactNode;
}

export const DownloadProvider: React.FC<DownloadProviderProps> = ({ children }) => {
  const [downloadedTracks, setDownloadedTracks] = useState<DownloadedTrack[]>([]);
  const [downloadQueue, setDownloadQueue] = useState<DownloadProgress[]>([]);
  const { user } = useAuth();

  // Load downloaded tracks from localStorage on mount
  useEffect(() => {
    if (user) {
      loadDownloadedTracks();
    } else {
      setDownloadedTracks([]);
    }
  }, [user]);

  /**
   * Load downloaded tracks from localStorage
   */
  const loadDownloadedTracks = () => {
    try {
      const storageKey = `vibestream_downloads_${user?.id || 'guest'}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        setDownloadedTracks(parsed);
        console.log(`✅ Loaded ${parsed.length} downloaded tracks`);
      }
    } catch (error) {
      console.error('❌ Failed to load downloaded tracks:', error);
    }
  };

  /**
   * Save downloaded tracks to localStorage
   */
  const saveDownloadedTracks = (tracks: DownloadedTrack[]) => {
    try {
      const storageKey = `vibestream_downloads_${user?.id || 'guest'}`;
      localStorage.setItem(storageKey, JSON.stringify(tracks));
      console.log(`💾 Saved ${tracks.length} downloaded tracks`);
    } catch (error) {
      console.error('❌ Failed to save downloaded tracks:', error);
    }
  };

  /**
   * Check if a track is downloaded
   */
  const isDownloaded = (trackId: string): boolean => {
    return downloadedTracks.some(dt => dt.track.id === trackId);
  };

  /**
   * Check if a track is currently downloading
   */
  const isDownloading = (trackId: string): boolean => {
    return downloadQueue.some(
      dq => dq.trackId === trackId && dq.status === 'downloading'
    );
  };

  /**
   * Download a track for offline use
   */
  const downloadTrack = async (track: Track): Promise<void> => {
    // Check if already downloaded
    if (isDownloaded(track.id)) {
      console.log(`ℹ️ Track already downloaded: ${track.title}`);
      return;
    }

    // Check if already downloading
    if (isDownloading(track.id)) {
      console.log(`ℹ️ Track already in download queue: ${track.title}`);
      return;
    }

    console.log(`⬇️ Starting download: ${track.title}`);

    // Add to download queue
    const downloadProgress: DownloadProgress = {
      trackId: track.id,
      progress: 0,
      status: 'downloading'
    };
    setDownloadQueue(prev => [...prev, downloadProgress]);

    try {
      // Simulate download progress
      // TODO: Replace with actual file download logic and SQLite storage
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setDownloadQueue(prev =>
          prev.map(dq =>
            dq.trackId === track.id
              ? { ...dq, progress: i }
              : dq
          )
        );
      }

      // Mark as completed in queue
      setDownloadQueue(prev =>
        prev.map(dq =>
          dq.trackId === track.id
            ? { ...dq, progress: 100, status: 'completed' }
            : dq
        )
      );

      // Create downloaded track entry
      const downloadedTrack: DownloadedTrack = {
        track,
        downloadedAt: new Date().toISOString(),
        fileSize: undefined, // Will be set when we implement actual download
        localPath: undefined, // Will be SQLite path
      };

      // Add to downloaded tracks
      setDownloadedTracks(prev => {
        const newDownloads = [...prev, downloadedTrack];
        saveDownloadedTracks(newDownloads);
        return newDownloads;
      });

      console.log(`✅ Download completed: ${track.title}`);

      // Remove from queue after 2 seconds
      setTimeout(() => {
        setDownloadQueue(prev => prev.filter(dq => dq.trackId !== track.id));
      }, 2000);

    } catch (error: any) {
      console.error(`❌ Download failed for ${track.title}:`, error);

      // Mark as failed
      setDownloadQueue(prev =>
        prev.map(dq =>
          dq.trackId === track.id
            ? { ...dq, status: 'failed' }
            : dq
        )
      );

      // Remove from queue after 3 seconds
      setTimeout(() => {
        setDownloadQueue(prev => prev.filter(dq => dq.trackId !== track.id));
      }, 3000);

      throw error;
    }
  };

  /**
   * Remove a downloaded track
   */
  const removeDownload = (trackId: string) => {
    setDownloadedTracks(prev => {
      const newDownloads = prev.filter(dt => dt.track.id !== trackId);
      saveDownloadedTracks(newDownloads);
      
      const removedTrack = prev.find(dt => dt.track.id === trackId);
      if (removedTrack) {
        console.log(`🗑️ Removed download: ${removedTrack.track.title}`);
      }
      
      return newDownloads;
    });

    // TODO: Delete actual file from SQLite/filesystem
  };

  /**
   * Get total count of downloaded tracks
   */
  const getDownloadedCount = (): number => {
    return downloadedTracks.length;
  };

  /**
   * Clear all downloaded tracks
   */
  const clearDownloads = () => {
    setDownloadedTracks([]);
    const storageKey = `vibestream_downloads_${user?.id || 'guest'}`;
    localStorage.removeItem(storageKey);
    console.log('🗑️ Cleared all downloads');

    // TODO: Delete all files from SQLite/filesystem
  };

  return (
    <DownloadContext.Provider
      value={{
        downloadedTracks,
        downloadQueue,
        isDownloaded,
        isDownloading,
        downloadTrack,
        removeDownload,
        getDownloadedCount,
        clearDownloads,
      }}
    >
      {children}
    </DownloadContext.Provider>
  );
};

/**
 * Hook to use download context
 */
export const useDownloads = () => {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error('useDownloads must be used within DownloadProvider');
  }
  return context;
};