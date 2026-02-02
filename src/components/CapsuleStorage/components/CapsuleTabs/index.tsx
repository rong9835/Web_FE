'use client';

import React from 'react';
import type { CapsuleTabsProps, CapsuleTabType } from './types';
import styles from './styles.module.css';

export function CapsuleTabs({
  activeTab,
  openedCount,
  lockedCount,
  onTabChange,
}: CapsuleTabsProps) {
  return (
    <div className={styles.tabs}>
      <button
        type="button"
        className={activeTab === 'opened' ? styles.tabActive : styles.tab}
        onClick={() => onTabChange('opened' as CapsuleTabType)}
      >
        열린 캡슐 ({openedCount})
      </button>
      <button
        type="button"
        className={activeTab === 'locked' ? styles.tabActive : styles.tab}
        onClick={() => onTabChange('locked' as CapsuleTabType)}
      >
        잠긴 캡슐 ({lockedCount})
      </button>
    </div>
  );
}
