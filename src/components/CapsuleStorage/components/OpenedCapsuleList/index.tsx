'use client';

import React from 'react';
import { RiMapPinLine, RiCalendarLine, RiCalendarCheckLine } from '@remixicon/react';
import { formatCapsuleDate } from '@/commons/utils/date';
import type { OpenedCapsuleListProps } from './types';
import styles from './styles.module.css';

export function OpenedCapsuleList({
  capsules,
  onCardClick,
}: OpenedCapsuleListProps) {
  if (capsules.length === 0) {
    return (
      <div className={styles.list}>
        <p className={styles.empty}>열린 캡슐이 없어요</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {capsules.map((capsule) => (
        <button
          key={capsule.id}
          type="button"
          className={styles.card}
          onClick={() => onCardClick(capsule.id)}
        >
          <div className={styles.cardContent}>
            <div className={styles.iconContainer}>
              <span className={styles.emoji}>💊</span>
            </div>
            <div className={styles.cardInfo}>
              <div className={styles.titleContainer}>
                <h3 className={styles.title}>{capsule.title}</h3>
              </div>
              <div className={styles.details}>
                {capsule.location && (
                  <div className={styles.detailRow}>
                    <RiMapPinLine size={16} className={styles.icon} />
                    <span className={styles.detailText}>위치 정보</span>
                  </div>
                )}
                {capsule.createdAt && (
                  <div className={styles.detailRow}>
                    <RiCalendarLine size={16} className={styles.icon} />
                    <span className={styles.detailText}>
                      묻은 날짜: {formatCapsuleDate(capsule.createdAt)}
                    </span>
                  </div>
                )}
                {capsule.openDate && (
                  <div className={styles.detailRow}>
                    <RiCalendarCheckLine size={16} className={styles.icon} />
                    <span className={styles.detailText}>
                      열린 날짜: {formatCapsuleDate(capsule.openDate)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
