'use client';

import React, { useEffect } from 'react';
import { RiCloseLine } from '@remixicon/react';
import { Modal } from '@/commons/components/modal';
import { AudioPlayer } from '@/commons/components/audio-player';
import { VideoPlayer } from '@/commons/components/video-player';
import { MediaImage } from '@/commons/components/media-image';
import type { CapsuleDetailModalProps } from './types';
import type { CapsuleDetailSlot } from '@/commons/apis/capsules/my-capsules/types';
import { Spinner } from '@/commons/components/spinner';
import styles from './styles.module.css';

export function CapsuleDetailModal({
  visible,
  capsuleId: _capsuleId,
  title,
  slots,
  selectedSlotIndex,
  onSelectSlot,
  onClose,
  isLoading = false,
  errorMessage = null,
}: CapsuleDetailModalProps) {
  // slots는 이미 writtenSlots만 전달받음
  const selectedSlot: CapsuleDetailSlot | undefined = slots[selectedSlotIndex];
  const content = selectedSlot?.content;

  // 디버깅: content 확인
  useEffect(() => {
    if (content && process.env.NODE_ENV === 'development') {
      console.log('[CapsuleDetailModal] Content:', {
        hasText: !!content.text,
        hasImages: !!content.images?.length,
        hasVideo: !!content.video,
        hasAudio: !!content.audio,
        videoData: content.video,
        audioData: content.audio,
      });
    }
  }, [content]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (visible) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      width={375}
      closeOnBackdropPress
      padding={0}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="닫기"
          >
            <RiCloseLine size={24} />
          </button>
        </div>
        {slots.length > 0 && (
          <div className={styles.avatars}>
            {slots.map((slot, index) => (
              <button
                key={slot.slotId}
                type="button"
                className={`${styles.avatar} ${index === selectedSlotIndex ? styles.avatarActive : ''}`}
                onClick={() => onSelectSlot(index)}
              >
                <span className={styles.avatarEmoji}>{slot.author.emoji}</span>
                <span className={styles.avatarName}>{slot.author.name}</span>
              </button>
            ))}
          </div>
        )}
        <div className={styles.content}>
          {isLoading && (
            <div className={styles.loadingWrap}>
              <Spinner />
            </div>
          )}
          {!isLoading && errorMessage && (
            <p className={styles.error}>{errorMessage}</p>
          )}
          {!isLoading && !errorMessage && !selectedSlot && (
            <p className={styles.empty}>선택된 참여자가 없어요</p>
          )}
          {!isLoading && !errorMessage && selectedSlot && content && (
            <>
              {content.text && (
                <div className={styles.text}>{content.text}</div>
              )}
              {content.images && content.images.length > 0 && (
                <div className={styles.images}>
                  {content.images.map((img) => (
                    <MediaImage
                      key={img.id}
                      mediaId={img.url}
                      alt=""
                      className={styles.image}
                    />
                  ))}
                </div>
              )}
              {content.video && (
                <div className={styles.videoWrap}>
                  <VideoPlayer
                    mediaId={content.video.url}
                    thumbnailUrl={content.video.thumbnailUrl}
                  />
                </div>
              )}
              {content.audio && (
                <div className={styles.audioWrap}>
                  <AudioPlayer mediaId={content.audio.url} />
                </div>
              )}
              {!content.text && !content.images?.length && !content.video && !content.audio && (
                <p className={styles.empty}>작성된 내용이 없어요</p>
              )}
            </>
          )}
          {!isLoading && !errorMessage && selectedSlot && !content && (
            <p className={styles.empty}>작성된 내용이 없어요</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
