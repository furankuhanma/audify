import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { Playlist, Track } from "../types/types";
import { usePlayer } from "../context/PlayerContext";
import { useLibrary } from "../context/LibraryContext";
import { useLikes } from "../context/LikeContext";
import { useDownloads } from "../context/DownloadContext";
import { useHistory } from "../context/HistoryContext"; // ✅ NEW
import { searchAPI } from "../services/api";
import TrackOptionsMenu from "../components/TrackOptionsMenu";
import AddToPlaylistModal from "../components/AddToPlayListModal";
import { WifiOff } from "lucide-react";

interface PlaylistCardProps {
  playlist: Playlist;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist }) => {
  console.log("Hello World");
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/playlist/${playlist.id}`)}
      className="bg-zinc-900 bg-opacity-40 p-4 rounded-lg hover:bg-zinc-800 transition group cursor-pointer w-[160px] md:w-[200px] flex-shrink-0"
    >
      <div className="relative mb-4 aspect-square shadow-lg overflow-hidden rounded-md">
        <img
          src={playlist.coverUrl}
          alt={playlist.name}
          className="object-cover w-full h-full"
        />
        <button className="absolute bottom-2 right-2 bg-blue-400 p-3 rounded-full shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition duration-300">
          <Play size={20} className="text-black fill-current" />
        </button>
      </div>
      <h3 className="font-bold text-sm md:text-base truncate mb-1">
        {playlist.name}
      </h3>
      <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
        {playlist.description}
      </p>
    </div>
  );
};

interface TrackCardProps {
  track: Track;
  onAddToPlaylist: (track: Track) => void;
  onToggleLike: (track: Track) => void;
  onDownload: (track: Track) => void;
  isLiked: boolean;
  isDownloaded: boolean;
  isPlaylistModalOpen: boolean;
}

const TrackCard: React.FC<TrackCardProps> = ({
  track,
  onAddToPlaylist,
  onToggleLike,
  onDownload,
  isLiked,
  isDownloaded,
  isPlaylistModalOpen,
}) => {
  const { playTrack } = usePlayer();

  return (
    <div className="bg-zinc-900 bg-opacity-40 p-3 rounded-lg hover:bg-zinc-800 transition group cursor-pointer w-[140px] md:w-[180px] flex-shrink-0 relative z-0 hover:z-50">
      {/* Three-dot menu */}
      <div
        className={`absolute top-2 right-2 z-10 transition-opacity duration-200 ${
          isPlaylistModalOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <TrackOptionsMenu
          track={track}
          onAddToPlaylist={onAddToPlaylist}
          onToggleLike={onToggleLike}
          onDownload={onDownload}
          isLiked={isLiked}
          isDownloaded={isDownloaded}
        />
      </div>

      {/* Track card content */}
      <div onClick={() => playTrack(track)}>
        <div className="relative mb-3 aspect-square shadow-md overflow-hidden rounded-lg">
          <img
            src={track.coverUrl}
            alt={track.title}
            className="object-cover w-full h-full transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
            <button className="bg-blue-400 p-3 rounded-full shadow-2xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition duration-300">
              <Play size={20} className="text-black fill-current" />
            </button>
          </div>
        </div>
        <h3 className="font-bold text-xs md:text-sm truncate text-white">
          {track.title}
        </h3>
        <p className="text-[10px] md:text-xs text-zinc-400 truncate mt-0.5">
          {track.artist}
        </p>
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const { playlists, isLoading: playlistsLoading } = useLibrary();
  const { setPlaylist } = usePlayer();
  const { isLiked, toggleLike, likedTracks } = useLikes();
  const { isDownloaded, downloadTrack } = useDownloads();
  const { getRecentTracks } = useHistory(); // ✅ NEW

  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [trendingError, setTrendingError] = useState<string | null>(null);

  // Modal state
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const [showRetry, setShowRetry] = useState(false);

  // ✅ Get recently played tracks
  const recentlyPlayed = getRecentTracks(10);

  // Load trending music on mount
  useEffect(() => {
    loadTrending();
  }, []);

  /**
   * Load trending music from backend
   */
  const loadTrending = async () => {
    setIsLoadingTrending(true);
    setTrendingError(null);
    setShowRetry(false);

    const errorDelay = 5000;
    const startTime = Date.now();

    try {
      console.log("🔥 Loading trending music...");
      const tracks = await searchAPI.getTrending();

      setTrendingTracks(tracks);
      console.log(`✅ Loaded ${tracks.length} trending tracks`);
      setIsLoadingTrending(false);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to load trending";

      console.error("❌ Failed to load trending:", errorMsg);
      setTrendingError(errorMsg);

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(errorDelay - elapsed, 0);

      setTimeout(() => {
        setIsLoadingTrending(false);
        setShowRetry(true);
      }, remaining);
    }
  };

  /**
   * Handle playlist click from quick grid
   */
  const handleQuickPlaylistClick = (playlist: Playlist) => {
    if (playlist.tracks && playlist.tracks.length > 0) {
      setPlaylist(playlist.tracks);
    }
  };

  /**
   * Handle add to playlist
   */
  const handleAddToPlaylist = (track: Track) => {
    setSelectedTrack(track);
    setIsPlaylistModalOpen(true);
  };

  /**
   * Handle like toggle
   */
  const handleToggleLike = (track: Track) => {
    toggleLike(track);
  };

  /**
   * Handle download for offline
   */
  const handleDownload = async (track: Track) => {
    try {
      console.log(`📥 Saving for offline: ${track.title}`);
      await downloadTrack(track);
      console.log(`✅ Track saved to offline library: ${track.title}`);
    } catch (error: any) {
      console.error("❌ Offline download failed:", error);
      alert(`Failed to save for offline: ${error.message}`);
    }
  };

  // ✅ RANDOMIZE SECTIONS - Create sections array and shuffle
  const sections = useMemo(() => {
    const allSections = [];

    // Trending Section
    if (trendingTracks.length > 0) {
      allSections.push({
        id: "trending",
        title: "Trending Now",
        showRefresh: true,
        component: (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
            {trendingTracks.slice(0, 10).map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                onAddToPlaylist={handleAddToPlaylist}
                onToggleLike={handleToggleLike}
                onDownload={handleDownload}
                isLiked={isLiked(track.id)}
                isDownloaded={isDownloaded(track.id)}
                isPlaylistModalOpen={isPlaylistModalOpen}
              />
            ))}
          </div>
        ),
      });
    }

    // Recently Played Section
    if (recentlyPlayed.length > 0) {
      allSections.push({
        id: "recently-played",
        title: "Recently Played",
        component: (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
            {recentlyPlayed.map((track, index) => (
              <TrackCard
                key={track.historyId || `${track.id}-${index}`}
                track={track}
                onAddToPlaylist={handleAddToPlaylist}
                onToggleLike={handleToggleLike}
                onDownload={handleDownload}
                isLiked={isLiked(track.id)}
                isDownloaded={isDownloaded(track.id)}
                isPlaylistModalOpen={isPlaylistModalOpen}
              />
            ))}
          </div>
        ),
      });
    }

    // Liked Songs Section
    if (likedTracks.length > 0) {
      allSections.push({
        id: "liked-songs",
        title: "Your Liked Songs",
        component: (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
            {likedTracks.slice(0, 10).map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                onAddToPlaylist={handleAddToPlaylist}
                onToggleLike={handleToggleLike}
                onDownload={handleDownload}
                isLiked={true}
                isDownloaded={isDownloaded(track.id)}
                isPlaylistModalOpen={isPlaylistModalOpen}
              />
            ))}
          </div>
        ),
      });
    }

    // User's Playlists Section
    if (playlists.length > 0) {
      allSections.push({
        id: "your-playlists",
        title: "Your Playlists",
        component: (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {playlists.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        ),
      });
    }

    // ✅ Shuffle the sections randomly
    return allSections;
  }, [
    recentlyPlayed,
    likedTracks,
    playlists,
    trendingTracks,
    isPlaylistModalOpen,
  ]);

  const categories = ["All", "Music", "Podcasts"];
  const blueShades = [
    "bg-blue-700",
    "bg-blue-600",
    "bg-blue-500",
    "bg-blue-700",
    "bg-blue-800",
    "bg-blue-900",
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* 1. Greeting & Quick Grid */}
      <header>
        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
          {categories.map((c, index) => (
            <div
              key={c}
              className={`flex-shrink-0 p-2 px-4 rounded-2xl ${blueShades[index % blueShades.length]}`}
            >
              <p className="text-sm font-medium text-white">{c}</p>
            </div>
          ))}
        </div>

        <h1 className="text-2xl md:text-4xl font-black mb-6 tracking-tight mt-4">
          {greeting}
        </h1>

        {playlistsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-zinc-800 rounded overflow-hidden h-14 md:h-20 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {playlists.slice(0, 6).map((playlist) => (
              <div
                key={playlist.id}
                className="flex items-center gap-3 bg-white bg-opacity-5 rounded overflow-hidden hover:bg-white hover:bg-opacity-10 transition-all cursor-pointer group h-14 md:h-20"
                onClick={() => handleQuickPlaylistClick(playlist)}
              >
                <img
                  src={playlist.coverUrl}
                  alt=""
                  className="w-14 md:w-20 h-full object-cover shadow-2xl"
                />
                <span className="font-bold text-xs md:text-base pr-4 line-clamp-1">
                  {playlist.name}
                </span>
                <button className="ml-auto mr-4 bg-blue-400 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 shadow-xl hidden md:block">
                  <Play size={18} className="text-black fill-current" />
                </button>
              </div>
            ))}
          </div>
        )}
      </header>

      {/* ✅ RANDOMIZED SECTIONS */}
      {sections.map((section) => (
        <section key={section.id}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              {section.title}
            </h2>
            {section.showRefresh && !isLoadingTrending && !trendingError && (
              <button
                onClick={loadTrending}
                className="text-xs font-bold text-zinc-400 hover:text-white hover:underline"
              >
                Refresh
              </button>
            )}
          </div>

          {section.component}
        </section>
      ))}

      {/* Trending Loading State */}
      {isLoadingTrending && (
        <section>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-4">
            Loading...
          </h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-[140px] md:w-[180px] flex-shrink-0">
                <div className="aspect-square bg-zinc-800 rounded-lg mb-3 animate-pulse" />
                <div className="h-4 bg-zinc-800 rounded mb-2 animate-pulse" />
                <div className="h-3 bg-zinc-800 rounded w-2/3 animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trending Error State */}
      {!isLoadingTrending && trendingError && showRetry && (
        <section>
          <div className="rounded-lg p-4 text-center">
            <WifiOff className="mx-auto mb-2 text-red-400" size={32} />
            <button
              onClick={loadTrending}
              className="rounded-2xl font-bold bg-blue-600 p-2 pl-5 pr-5 mt-2 text-sm text-black hover:underline"
            >
              Try again
            </button>
          </div>
        </section>
      )}

      {/* Empty State - No Content */}
      {sections.length === 0 && !isLoadingTrending && (
        <section className="text-center py-20">
          <p className="text-zinc-400 text-lg mb-4">Start exploring music!</p>
          <p className="text-zinc-500 text-sm">
            Your listening history and favorites will appear here
          </p>
        </section>
      )}

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => {
          setIsPlaylistModalOpen(false);
          setSelectedTrack(null);
        }}
        track={selectedTrack}
      />
    </div>
  );
};

export default Home;
