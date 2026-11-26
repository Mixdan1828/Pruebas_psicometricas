"use client";

import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { Play, Pause, Volume2, Volume1, VolumeX, SkipBack, SkipForward, Maximize, Minimize } from 'lucide-react';

export const VIDEO_INTRO = 'https://kzkekschzubgcbqwpfpz.supabase.co/storage/v1/object/public/TEST_VIDEOS_MAP/Introduccion%20a%20pruebas.mp4';
export const VIDEO_OUTRO = 'https://kzkekschzubgcbqwpfpz.supabase.co/storage/v1/object/public/TEST_VIDEOS_MAP/Despedida.mp4';

interface VideoPlaylistPlayerProps {
  playlist: string[];
  onComplete: () => void;
}

export const VideoPlaylistPlayer = memo(function VideoPlaylistPlayer({ playlist, onComplete }: VideoPlaylistPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const currentVideo = playlist[currentIndex];

  const playVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true));
    }
  }, []);

  const pauseVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const nextVideo = useCallback(() => {
    if (currentIndex < playlist.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentTime(0);
    } else {
      onComplete();
    }
  }, [currentIndex, playlist.length, onComplete]);

  const handleEnded = useCallback(() => nextVideo(), [nextVideo]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pauseVideo();
    else playVideo();
  }, [isPlaying, pauseVideo, playVideo]);

  const setVolumeLevel = useCallback(
    (val: number) => {
      setVolumeState(val);
      setIsMuted(val === 0);
      if (videoRef.current) {
        videoRef.current.volume = val;
        videoRef.current.muted = val === 0;
      }
    },
    []
  );

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      setVolumeState(newMuted ? 0 : volume);
    }
  }, [volume]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!isFullscreen) {
      video.requestFullscreen?.().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false));
    }
  }, [isFullscreen]);

  return (
    <div className="bg-[#123440] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
      <div className="relative aspect-video bg-black group flex-shrink-0">
        <video
          ref={videoRef}
          src={currentVideo}
          autoPlay
          playsInline
          onEnded={handleEnded}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          className="w-full h-full object-cover"
          muted={isMuted}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          {!isPlaying && (
            <div
              className="bg-black/40 text-white p-6 rounded-full hover:bg-black/60 transition-all cursor-pointer"
              onClick={togglePlay}
            >
              <Play size={48} fill="white" />
            </div>
          )}
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 cursor-pointer group-hover:bg-white/40 transition-all"
          onClick={(e) => {
            if (videoRef.current) {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              videoRef.current.currentTime = duration * pos;
            }
          }}
        >
          <div
            className="h-full bg-[#beee89] transition-all duration-100"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        <div className="absolute top-4 left-4 right-4 flex justify-between items-start px-4">
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-white font-medium border border-white/10">
            <span>Video {currentIndex + 1} de {playlist.length}</span>
          </div>
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-white font-medium border border-white/10">
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
        </div>

        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm p-3 rounded-full hover:bg-black/80 transition-all cursor-pointer"
          onClick={togglePlay}
        >
          {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
        </div>
      </div>

      <div className="p-4 bg-[#123440] border-t border-slate-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (currentIndex > 0) {
                setCurrentIndex((prev) => prev - 1);
                setCurrentTime(0);
              }
            }}
            disabled={currentIndex === 0}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <SkipBack size={20} />
          </button>
          <button onClick={togglePlay} className="p-2 text-white hover:text-[#beee89] transition-all">
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            onClick={() => {
              if (currentIndex < playlist.length - 1) {
                setCurrentIndex((prev) => prev + 1);
                setCurrentTime(0);
              }
            }}
            disabled={currentIndex === playlist.length - 1}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <SkipForward size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleMute} className="p-2 text-slate-400 hover:text-white transition-all">
            {isMuted ? <VolumeX size={20} fill="white" /> : volume > 0.5 ? <Volume2 size={20} fill="white" /> : <Volume1 size={20} fill="white" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
            className="w-24 accent-[#beee89] cursor-pointer"
          />
        </div>

        <button onClick={toggleFullscreen} className="p-2 text-slate-400 hover:text-white transition-all">
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>

      <div className="flex gap-1 p-4 bg-[#123440] border-t border-slate-200 justify-center flex-shrink-0">
        {playlist.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${i === currentIndex ? 'bg-white ring-2 ring-[#beee89]' : 'bg-slate-600'}`}
          />
        ))}
      </div>
    </div>
  );
});

VideoPlaylistPlayer.displayName = 'VideoPlaylistPlayer';