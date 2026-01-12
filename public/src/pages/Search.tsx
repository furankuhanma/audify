import React, { useState, useEffect } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { Track } from '../types/types';
import { searchAPI } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { useLikes } from '../context/LikeContext';
import { useDownloads } from '../context/DownloadContext';
import TrackOptionsMenu from '../components/TrackOptionsMenu';
import AddToPlaylistModal from '../components/AddToPlayListModal';

const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  
  const { playTrack, setPlaylist } = usePlayer();
  const { isLiked, toggleLike } = useLikes();
  const { isDownloaded, downloadTrack } = useDownloads();

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  /**
   * Handle search request
   */
  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      console.log(`🔍 Searching for: "${query}"`);
      const results = await searchAPI.search(query, 20);
      setSearchResults(results);
      console.log(`✅ Found ${results.length} results`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Search failed';
      console.error('❌ Search error:', errorMsg);
      setSearchError(errorMsg);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Handle track click
   */
  const handleTrackClick = (track: Track) => {
    setPlaylist(searchResults);
    playTrack(track);
  };

  /**
   * Handle category click
   */
  const handleCategoryClick = (categoryName: string) => {
    setSearchQuery(categoryName.toLowerCase());
  };

  /**
   * Handle add to playlist
   */
  const handleAddToPlaylist = (track: Track) => {
    setSelectedTrack(track);
    setIsAddToPlaylistOpen(true);
  };

  /**
   * Handle toggle like
   */
  const handleToggleLike = (track: Track) => {
    toggleLike(track);
  };

  /**
   * Handle download
   */
  const handleDownload = async (track: Track) => {
    try {
      await downloadTrack(track);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl md:text-3xl font-bold">Search</h1>

      {/* Search Input */}
      <div className="relative sticky top-0 md:static z-30">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="text-zinc-500" size={20} />
        </div>
        <input
          type="text"
          placeholder="What do you want to listen to?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white text-black py-3 pl-10 pr-4 rounded-full font-medium focus:outline-none placeholder-zinc-500"
        />
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div>
          {isSearching && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-400">Searching YouTube Music...</p>
              </div>
            </div>
          )}

          {searchError && !isSearching && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-center">
              <p className="text-red-400">❌ {searchError}</p>
              <button
                onClick={() => handleSearch(searchQuery)}
                className="mt-2 text-sm text-[#1DB954] hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {!isSearching && !searchError && searchResults.length === 0 && (
            <div className="text-center py-20">
              <p className="text-zinc-400 text-lg">No results found for "{searchQuery}"</p>
              <p className="text-zinc-500 text-sm mt-2">Try different keywords</p>
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">
                Results for "{searchQuery}" ({searchResults.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {searchResults.map((track) => (
                  <div
                    key={track.id}
                    className="bg-zinc-900 bg-opacity-40 p-4 rounded-lg hover:bg-zinc-800 transition group cursor-pointer relative"
                  >
                    {/* Three-dot menu - Top right */}
                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition">
                      <TrackOptionsMenu
                        track={track}
                        onAddToPlaylist={handleAddToPlaylist}
                        onToggleLike={handleToggleLike}
                        onDownload={handleDownload}
                        isLiked={isLiked(track.id)}
                        isDownloaded={isDownloaded(track.id)}
                      />
                    </div>

                    <div onClick={() => handleTrackClick(track)}>
                      <div className="relative mb-4 aspect-square shadow-lg overflow-hidden rounded-md">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="object-cover w-full h-full transition duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center">
                          <div className="bg-[#1DB954] p-3 rounded-full opacity-0 group-hover:opacity-100 transition">
                            <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-bold text-sm truncate mb-1">{track.title}</h3>
                      <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Browse Categories */}
      {!hasSearched && (
        <>
          <h2 className="text-xl font-bold mt-8 mb-4">Browse all</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((category) => (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category.name)}
                className={`${category.color} aspect-[3/2] md:aspect-square p-4 rounded-lg relative overflow-hidden hover:scale-[1.02] transition cursor-pointer group`}
              >
                <span className="text-xl font-bold">{category.name}</span>
                <img
                  src={`https://picsum.photos/seed/${category.id}/200/200`}
                  alt=""
                  className="absolute -bottom-4 -right-4 w-24 h-24 md:w-32 md:h-32 rotate-[25deg] shadow-xl group-hover:rotate-[15deg] transition duration-300"
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={isAddToPlaylistOpen}
        onClose={() => {
          setIsAddToPlaylistOpen(false);
          setSelectedTrack(null);
        }}
        track={selectedTrack}
      />
    </div>
  );
};

export default Search;