import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, FastForward, Calendar, Clock } from 'lucide-react';
import { GraphEdge } from '../types';

interface TimelineScrubberProps {
  edges?: GraphEdge[];
  currentDateIndex: number;
  setCurrentDateIndex: React.Dispatch<React.SetStateAction<number>> | ((index: number | ((prev: number) => number)) => void);
  uniqueTimestamps: string[];
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  edges,
  currentDateIndex,
  setCurrentDateIndex,
  uniqueTimestamps
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentDateIndex(prev => {
          if (prev >= uniqueTimestamps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, uniqueTimestamps.length, setCurrentDateIndex]);

  if (uniqueTimestamps.length === 0) return null;

  const currentTs = uniqueTimestamps[currentDateIndex] || uniqueTimestamps[0];

  return (
    <div 
      className="glass-panel"
      style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        zIndex: 10,
        minWidth: '480px',
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      {/* Play / Pause / Reset Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="btn-primary"
          style={{ padding: '8px', borderRadius: 'var(--radius-full)' }}
          title={isPlaying ? 'Pause Replay' : 'Play Historical Syndicate Timeline'}
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button
          onClick={() => {
            setIsPlaying(false);
            setCurrentDateIndex(0);
          }}
          className="btn-secondary"
          style={{ padding: '8px', borderRadius: 'var(--radius-full)' }}
          title="Reset to Genesis"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Date Display */}
      <div style={{ minWidth: '160px' }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={11} /> Crime Timeline Playback
        </div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>
          {currentTs}
        </div>
      </div>

      {/* Range Scrubber */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="range"
          min={0}
          max={uniqueTimestamps.length - 1}
          value={currentDateIndex}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentDateIndex(Number(e.target.value));
          }}
          style={{
            width: '100%',
            accentColor: 'var(--text-accent)',
            cursor: 'pointer'
          }}
        />
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', minWidth: '40px', textAlign: 'right' }}>
          {currentDateIndex + 1}/{uniqueTimestamps.length}
        </span>
      </div>
    </div>
  );
};
