'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CapsuleHeader } from './components/CapsuleHeader';
import { WaitingRoomSection } from './components/WaitingRoomSection';
import { CapsuleTabs } from './components/CapsuleTabs';
import { OpenedCapsuleList } from './components/OpenedCapsuleList';
import { LockedCapsuleList } from './components/LockedCapsuleList';
import { CapsuleDetailModal } from './components/CapsuleDetailModal';
import type { CapsuleTabType } from './types';
import { useMyCapsules } from '@/commons/apis/me/capsules/hooks';
import { useCapsuleDetail } from '@/commons/apis/timecapsules/hooks';
import { Spinner } from '@/commons/components/spinner';
import styles from './styles.module.css';

export function CapsuleStorage() {
  const router = useRouter();
  const {
    waitingRooms,
    openedCapsules,
    lockedCapsules,
    isLoading,
    isError,
    refetch,
  } = useMyCapsules();

  const [activeTab, setActiveTab] = useState<CapsuleTabType>('opened');
  const [selectedCapsuleId, setSelectedCapsuleId] = useState<string | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);

  const {
    data: detailData,
    writtenSlots,
    isLoading: isDetailLoading,
    error: detailError,
  } = useCapsuleDetail(selectedCapsuleId);

  const selectedSlot = writtenSlots[selectedSlotIndex];

  // 에러 메시지 처리
  const detailErrorMessage = detailError || (!isDetailLoading && detailData && !selectedSlot ? '작성된 내용이 없어요' : null);

  const handleClose = () => {
    router.back();
  };

  const handleOpenedCardClick = (capsuleId: string) => {
    setSelectedCapsuleId(capsuleId);
    setSelectedSlotIndex(0);
  };

  const handleCloseModal = () => {
    setSelectedCapsuleId(null);
    setSelectedSlotIndex(0);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.scrollArea} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
          <Spinner />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.container}>
        <div className={styles.scrollArea} style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ marginBottom: 16, color: 'var(--color-grey-600)' }}>
            불러오지 못했어요
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid var(--color-border-light)',
              background: 'var(--color-white-500)',
              cursor: 'pointer',
            }}
          >
            다시 시도
          </button>
          <button
            type="button"
            onClick={handleClose}
            style={{
              marginLeft: 8,
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--color-white-grey-200)',
              cursor: 'pointer',
            }}
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <CapsuleHeader
        openedCount={openedCapsules.length}
        lockedCount={lockedCapsules.length}
        onClose={handleClose}
      />
      <div className={styles.scrollArea}>
        <WaitingRoomSection
          capsules={waitingRooms}
          onCardClick={(id) => router.push(`/waiting-room/${id}`)}
        />
        <CapsuleTabs
          activeTab={activeTab}
          openedCount={openedCapsules.length}
          lockedCount={lockedCapsules.length}
          onTabChange={setActiveTab}
        />
        {activeTab === 'opened' && (
          <OpenedCapsuleList
            capsules={openedCapsules}
            onCardClick={handleOpenedCardClick}
          />
        )}
        {activeTab === 'locked' && (
          <LockedCapsuleList capsules={lockedCapsules} />
        )}
      </div>

      <CapsuleDetailModal
        visible={!!selectedCapsuleId}
        capsuleId={selectedCapsuleId}
        title={detailData?.title ?? ''}
        slots={writtenSlots}
        selectedSlotIndex={selectedSlotIndex}
        onSelectSlot={setSelectedSlotIndex}
        onClose={handleCloseModal}
        isLoading={isDetailLoading}
        errorMessage={detailErrorMessage}
      />
    </div>
  );
}

export default CapsuleStorage;
