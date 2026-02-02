'use client';

import React from 'react';
import { CapsuleHeader } from './components/CapsuleHeader';
import { WaitingRoomSection } from './components/WaitingRoomSection';
import { CapsuleTabs } from './components/CapsuleTabs';
import { OpenedCapsuleList } from './components/OpenedCapsuleList';
import { LockedCapsuleList } from './components/LockedCapsuleList';
import { CapsuleDetailModal } from './components/CapsuleDetailModal';
import { useCapsuleStorage } from './hooks';
import { Spinner } from '@/commons/components/spinner';
import styles from './styles.module.css';

export function CapsuleStorage() {
  const {
    waitingRooms,
    openedCapsules,
    lockedCapsules,
    isLoading,
    isError,
    refetch,
    activeTab,
    setActiveTab,
    selectedCapsuleId,
    selectedSlotIndex,
    setSelectedSlotIndex,
    detailData,
    writtenSlots,
    isDetailLoading,
    detailErrorMessage,
    handleClose,
    handleOpenedCardClick,
    handleCloseModal,
    handleWaitingRoomCardClick,
  } = useCapsuleStorage();

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
          onCardClick={handleWaitingRoomCardClick}
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
