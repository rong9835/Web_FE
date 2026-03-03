'use client';

/**
 * @fileoverview WaitingRoom 메인 컨테이너 컴포넌트
 * @description 대기실 페이지의 최상위 컨테이너
 * 
 * @version 1.2.0
 * @created 2026-01-28
 * @updated 2026-01-29 - 타임캡슐 제출 기능 추가 (방장 전용)
 * @updated 2026-01-29 - 실제 API 연결 및 에러 처리 강화 (Phase 9 완료)
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TimeCapsuleHeader } from '@/commons/components/timecapsule-header';
import { Spinner } from '@/commons/components/spinner';
import { useAuthState } from '@/commons/hooks/useAuth';
import { useMyContent } from '@/commons/apis/capsules/step-rooms/hooks/useMyContent';
import { generateInviteLink } from '@/commons/utils/invite';
import { useToast } from '@/commons/provider/toast-provider';
import { Button } from '@/commons/components/button';
import { WaitingRoomInfo } from './components/WaitingRoomInfo';
import { ParticipantList } from './components/ParticipantList';
import { ContentWriteBottomSheet } from './components/ContentWriteBottomSheet';
import { SubmitTimer } from './components/SubmitTimer';
import { SubmitConfirmModal } from './components/SubmitConfirmModal';
import { SubmitCompleteModal } from './components/SubmitCompleteModal';
import { AutoSubmitModal } from './components/AutoSubmitModal';
import { useWaitingRoom } from './hooks/useWaitingRoom';
import { useCapsuleSubmit } from './hooks/useCapsuleSubmit';
import styles from './styles.module.css';

/**
 * WaitingRoom 컴포넌트
 * 
 * 대기실 페이지의 메인 컨테이너입니다.
 * - 대기실 정보 조회 및 표시
 * - 참여자 목록 표시
 * - 로딩 상태 표시
 * - 에러 처리 및 사용자 안내
 * 
 * @param {WaitingRoomPageProps} props - WaitingRoom 컴포넌트의 props
 */
