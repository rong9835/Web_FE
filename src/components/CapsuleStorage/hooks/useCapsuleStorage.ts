import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CapsuleTabType } from '../components/CapsuleTabs/types';
import { useMyCapsules } from '@/commons/apis/capsules/my-capsules/hooks';
import { useCapsuleDetail } from '@/commons/apis/timecapsules/hooks';

/**
 * useCapsuleStorage 훅
 *
 * 캡슐 보관함의 상태 관리 및 이벤트 핸들러를 담당하는 훅입니다.
 */
export function useCapsuleStorage() {
  const router = useRouter();

  // 캡슐 목록 조회
  const {
    waitingRooms,
    openedCapsules,
    lockedCapsules,
    isLoading,
    isError,
    refetch,
  } = useMyCapsules();

  // UI 상태
  const [activeTab, setActiveTab] = useState<CapsuleTabType>('opened');
  const [selectedCapsuleId, setSelectedCapsuleId] = useState<string | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);

  // 선택된 캡슐 상세 조회
  const {
    data: detailData,
    writtenSlots,
    isLoading: isDetailLoading,
    error: detailError,
  } = useCapsuleDetail(selectedCapsuleId);

  const selectedSlot = writtenSlots[selectedSlotIndex];

  // 에러 메시지 처리
  const detailErrorMessage = detailError || (!isDetailLoading && detailData && !selectedSlot ? '작성된 내용이 없어요' : null);

  /**
   * 보관함 닫기
   */
  const handleClose = () => {
    router.push('/profile');
  };

  /**
   * 열린 캡슐 카드 클릭
   */
  const handleOpenedCardClick = (capsuleId: string) => {
    setSelectedCapsuleId(capsuleId);
    setSelectedSlotIndex(0);
  };

  /**
   * 상세 모달 닫기
   */
  const handleCloseModal = () => {
    setSelectedCapsuleId(null);
    setSelectedSlotIndex(0);
  };

  /**
   * 대기실 카드 클릭
   */
  const handleWaitingRoomCardClick = (capsuleId: string) => {
    router.push(`/waiting-room/${capsuleId}`);
  };

  return {
    // 캡슐 목록 데이터
    waitingRooms,
    openedCapsules,
    lockedCapsules,
    isLoading,
    isError,
    refetch,

    // UI 상태
    activeTab,
    setActiveTab,
    selectedCapsuleId,
    selectedSlotIndex,
    setSelectedSlotIndex,

    // 캡슐 상세 데이터
    detailData,
    writtenSlots,
    isDetailLoading,
    detailErrorMessage,

    // 이벤트 핸들러
    handleClose,
    handleOpenedCardClick,
    handleCloseModal,
    handleWaitingRoomCardClick,
  };
}
