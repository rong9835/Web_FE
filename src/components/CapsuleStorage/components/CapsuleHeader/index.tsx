'use client';

import React from 'react';
import { RiCloseLine } from '@remixicon/react';
import type { CapsuleHeaderProps } from './types';
import styles from './styles.module.css';

export function CapsuleHeader({
  openedCount,
  lockedCount,
  onClose,
}: CapsuleHeaderProps) {
  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>캡슐보관함</h1>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="닫기"
        >
          <RiCloseLine size={20} className={styles.closeIcon} />
        </button>
      </div>
      <p className={styles.subtitle}>
        열린 캡슐 {openedCount}개 · 잠긴 캡슐 {lockedCount}개
      </p>
    </div>
  );
}
