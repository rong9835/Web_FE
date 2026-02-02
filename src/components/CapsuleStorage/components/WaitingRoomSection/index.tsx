'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { RiUserLine } from '@remixicon/react';
import { formatRemainingTime } from '@/commons/utils/date';
import type { WaitingRoomSectionProps } from './types';
import styles from './styles.module.css';

export function WaitingRoomSection({
  capsules,
  onCardClick,
}: WaitingRoomSectionProps) {
  const router = useRouter();

  const handleClick = (capsuleId: string) => {
    onCardClick(capsuleId);
    router.push(`/waiting-room/${capsuleId}`);
  };

  if (capsules.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>캡슐 대기실</h2>
          <span className={styles.count}>0개</span>
        </div>
        <p className={styles.empty}>캡슐이 없어요</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>캡슐 대기실</h2>
        <span className={styles.count}>{capsules.length}개</span>
      </div>
      <div className={styles.scrollWrap}>
        <div className={styles.cardList}>
          {capsules.map((capsule) => {
            const progressPercent =
              capsule.participantCount > 0
                ? (capsule.completedCount / capsule.participantCount) * 100
                : 0;

            return (
              <button
                key={capsule.id}
                type="button"
                className={styles.card}
                onClick={() => handleClick(capsule.id)}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>{capsule.title}</div>
                </div>

                {/* 진행 상황 섹션 */}
                <div className={styles.progressSection}>
                  <div className={styles.progressLabelRow}>
                    <span className={styles.progressLabel}>진행 상황</span>
                    <span className={styles.progressValue}>
                      {capsule.completedCount}/{capsule.participantCount}
                    </span>
                  </div>
                  <div className={styles.progressBarContainer}>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 참여자 아이콘 섹션 */}
                <div className={styles.participantsSection}>
                  {capsule.participantCount <= 10 ? (
                    // 10명 이하: 아이콘으로 표시
                    Array.from({ length: capsule.participantCount }).map((_, index) => (
                      <div
                        key={index}
                        className={
                          index < capsule.completedCount
                            ? styles.participantIconCompleted
                            : styles.participantIconPending
                        }
                      >
                        <RiUserLine
                          size={14}
                          className={
                            index < capsule.completedCount
                              ? styles.iconCompleted
                              : styles.iconPending
                          }
                        />
                      </div>
                    ))
                  ) : (
                    // 10명 초과: 9개 아이콘 + "+N" 표시
                    <>
                      {Array.from({ length: 9 }).map((_, index) => (
                        <div
                          key={index}
                          className={
                            index < capsule.completedCount
                              ? styles.participantIconCompleted
                              : styles.participantIconPending
                          }
                        >
                          <RiUserLine
                            size={14}
                            className={
                              index < capsule.completedCount
                                ? styles.iconCompleted
                                : styles.iconPending
                            }
                          />
                        </div>
                      ))}
                      <div className={styles.participantMore}>
                        <span className={styles.participantMoreText}>
                          +{capsule.participantCount - 9}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* 남은 시간 섹션 */}
                <div className={styles.timeSection}>
                  <div className={styles.timeSectionContent}>
                    <span className={styles.timeLabel}>남은 시간</span>
                    <span className={styles.timeValue}>
                      {formatRemainingTime(capsule.deadline)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
