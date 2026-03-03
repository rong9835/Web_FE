'use client';

/**
 * @fileoverview 영상 미리보기 컴포넌트
 * 
 * 첨부된 영상의 썸네일을 표시하는 컴포넌트입니다.
 * Canvas API를 사용하여 비디오 중간 프레임을 썸네일로 추출합니다.
 * 
 * Figma 디자인 스펙:
 * - 영상 미리보기: node-id=599:6527
 * 
 * TODO: 비디오 재생 기능 추가
 * - 재생/일시정지 버튼
 * - 재생 바 (progress bar)
 * - 재생 시간 표시
 * 
 * @module commons/components/video-preview
 */

import React, { useState, useEffect } from 'react';
import { RiCloseLine, RiVideoLine } from '@remixicon/react';
import type { VideoPreviewProps } from './types';
import styles from './styles.module.css';

/**
 * 비디오에서 썸네일 생성 (Canvas API 사용)
 * @param videoUrl - 비디오 Blob URL
 * @param seekTime - 시크할 시간 (초), 기본값은 중간 지점
 * @returns 썸네일 이미지 URL (Promise)
 */
const generateThumbnail = (videoUrl: string, seekTime?: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // js-early-exit: 조기 반환으로 중첩 감소
    if (!ctx) {
      reject(new Error('Canvas context를 가져올 수 없습니다.'));
      return;
    }

    // 비디오 설정
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    let hasError = false;
    let timeoutId: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    video.onloadedmetadata = () => {
      // seekTime이 지정되어 있으면 그 시간으로, 아니면 중간 지점으로
      if (seekTime !== undefined) {
        video.currentTime = seekTime;
      } else if (video.duration && video.duration > 0) {
        video.currentTime = Math.min(video.duration / 2, video.duration - 0.1);
      } else {
        video.currentTime = 0.1; // 첫 프레임 근처
      }
    };

    video.onseeked = () => {
      if (hasError) return;

      try {
        // Canvas 크기를 비디오 크기에 맞춤
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        // 현재 프레임을 Canvas에 그리기
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Canvas를 Blob으로 변환 후 URL 생성
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) {
              resolve(URL.createObjectURL(blob));
            } else {
              reject(new Error('썸네일 Blob 생성 실패'));
            }
          },
          'image/jpeg',
          0.85
        );
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    video.onerror = () => {
      hasError = true;
      cleanup();
      reject(new Error(`비디오 로드 실패: ${video.error?.message || '알 수 없는 오류'}`));
    };

    video.onloadeddata = () => {
      cleanup();
    };

    // 타임아웃 설정 (10초)
    timeoutId = setTimeout(() => {
      if (!hasError) {
        hasError = true;
        reject(new Error('썸네일 생성 시간 초과'));
      }
    }, 10000);

    // 비디오 소스 설정
    video.src = videoUrl;
    video.load();
  });
};

/**
 * 영상 미리보기 컴포넌트
 * Canvas API로 중간 프레임을 썸네일로 추출
 * 실패 시 첫 프레임으로 재시도
 */
export function VideoPreview({ videoUrl, onDelete }: VideoPreviewProps) {
  // rerender-lazy-state-init: 초기 상태를 함수로 전달하여 불필요한 계산 방지
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(() => true);
  const [hasError, setHasError] = useState(() => false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    let currentThumbnailUrl = '';

    const loadThumbnail = async () => {
      // js-early-exit: videoUrl이 없으면 조기 반환
      if (!videoUrl) {
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
          setErrorMessage('비디오 URL이 없습니다');
        }
        return;
      }
      
      try {
        setIsLoading(true);
        setHasError(false);
        setErrorMessage('');
        
        // 중간 프레임으로 시도
        let thumbnail: string;
        try {
          thumbnail = await generateThumbnail(videoUrl);
        } catch {
          // 중간 프레임 실패 시 첫 프레임으로 재시도
          thumbnail = await generateThumbnail(videoUrl, 0.1);
        }
        
        currentThumbnailUrl = thumbnail;
        
        if (isMounted) {
          setThumbnailUrl(thumbnail);
          setIsLoading(false);
        }
      } catch (error) {
        // 모든 시도 실패 시 에러 표시
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
          
          // 사용자 친화적인 에러 메시지
          const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류';
          if (errorMsg.includes('DEMUXER_ERROR') || errorMsg.includes('비디오 로드 실패')) {
            setErrorMessage('이 비디오 형식은 미리보기를 지원하지 않습니다');
          } else {
            setErrorMessage('썸네일을 생성할 수 없습니다');
          }
        }
      }
    };

    loadThumbnail();

    // 클린업: 생성된 썸네일 URL 해제
    return () => {
      isMounted = false;
      if (currentThumbnailUrl) {
        URL.revokeObjectURL(currentThumbnailUrl);
      }
    };
  }, [videoUrl]);

  return (
    <div className={styles.videoPreviewContainer}>
      {/* 비디오 썸네일 */}
      <div className={styles.videoThumbnail}>
        {isLoading && (
          <div className={styles.loadingMessage}>
            썸네일 생성 중...
          </div>
        )}

        {hasError && (
          <div className={styles.errorPlaceholder}>
            <RiVideoLine size={48} className={styles.videoIcon} />
            <div className={styles.errorText}>
              {errorMessage || '썸네일을 생성할 수 없습니다'}
            </div>
          </div>
        )}

        {!isLoading && !hasError && thumbnailUrl && (
          <img 
            src={thumbnailUrl}
            alt="비디오 썸네일"
            className={styles.previewImage}
          />
        )}

        {/* TODO: 재생 버튼 추가 예정 */}
        
        {/* 삭제 버튼 (우측 상단) */}
        <button
          className={styles.previewDeleteBtn}
          onClick={onDelete}
          type="button"
          aria-label="동영상 삭제"
        >
          <RiCloseLine size={16} />
        </button>
      </div>
    </div>
  );
}
