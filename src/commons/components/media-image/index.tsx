'use client';

import React, { useEffect, useState } from 'react';
import { getMediaUrl } from '@/commons/apis';

interface MediaImageProps {
  mediaId: string;
  alt?: string;
  className?: string;
}

/**
 * 미디어 ID를 받아서 자동으로 URL로 변환하여 이미지를 렌더링하는 컴포넌트
 * URL이면 그대로 사용하고, ID면 getMediaUrl API를 호출하여 URL을 가져옵니다.
 */
export function MediaImage({ mediaId, alt = '', className }: MediaImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // URL 확인 함수
  const isUrl = (value: string): boolean => {
    return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:');
  };

  useEffect(() => {
    if (!mediaId) {
      setUrl(null);
      return;
    }

    // 이미 URL이면 그대로 사용
    if (isUrl(mediaId)) {
      setUrl(mediaId);
      return;
    }

    // ID인 경우 URL로 변환
    const loadImageUrl = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getMediaUrl(mediaId);
        setUrl(response.url);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('이미지 URL 로드 실패');
        setError(error);
        if (process.env.NODE_ENV === 'development') {
          console.error('[MediaImage] 이미지 URL 로드 실패:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadImageUrl();
  }, [mediaId]);

  if (error) {
    return (
      <div className={className} style={{ background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100px' }}>
        <span style={{ color: '#999' }}>이미지를 불러올 수 없습니다</span>
      </div>
    );
  }

  if (isLoading || !url) {
    return (
      <div className={className} style={{ background: '#f0f0f0', minHeight: '100px' }} />
    );
  }

  return <img src={url} alt={alt} className={className} />;
}
