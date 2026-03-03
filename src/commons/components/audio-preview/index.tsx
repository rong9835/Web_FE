'use client';

/**
 * @fileoverview 음원 미리보기 컴포넌트
 * 
 * 첨부된 음원을 재생하고 미리보기할 수 있는 컴포넌트입니다.
 * 
 * Figma 디자인 스펙:
 * - 음원 미리보기: node-id=599:5660
 * 
 * @module commons/components/audio-preview
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { RiPlayCircleFill, RiPauseCircleFill, RiCloseLine } from '@remixicon/react';
import type { AudioPreviewProps } from './types';
import styles from './styles.module.css';

/**
 * 음원 미리보기 컴포넌트
 */
export function AudioPreview({ audioUrl, onDelete }: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  /**
   * 컴포넌트 언마운트 시 정리
   */
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, []);

  /**
   * 재생/일시정지 토글
   */
  const togglePlay = useCallback(async () => {
    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('오디오 재생 오류:', error);
        setIsPlaying(false);
      }
    }
  }, [isPlaying]);

  /**
   * 시간 포맷팅 (초 → MM:SS)
   */
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className={styles.audioPreview}>
      <button
        className={styles.audioPlayButton}
        onClick={togglePlay}
        type="button"
        aria-label={isPlaying ? '일시정지' : '재생'}
      >
        {isPlaying ? (
          <RiPauseCircleFill size={48} />
        ) : (
          <RiPlayCircleFill size={48} />
        )}
      </button>

      <div className={styles.audioInfo}>
        <div className={styles.audioProgressBar}>
          <div 
            className={styles.audioProgressFill}
            style={{ 
              width: duration > 0 
                ? `${(currentTime / duration) * 100}%` 
                : '0%' 
            }}
          />
        </div>
        <div className={styles.audioTime}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      <button
        className={styles.audioDeleteBtn}
        onClick={onDelete}
        type="button"
        aria-label="음원 삭제"
      >
        <RiCloseLine size={16} />
      </button>

      <audio
        ref={audioRef}
        src={audioUrl}
        preload="none"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
      />
    </div>
  );
}
