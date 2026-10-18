import { usePlayer } from '../context/PlayerContext.jsx'
import { useTheme } from '../../theme/context/ThemeContext.jsx'

export default function GlobalPlayer() {
  const { theme } = useTheme()
  const { currentTrack, isPlaying, togglePlayback, playAdjacentTrack, canPlayPrevious, canPlayNext } = usePlayer()

  return (
    <div className={`mini-player global-player ${theme}-theme`}>
      {currentTrack?.musicCoverImageUrl ? (
        <img className={`now-playing-art now-playing-image ${isPlaying ? 'is-playing' : ''}`} src={currentTrack.musicCoverImageUrl} alt="" />
      ) : (
        <div className={`now-playing-art ${isPlaying ? 'is-playing' : ''}`}>♫</div>
      )}
      <div className="now-playing">
        <strong>{currentTrack?.title || 'Choose a song'}</strong>
        <span>{currentTrack?.artist || 'Loopify'}</span>
      </div>
      <div className="global-player-controls">
        <button className="global-player-skip" type="button" onClick={() => playAdjacentTrack(-1)} disabled={!canPlayPrevious} aria-label="Previous song">|◀</button>
        <button className={`global-player-toggle ${isPlaying ? 'is-playing' : ''}`} type="button" onClick={togglePlayback} disabled={!currentTrack} aria-label={isPlaying ? 'Pause song' : 'Play song'}>{isPlaying ? 'Ⅱ' : '▶'}</button>
        <button className="global-player-skip" type="button" onClick={() => playAdjacentTrack(1)} disabled={!canPlayNext} aria-label="Next song">▶|</button>
      </div>
      <div className="player-status-wrapper">
        {isPlaying && (
          <span className="global-equalizer-bars" aria-label="Audio playing">
            <span className="eq-bar bar-1" />
            <span className="eq-bar bar-2" />
            <span className="eq-bar bar-3" />
            <span className="eq-bar bar-4" />
          </span>
        )}
        <span className="player-placeholder">{currentTrack ? (isPlaying ? 'Playing' : 'Paused') : 'Select a song to play'}</span>
      </div>
    </div>
  )
}