export function WaitingRoom({ capsuleId }: { capsuleId: string }) {
  const router = useRouter();
  const { state, waitingRoom, settings, isLoading, error } =
    useWaitingRoom(capsuleId);
  const { user } = useAuthState();
  const { showError, showSuccess } = useToast();
  const [isContentWriteOpen, setIsContentWriteOpen] = useState(false);
  const [isMyContentJustSaved, setIsMyContentJustSaved] = useState(false);

  // 렌더 시 Date.now() 호출 방지 (impure) — 1초마다 갱신
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // 제출 관련 상태
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isSubmitCompleteOpen, setIsSubmitCompleteOpen] = useState(false);
  const [isAutoSubmitModalOpen, setIsAutoSubmitModalOpen] = useState(false);

  const { data: myContent } = useMyContent(user?.id ? capsuleId : null);
  const isMyContentSavedFromServer = Boolean(
    (myContent?.text ?? '').trim().length > 0 ||
      (myContent?.images?.length ?? 0) > 0 ||
      !!myContent?.music ||
      !!myContent?.video
  );

  // 서버 응답 외에, 방금 저장 완료된 상태를 즉시 반영하기 위한 플래그
  const isMyContentSaved = isMyContentJustSaved || isMyContentSavedFromServer;

  // 현재 사용자가 방장인지 판단
  const isHost = waitingRoom?.participants.some(
    (p) => {
      const normalize = (value?: string) => (value ?? '').trim().toLowerCase();
      const isCurrentUser =
        (user?.id && normalize(p.userId) === normalize(user.id)) ||
        (user?.nickname && p.userName && normalize(p.userName) === normalize(user.nickname));
      return isCurrentUser && p.role === 'HOST';
    }
  ) ?? false;

  // 제출 훅 (실제 API 연결)
  const { submitCapsule, isSubmitting, error: submitError, submitResult } =
    useCapsuleSubmit(capsuleId);

  // 자동 제출 감지 (방 상태가 BURIED이고 is_auto_submitted가 true인 경우)
  useEffect(() => {
    if (
      waitingRoom?.status === 'BURIED' &&
      waitingRoom?.isAutoSubmitted === true
    ) {
      queueMicrotask(() => setIsAutoSubmitModalOpen(true));
    }
  }, [waitingRoom?.status, waitingRoom?.isAutoSubmitted]);

  // 제출 조건 확인
  const allParticipantsCompleted = waitingRoom?.participants.every(
    (p) => p.hasContent === true
  ) ?? false;

  // 자동제출 마감 시각 계산 (우선순위: deadlineAt → deadline → createdAt+24h)
  const autoSubmitDeadline = waitingRoom?.deadlineAt
    ? new Date(waitingRoom.deadlineAt).getTime()
    : waitingRoom?.deadline
      ? new Date(waitingRoom.deadline).getTime()
      : waitingRoom?.createdAt
        ? new Date(waitingRoom.createdAt).getTime() + 24 * 60 * 60 * 1000
        : null;

  const isTimerExpired = autoSubmitDeadline !== null ? autoSubmitDeadline < now : false;

  const canSubmit =
    isHost &&
    allParticipantsCompleted &&
    !isTimerExpired &&
    waitingRoom?.status !== 'BURIED';

  // 비활성화 사유
  const getDisabledReason = (): string | undefined => {
    if (!isHost) return undefined; // 방장이 아니면 버튼 자체를 숨김
    if (waitingRoom?.status === 'BURIED') return '이미 제출된 타임캡슐입니다';
    if (isTimerExpired) return '자동 제출 시간이 경과했습니다';
    if (!allParticipantsCompleted) return '모든 참여자가 콘텐츠를 제출해야 합니다';
    return undefined;
  };

  const handleBack = () => {
    router.back();
  };

  const handleClose = () => {
    router.push('/profile/capsules');
    router.refresh();
  };

  const handleInviteFriend = async () => {
    // settings API에서 invite_code를 제공하므로, settings에서 가져옴
    const inviteCode = settings?.inviteCode || waitingRoom?.inviteCode;
    if (!inviteCode) {
      alert('초대 코드를 불러올 수 없습니다.');
      return;
    }

    const inviteLink = generateInviteLink(inviteCode);

    try {
      // Web Share API 사용 가능 여부 확인
      if (navigator.share) {
        await navigator.share({
          url: inviteLink,
        });
      } else {
        // Web Share API를 사용할 수 없으면 클립보드에 복사
        await navigator.clipboard.writeText(inviteLink);
        alert('초대 링크가 클립보드에 복사되었습니다!');
      }
    } catch (error) {
      // 사용자가 공유를 취소한 경우 (AbortError)는 조용히 처리
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      console.error('초대 링크 공유 실패:', error);
      // 공유 실패 시 클립보드 복사 시도
      try {
        await navigator.clipboard.writeText(inviteLink);
        alert('초대 링크가 클립보드에 복사되었습니다!');
      } catch (clipboardError) {
        console.error('클립보드 복사 실패:', clipboardError);
        alert('초대 링크 공유에 실패했습니다.');
      }
    }
  };

  const handleWriteMyContent = () => {
    // 다시 열 때도 이미 작성 완료 상태는 유지
    setIsContentWriteOpen(true);
  };

  const handleFinalSubmit = () => {
    // 제출 확인 모달 표시
    setIsSubmitConfirmOpen(true);
  };

  const handleSubmitConfirm = async () => {
    try {
      // 실제 API 호출 (GPS 수집 + 제출)
      await submitCapsule();
      
      // 확인 모달 닫기
      setIsSubmitConfirmOpen(false);
      
      // 성공 메시지 표시
      showSuccess('타임캡슐이 성공적으로 제출되었습니다');
      
      // 완료 모달 표시 (submitResult는 mutation 성공 후 자동으로 설정됨)
      setIsSubmitCompleteOpen(true);
    } catch (error: any) {
      console.error('제출 실패:', error);
      
      // 확인 모달은 유지 (사용자가 재시도할 수 있도록)
      
      // 에러 메시지 표시
      const errorMessage = submitError || error?.message || '제출에 실패했습니다. 다시 시도해주세요';
      showError(errorMessage);
    }
  };

  const handleSubmitCompleteClose = () => {
    setIsSubmitCompleteOpen(false);
    // 홈 화면으로 이동
    router.push('/');
  };

  const handleAutoSubmitModalClose = () => {
    setIsAutoSubmitModalOpen(false);
  };

  const handleNavigateToVault = () => {
    setIsAutoSubmitModalOpen(false);
    router.push('/profile/capsules');
  };

  const handleContentWriteClose = () => {
    setIsContentWriteOpen(false);
  };

  const handleContentSaved = () => {
    // 저장 성공 시 즉시 "작성 완료"로 표시되도록 플래그 설정
    setIsMyContentJustSaved(true);
  };

  return (
    <div className={styles.container}>
      <TimeCapsuleHeader
        title="캡슐 대기실"
        onBack={handleBack}
        rightIcons={[
          {
            icon: 'close',
            onPress: handleClose,
            accessibilityLabel: '닫기',
          },
        ]}
        titleAlign="left"
      />

      {/* 24시간 타이머 (방장에게만 표시) */}
      {isHost && waitingRoom?.createdAt && waitingRoom.status !== 'BURIED' && (
        <SubmitTimer createdAt={waitingRoom.createdAt} />
      )}

      <div className={styles.content}>
        {isLoading && <Spinner size="large" fullScreen={true} />}

        {state.status === 'error' && (
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>
              {error || '대기실 정보를 불러오는 중 오류가 발생했습니다.'}
            </p>
          </div>
        )}

        {state.status === 'success' && waitingRoom && (
          <>
            <WaitingRoomInfo
              waitingRoom={waitingRoom}
              settings={settings}
              onInviteFriend={handleInviteFriend}
            />
            <ParticipantList
              participants={waitingRoom.participants}
              currentHeadcount={waitingRoom.currentHeadcount}
              maxHeadcount={settings?.maxHeadcount ?? waitingRoom.maxHeadcount}
              currentUserId={user?.id}
              currentUserName={user?.nickname}
              isMyContentSaved={isMyContentSaved}
              isHost={isHost}
              onInviteFriend={handleInviteFriend}
              onWriteMyContent={handleWriteMyContent}
              onFinalSubmit={handleFinalSubmit}
            />

            {/* 자동제출 카운트다운 */}
            {autoSubmitDeadline !== null && waitingRoom.status !== 'BURIED' && (
              <div className={styles.autoSubmitCountdown}>
                {isTimerExpired ? (
                  <span className={styles.autoSubmitExpired}>자동제출 완료</span>
                ) : (() => {
                  const remainingMs = autoSubmitDeadline - now;
                  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
                  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                  const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
                  const timeStr = hours > 0
                    ? `${hours}시간 ${minutes}분 ${seconds}초`
                    : `${minutes}분 ${seconds}초`;
                  return (
                    <span className={hours < 1 ? styles.autoSubmitUrgent : styles.autoSubmitNormal}>
                      ⏰ {timeStr} 후 자동제출
                    </span>
                  );
                })()}
              </div>
            )}

            {/* 제출 버튼 (방장에게만 표시) */}
            {isHost && waitingRoom?.status !== 'BURIED' && (
              <div className={styles.submitButtonContainer}>
                {/* 비활성화 사유 표시 */}
                {!canSubmit && getDisabledReason() && (
                  <div className={styles.disabledReason}>{getDisabledReason()}</div>
                )}
                <Button
                  label={isSubmitting ? '제출 중...' : '타임캡슐 묻기'}
                  variant="primary"
                  size="M"
                  fullWidth
                  disabled={!canSubmit || isSubmitting}
                  onPress={handleFinalSubmit}
                  aria-label="타임캡슐 묻기"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* 제출 확인 모달 */}
      {waitingRoom && (
        <SubmitConfirmModal
          isOpen={isSubmitConfirmOpen}
          onClose={() => setIsSubmitConfirmOpen(false)}
          onConfirm={handleSubmitConfirm}
          openDate={waitingRoom.openDate}
          remainingHours={
            autoSubmitDeadline !== null
              ? Math.max(0, Math.floor((autoSubmitDeadline - now) / (1000 * 60 * 60)))
              : 0
          }
          isLoading={isSubmitting}
        />
      )}

      {/* 제출 완료 모달 */}
      {isSubmitCompleteOpen && submitResult && (
        <SubmitCompleteModal
          isOpen={isSubmitCompleteOpen}
          onClose={handleSubmitCompleteClose}
          capsuleId={submitResult.data.capsule_id}
          openDate={submitResult.data.open_date}
          isAutoSubmitted={submitResult.data.is_auto_submitted}
        />
      )}

      {/* 자동 제출 안내 모달 */}
      {waitingRoom?.isAutoSubmitted && (
        <AutoSubmitModal
          isOpen={isAutoSubmitModalOpen}
          onClose={handleAutoSubmitModalClose}
          buriedAt={waitingRoom.createdAt || new Date().toISOString()}
          openDate={waitingRoom.openDate}
          onNavigateToVault={handleNavigateToVault}
        />
      )}

      {state.status === 'success' && (
        <ContentWriteBottomSheet
          isOpen={isContentWriteOpen}
          onClose={handleContentWriteClose}
          onSaved={handleContentSaved}
          capsuleId={capsuleId}
          settings={settings}
        />
      )}
    </div>
  );
}
