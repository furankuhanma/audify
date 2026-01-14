import React, { useState } from 'react';
import { Music, Mic2, Disc, Play, RefreshCw, AlertCircle, Loader } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { useNavigate } from 'react-router-dom';

const Library: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'playlists' | 'artists' | 'albums'>('playlists');
  const { playlists, isLoading, error, refreshPlaylists } = useLibrary();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tabs = [
    { id: 'playlists', name: 'Playlists', icon: <Music size={18} /> },
    { id: 'artists', name: 'Artists', icon: <Mic2 size={18} /> },
  ];

  /**
   * Handle refresh button click
   */
const handleRefresh = async () => {
  const MIN_LOADING_TIME = 5000; 
  const startTime = Date.now();
  
  setIsRefreshing(true);

  try {
    await refreshPlaylists();
    // Success: Turn off loading immediately so data shows up
    setIsRefreshing(false);
  } catch (err) {
    // Failure: Calculate how much of the 5 seconds is left to wait
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(MIN_LOADING_TIME - elapsedTime, 0);

    setTimeout(() => {
      setIsRefreshing(false); 
      // This "releases" the UI to finally show the error/retry button
    }, remainingTime);
  }
};
  /**
   * Render playlists tab content
   */
const renderPlaylistsContent = () => {
  // 1. Show skeletons if Context is loading OR if our 5-second timer is running
  if (isLoading || isRefreshing) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-zinc-900 bg-opacity-40 p-4 rounded-lg">
            <div className="aspect-square bg-zinc-800 rounded-md mb-4 animate-pulse" />
            <div className="h-4 bg-zinc-800 rounded mb-2 animate-pulse" />
            <div className="h-3 bg-zinc-800 rounded w-2/3 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }
    // Error state
if (error && !isRefreshing) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="p-6 max-w-md text-center">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">❌ {error}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-blue-500 text-black rounded-full font-bold hover:scale-105 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

    // Empty state
    if (playlists.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="bg-zinc-800 p-8 rounded-full">
            <Music size={64} className="text-zinc-400" />
          </div>
          <div className="max-w-xs">
            <h3 className="text-xl font-bold mb-2">No playlists yet</h3>
            <p className="text-zinc-400 text-sm">Create your first playlist to organize your favorite music.</p>
          </div>
          <button
            onClick={() => navigate('/search')}
            className="bg-blue-600 text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition mt-4"
          >
            Find Music
          </button>
        </div>
      );
    }

    // Playlists grid
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-zinc-400">
            {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => navigate(`/playlist/${playlist.id}`)}
              className="bg-zinc-900 bg-opacity-40 p-4 rounded-lg hover:bg-zinc-800 transition group cursor-pointer"
            >
              <div className="relative mb-4 aspect-square shadow-lg overflow-hidden rounded-md">
                <img
                  src={playlist.coverUrl}
                  alt={playlist.name}
                  className="object-cover w-full h-full transition duration-300 group-hover:scale-105"
                />
                <button className="absolute bottom-2 right-2 bg-blue-400 p-3 rounded-full shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition duration-300">
                  <Play size={20} className="text-black fill-current" />
                </button>
              </div>
              <h3 className="font-bold text-sm md:text-base truncate mb-1">{playlist.name}</h3>
              <p className="text-xs text-zinc-500 truncate leading-relaxed">
                Playlist • {playlist.trackCount !== undefined
                  ? `${playlist.trackCount} ${playlist.trackCount === 1 ? 'song' : 'songs'}`
                  : `${playlist.tracks?.length || 0} songs`}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Render coming soon content for artists/albums
   */
  const renderComingSoonContent = () => {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="bg-zinc-800 p-8 rounded-full">
          {activeTab === 'artists' ? (
            <Mic2 size={64} className="text-zinc-400" />
          ) : (
            <Disc size={64} className="text-zinc-400" />
          )}
        </div>
        <div className="max-w-xs">
          <h3 className="text-xl font-bold mb-2">Coming Soon</h3>
          <p className="text-zinc-400 text-sm">
            {activeTab === 'artists'
              ? "Follow your favorite artists to see them here."
              : "Save albums to build your collection."}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Your Library</h1>

        {/* Refresh button - only show for playlists tab */}
        {activeTab === 'playlists' && !isLoading && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm font-medium transition disabled:opacity-50 disabled:hover:bg-zinc-800"
            title="Refresh playlists"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden md:inline">
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-zinc-800 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-2 py-2 text-sm font-bold transition ${activeTab === tab.id
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-zinc-400 hover:text-white'
              }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      {/* Error Banner (global errors) */}
      {error && !isLoading && activeTab === 'playlists' && playlists.length > 0 && (
        <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-2">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-400">{error}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="text-red-400 hover:text-red-300 text-sm underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      <div>
        {activeTab === 'playlists' ? renderPlaylistsContent() : renderComingSoonContent()}
      </div>

      {/* Stats Footer (only for playlists with data) */}
      {activeTab === 'playlists' && playlists.length > 0 && !isLoading && !error && (
        <div className="pt-8 border-t border-zinc-800">
          <div className="flex flex-wrap gap-6 text-sm text-zinc-400">
            <div>
              <span className="font-bold text-white">{playlists.length}</span> playlists
            </div>
            <div>
              <span className="font-bold text-white">
                {playlists.reduce((acc, p) => acc + (p.trackCount || p.tracks?.length || 0), 0)}
              </span> total songs
            </div>
            {playlists[0]?.createdAt && (
              <div>
                Last updated: {new Date(playlists[0].updatedAt || playlists[0].createdAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;