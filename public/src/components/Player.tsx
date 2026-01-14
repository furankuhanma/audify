
import React, { useState } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Repeat, Shuffle, 
  Volume2, Maximize2, ChevronDown, ListMusic 
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

const Player = () => {
  const { 
    currentTrack, isPlaying, progress, togglePlay, nextTrack, prevTrack, seek, volume, setVolume 
  } = usePlayer();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentTrack) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = (progress / currentTrack.duration) * 100;

  // Mobile Expanded Player
  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-[100] bg-gradient-to-b from-zinc-800 to-black p-8 flex flex-col items-center text-center animate-in slide-in-from-bottom duration-300">
        <button 
          onClick={() => setIsExpanded(false)}
          className="self-start mb-12 text-zinc-400 hover:text-white"
        >
          <ChevronDown size={32} />
        </button>

        <img 
          src={currentTrack.coverUrl} 
          alt={currentTrack.title}
          className="w-full max-w-[320px] aspect-square rounded-lg shadow-2xl mb-12"
        />

        <div className="w-full max-w-[320px] text-left mb-8">
          <h2 className="text-2xl font-bold truncate">{currentTrack.title}</h2>
          <p className="text-zinc-400 text-lg">{currentTrack.artist}</p>
        </div>

        <div className="w-full max-w-[320px] mb-8">
          <div className="h-1 bg-zinc-700 rounded-full w-full relative mb-2">
            <div 
              className="absolute h-full bg-white rounded-full" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-400">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(currentTrack.duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-8 mb-12">
          <Shuffle size={24} className="text-zinc-400" />
          <SkipBack size={32} className="fill-white" onClick={prevTrack} />
          <button 
            onClick={togglePlay}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-black"
          >
            {isPlaying ? <Pause size={40} className="fill-current" /> : <Play size={40} className="ml-1 fill-current" />}
          </button>
          <SkipForward size={32} className="fill-white" onClick={nextTrack} />
          <Repeat size={24} className="text-zinc-400" />
        </div>

        <div className="flex items-center justify-between w-full max-w-[320px] text-zinc-400">
          <ListMusic size={24} />
          <Volume2 size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-[64px] md:bottom-0 left-0 right-0 bg-blue-900 md:bg-zinc-900 border-t border-zinc-800 px-4 py-2 md:h-24 flex items-center justify-between z-40">
      {/* Track Info */}
      <div 
        className="flex items-center gap-4 flex-1 md:flex-initial cursor-pointer"
        onClick={() => setIsExpanded(window.innerWidth < 768)}
      >
        <img src={currentTrack.coverUrl} alt="" className="w-12 h-12 rounded-md object-cover" />
        <div className="flex flex-col overflow-hidden max-w-[150px] md:max-w-[200px]">
          <span className="text-sm font-medium text-white truncate">{currentTrack.title}</span>
          <span className="text-xs text-zinc-400 truncate">{currentTrack.artist}</span>
        </div>
      </div>

      {/* Playback Controls (Middle) */}
      <div className="hidden md:flex flex-col items-center gap-2 flex-1 max-w-[600px]">
        <div className="flex items-center gap-6">
          <Shuffle size={18} className="text-zinc-500 hover:text-white transition" />
          <SkipBack size={20} className="text-zinc-400 hover:text-white transition fill-current" onClick={prevTrack} />
          <button 
            onClick={togglePlay}
            className="bg-white text-black p-2 rounded-full hover:scale-105 transition"
          >
            {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="ml-0.5 fill-current" />}
          </button>
          <SkipForward size={20} className="text-zinc-400 hover:text-white transition fill-current" onClick={nextTrack} />
          <Repeat size={18} className="text-zinc-500 hover:text-white transition" />
        </div>
        <div className="w-full flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 w-8 text-right">{formatTime(progress)}</span>
          <div className="flex-1 h-1 bg-zinc-700 rounded-full relative group">
            <div 
              className="absolute h-full bg-[#1DB954] group-hover:bg-[#1ed760] rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-500 w-8">{formatTime(currentTrack.duration)}</span>
        </div>
      </div>

      {/* Extra Controls (Right) & Mobile Play Toggle */}
      <div className="flex items-center gap-4">
        {/* Mobile only play button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="md:hidden text-white"
        >
          {isPlaying ? <Pause size={28} /> : <Play size={28} />}
        </button>

        <div className="hidden md:flex items-center gap-4 text-zinc-400">
          <ListMusic size={18} className="hover:text-white cursor-pointer" />
          <div className="flex items-center gap-2 group w-32">
            <Volume2 size={18} />
            <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
               <div className="h-full bg-white group-hover:bg-[#1DB954]" style={{ width: '80%' }} />
            </div>
          </div>
          <Maximize2 size={18} className="hover:text-white cursor-pointer" />
        </div>
      </div>

      {/* Mobile progress bar (very thin at top of miniplayer) */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-800 md:hidden">
        <div 
          className="h-full bg-white" 
          style={{ width: `${progressPercent}%` }} 
        />
      </div>
    </div>
  );
};

export default Player;
