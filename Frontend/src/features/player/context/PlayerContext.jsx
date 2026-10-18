/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { getSocket } from '../../../shared/services/socketClient.js'

const PlayerContext = createContext(null)
const PlayerProgressContext = createContext(null)

export function PlayerProvider({ children }) {
  const audioRef = useRef(null)
  const [currentTrack, setCurrentTrack] = useState(null)
  const currentTrackRef = useRef(currentTrack)
  const [queue, setQueue] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackError, setPlaybackError] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [speed, setSpeed] = useState(1)
  const shouldAutoplayRef = useRef(false)
  const skipNextPlayBroadcastRef = useRef(false)

  useEffect(() => {
    currentTrackRef.current = currentTrack
  }, [currentTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.playbackRate = speed
  }, [speed])

  useEffect(() => {
    if (!currentTrack || !shouldAutoplayRef.current) return
    shouldAutoplayRef.current = false
    audioRef.current?.play().catch(error => {
      skipNextPlayBroadcastRef.current = false
      setPlaybackError(error.name === 'NotAllowedError'
        ? 'Autoplay was blocked by your browser. Press Play to start the song.'
        : 'Could not play this song. Please try again.')
      setIsPlaying(false)
    })
  }, [currentTrack])

  const selectTrack = useCallback((track, autoplay = false, broadcast = true) => {
    skipNextPlayBroadcastRef.current = autoplay
    const musicId = track?._id || track?.musicKey
    if (broadcast && musicId) getSocket()?.emit('change-song', { musicId: String(musicId) })
    setCurrentTrack(track)
    setCurrentTime(0)
    setDuration(0)
    setPlaybackError('')
    shouldAutoplayRef.current = autoplay
  }, [])

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return
    if (audio.paused) audio.play().catch(error => {
      skipNextPlayBroadcastRef.current = false
      setPlaybackError(error.name === 'NotAllowedError'
        ? 'Playback was blocked by your browser. Try pressing Play again.'
        : 'Could not play this song. Please try again.')
      setIsPlaying(false)
    })
    else {
      audio.pause()
      const musicId = currentTrack?._id || currentTrack?.musicKey
      if (musicId) getSocket()?.emit('pause', { musicId: String(musicId), position: audio.currentTime })
    }
  }, [currentTrack])

  const seek = useCallback((nextTime) => {
    if (audioRef.current) audioRef.current.currentTime = nextTime
    setCurrentTime(nextTime)
  }, [])

  const clearTrack = useCallback(() => {
    audioRef.current?.pause()
    setCurrentTrack(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setPlaybackError('')
  }, [])

  const pauseFromRemote = useCallback((musicId, position) => {
    const audio = audioRef.current
    const track = currentTrackRef.current
    const currentMusicId = track?._id || track?.musicKey
    if (!audio || String(currentMusicId) !== String(musicId)) return
    if (typeof position === 'number' && Number.isFinite(position)) audio.currentTime = position
    if (!audio.paused) audio.pause()
  }, [])

  const playFromRemote = useCallback((position) => {
    const audio = audioRef.current
    if (!audio) return
    if (typeof position === 'number' && Number.isFinite(position)) audio.currentTime = position
    skipNextPlayBroadcastRef.current = true
    audio.play().catch(error => {
      skipNextPlayBroadcastRef.current = false
      setPlaybackError(error.name === 'NotAllowedError'
        ? 'Autoplay was blocked by your browser. Press Play to start the song.'
        : 'Could not play this song. Please try again.')
      setIsPlaying(false)
    })
  }, [])

  const handleAudioPlay = useCallback(() => {
    setIsPlaying(true)
    setPlaybackError('')
    if (skipNextPlayBroadcastRef.current) {
      skipNextPlayBroadcastRef.current = false
      return
    }
    const musicId = currentTrack?._id || currentTrack?.musicKey
    if (musicId) {
      getSocket()?.emit('play', {
        musicId: String(musicId),
        position: audioRef.current?.currentTime || 0,
      })
    }
  }, [currentTrack])

  const handleAudioPause = useCallback(() => setIsPlaying(false), [])

  const currentIndex = queue.findIndex(item => String(item._id || item.musicKey) === String(currentTrack?._id || currentTrack?.musicKey))
  const canPlayPrevious = currentIndex > 0
  const canPlayNext = currentIndex >= 0 && currentIndex < queue.length - 1

  const playAdjacentTrack = useCallback((direction) => {
    const index = queue.findIndex(item => String(item._id || item.musicKey) === String(currentTrack?._id || currentTrack?.musicKey))
    const nextTrack = queue[index + direction]
    if (nextTrack) selectTrack(nextTrack, true)
  }, [currentTrack, queue, selectTrack])

  const player = useMemo(() => ({
    currentTrack,
    isPlaying,
    volume,
    speed,
    playbackError,
    selectTrack,
    togglePlayback,
    seek,
    setVolume,
    setSpeed,
    clearTrack,
    pauseFromRemote,
    playFromRemote,
    setQueue,
    playAdjacentTrack,
    canPlayPrevious,
    canPlayNext,
  }), [currentTrack, isPlaying, volume, speed, playbackError, selectTrack, togglePlayback, seek, clearTrack, pauseFromRemote, playFromRemote, playAdjacentTrack, canPlayPrevious, canPlayNext])

  const progress = useMemo(() => ({ currentTime, duration }), [currentTime, duration])

  return (
    <PlayerContext.Provider value={player}>
      <PlayerProgressContext.Provider value={progress}>
        {children}
        <audio ref={audioRef} src={currentTrack?.musicUrl} preload="metadata" onPlay={handleAudioPlay} onPause={handleAudioPause} onEnded={() => setIsPlaying(false)} onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)} onLoadedMetadata={event => setDuration(event.currentTarget.duration)} />
      </PlayerProgressContext.Provider>
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const player = useContext(PlayerContext)
  if (!player) throw new Error('usePlayer must be used within PlayerProvider')
  return player
}

export function usePlayerProgress() {
  const progress = useContext(PlayerProgressContext)
  if (!progress) throw new Error('usePlayerProgress must be used within PlayerProvider')
  return progress
}
