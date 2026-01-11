import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Track } from '../types/types';
import { useAuth } from './AuthContext';

interface LikeContextType {
  likedTracks: Track[];
  isLiked: (trackId: string) => boolean;
  toggleLike: (track: Track) => void;
  getLikedCount: () => number;
  clearLikes: () => void;
}

const LikeContext = createContext<LikeContextType | undefined>(undefined);

interface LikeProviderProps {
  children: ReactNode;
}

export const LikeProvider: React.FC<LikeProviderProps> = ({ children }) => {
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const { user } = useAuth();

  // Load liked tracks from localStorage on mount
  useEffect(() => {
    if (user) {
      loadLikedTracks();
    } else {
      // Clear likes if user logs out
      setLikedTracks([]);
    }
  }, [user]);

  /**
   * Load liked tracks from localStorage
   */
  const loadLikedTracks = () => {
    try {
      const storageKey = `vibestream_likes_${user?.id || 'guest'}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        setLikedTracks(parsed);
        console.log(`✅ Loaded ${parsed.length} liked tracks`);
      }
    } catch (error) {
      console.error('❌ Failed to load liked tracks:', error);
    }
  };

  /**
   * Save liked tracks to localStorage
   */
  const saveLikedTracks = (tracks: Track[]) => {
    try {
      const storageKey = `vibestream_likes_${user?.id || 'guest'}`;
      localStorage.setItem(storageKey, JSON.stringify(tracks));
      console.log(`💾 Saved ${tracks.length} liked tracks`);
    } catch (error) {
      console.error('❌ Failed to save liked tracks:', error);
    }
  };

  /**
   * Check if a track is liked
   */
  const isLiked = (trackId: string): boolean => {
    return likedTracks.some(track => track.id === trackId);
  };

  /**
   * Toggle like status for a track
   */
  const toggleLike = (track: Track) => {
    setLikedTracks(prevLikes => {
      const isCurrentlyLiked = prevLikes.some(t => t.id === track.id);
      
      let newLikes: Track[];
      
      if (isCurrentlyLiked) {
        // Unlike: Remove from array
        newLikes = prevLikes.filter(t => t.id !== track.id);
        console.log(`💔 Unliked: ${track.title}`);
      } else {
        // Like: Add to array
        newLikes = [...prevLikes, track];
        console.log(`❤️ Liked: ${track.title}`);
      }
      
      // Save to localStorage
      saveLikedTracks(newLikes);
      
      // TODO: Sync with backend API
      // await likeAPI.toggleLike(track.id, !isCurrentlyLiked);
      
      return newLikes;
    });
  };

  /**
   * Get total count of liked tracks
   */
  const getLikedCount = (): number => {
    return likedTracks.length;
  };

  /**
   * Clear all liked tracks (for logout or reset)
   */
  const clearLikes = () => {
    setLikedTracks([]);
    const storageKey = `vibestream_likes_${user?.id || 'guest'}`;
    localStorage.removeItem(storageKey);
    console.log('🗑️ Cleared all liked tracks');
  };

  return (
    <LikeContext.Provider
      value={{
        likedTracks,
        isLiked,
        toggleLike,
        getLikedCount,
        clearLikes,
      }}
    >
      {children}
    </LikeContext.Provider>
  );
};

/**
 * Hook to use like context
 */
export const useLikes = () => {
  const context = useContext(LikeContext);
  if (!context) {
    throw new Error('useLikes must be used within LikeProvider');
  }
  return context;
};