import React, { useState } from 'react';
import { X, Plus, Music, Check, Loader } from 'lucide-react';
import { Track } from '../types/types';
import { useLibrary } from '../context/LibraryContext';
import { playlistAPI } from '../services/api';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
}

const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ 
  isOpen, 
  onClose, 
  track 
}) => {
  const { playlists, addPlaylist, refreshPlaylists } = useLibrary();
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null);
  const [successPlaylistId, setSuccessPlaylistId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !track) return null;

  /**
   * Handle adding track to existing playlist
   */
  const handleAddToPlaylist = async (playlistId: string) => {
    setAddingToPlaylist(playlistId);
    setError(null);

    try {
      console.log(`➕ Adding "${track.title}" to playlist ${playlistId}`);
      
      // Add track to playlist via API
      await playlistAPI.addTrack(playlistId, track.videoId || track.id, track);
      
      // Show success state
      setSuccessPlaylistId(playlistId);
      
      // Refresh playlists to get updated data
      await refreshPlaylists();
      
      console.log('✅ Track added successfully');
      
      // Auto-close after 1 second
      setTimeout(() => {
        onClose();
        setSuccessPlaylistId(null);
      }, 1000);
      
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to add track';
      console.error('❌ Failed to add to playlist:', errorMsg);
      setError(errorMsg);
    } finally {
      setAddingToPlaylist(null);
    }
  };

  /**
   * Handle creating new playlist and adding track
   */
  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      console.log(`➕ Creating playlist: "${newPlaylistName}"`);
      
      // Create new playlist
      await addPlaylist(
        newPlaylistName.trim(),
        `Created for ${track.title}`
      );
      
      // Refresh to get the new playlist with ID
      await refreshPlaylists();
      
      // Get the newly created playlist (should be first in list)
      const newPlaylist = playlists[0];
      
      if (newPlaylist) {
        // Add track to the new playlist
        await handleAddToPlaylist(newPlaylist.id);
      }
      
      setNewPlaylistName('');
      
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create playlist';
      console.error('❌ Failed to create playlist:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-zinc-900 rounded-t-2xl md:rounded-2xl animate-in slide-in-from-bottom md:slide-in-from-bottom-4 duration-300 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold">Add to Playlist</h2>
            <p className="text-sm text-zinc-400 mt-1 truncate">{track.title}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition flex-shrink-0"
          >
            <X size={24} />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-2">
            <p className="text-sm text-red-400 flex-1">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Create New Playlist */}
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Plus size={24} className="text-zinc-400" />
              </div>
              <input
                type="text"
                placeholder="Create new playlist"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateAndAdd();
                }}
                className="flex-1 bg-zinc-800 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1DB954] placeholder:text-zinc-500"
                disabled={isCreating}
              />
              <button
                onClick={handleCreateAndAdd}
                disabled={!newPlaylistName.trim() || isCreating}
                className="px-4 py-2 bg-[#1DB954] text-black rounded-lg font-bold text-sm hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex-shrink-0"
              >
                {isCreating ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  'Create'
                )}
              </button>
            </div>
          </div>

          {/* Existing Playlists */}
          <div className="p-4">
            {playlists.length === 0 ? (
              <div className="text-center py-12">
                <Music size={48} className="mx-auto text-zinc-700 mb-3" />
                <p className="text-zinc-400 text-sm">No playlists yet</p>
                <p className="text-zinc-500 text-xs mt-1">Create one above to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-2 mb-3">
                  Your Playlists
                </p>
                {playlists.map((playlist) => {
                  const isAdding = addingToPlaylist === playlist.id;
                  const isSuccess = successPlaylistId === playlist.id;
                  
                  return (
                    <button
                      key={playlist.id}
                      onClick={() => handleAddToPlaylist(playlist.id)}
                      disabled={isAdding || isSuccess}
                      className="w-full flex items-center gap-3 p-3 hover:bg-zinc-800 rounded-lg transition group disabled:cursor-not-allowed"
                    >
                      <img
                        src={playlist.coverUrl}
                        alt={playlist.name}
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium text-sm truncate">{playlist.name}</p>
                        <p className="text-xs text-zinc-400">
                          {playlist.trackCount !== undefined 
                            ? `${playlist.trackCount} songs`
                            : `${playlist.tracks?.length || 0} songs`}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {isAdding ? (
                          <Loader size={20} className="text-zinc-400 animate-spin" />
                        ) : isSuccess ? (
                          <Check size={20} className="text-[#1DB954]" />
                        ) : (
                          <Plus size={20} className="text-zinc-500 group-hover:text-white transition" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-full font-bold text-sm transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToPlaylistModal;