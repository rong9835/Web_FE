/**
 * 열린 타임캡슐 상세 조회 React Query 훅
 */

import { useQuery } from '@tanstack/react-query';
import { getCapsuleDetail } from '../detail';
import type { CapsuleDetailSlot } from '@/commons/apis/me/capsules/types';
import { useAuthState } from '@/commons/hooks/useAuth';

const STALE_TIME = 1000 * 60; // 1분

/**
 * 타임캡슐 상세 조회 훅
 * capsuleId와 현재 사용자 ID가 있을 때만 요청 (enabled)
 */
export function useCapsuleDetail(capsuleId: string | null) {
  const { user } = useAuthState();
  const userId = user?.id ?? null;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['timecapsules', 'detail', capsuleId, userId],
    queryFn: () => {
      if (!capsuleId) {
        throw new Error('캡슐 ID가 필요합니다.');
      }
      if (!userId) {
        throw new Error('사용자 ID가 필요합니다.');
      }
      return getCapsuleDetail(capsuleId, userId);
    },
    enabled: !!capsuleId && !!userId,
    staleTime: STALE_TIME,
    retry: 1,
  });

  // 작성된 슬롯만 필터링
  const writtenSlots: CapsuleDetailSlot[] = data?.slots.filter(slot => slot.isWritten) || [];

  return {
    data: data || null,
    writtenSlots,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
