/**
 * 참여 중인 타임캡슐 목록 조회 + 대기실/열린/잠긴 분류 훅
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllMyCapsules } from '../index';
import type { MyCapsuleItem, CategorizedCapsules } from '../types';

const GC_TIME = 1000 * 60 * 5; // 5분

function classifyCapsules(items: MyCapsuleItem[]): CategorizedCapsules {
  const now = new Date();
  const waitingRooms: MyCapsuleItem[] = [];
  const openedCapsules: MyCapsuleItem[] = [];
  const lockedCapsules: MyCapsuleItem[] = [];

  for (const capsule of items) {
    if (capsule.openDate === null && capsule.deadline === null) continue;

    if (capsule.status === 'WAITING') {
      waitingRooms.push(capsule);
      continue;
    }

    if (capsule.openDate) {
      const openDate = new Date(capsule.openDate);
      if (openDate <= now) openedCapsules.push(capsule);
      else lockedCapsules.push(capsule);
      continue;
    }

    if (capsule.status === 'COMPLETED' || capsule.status === 'EXPIRED') {
      openedCapsules.push(capsule);
    } else if (capsule.status === 'BURIED') {
      lockedCapsules.push(capsule);
    }
  }

  return { waitingRooms, openedCapsules, lockedCapsules };
}

export interface UseMyCapsulesResult extends CategorizedCapsules {
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * 참여 중인 타임캡슐 전체 수집 후 대기실/열린/잠긴으로 분류
 */
export function useMyCapsules(): UseMyCapsulesResult {
  const query = useQuery({
    queryKey: ['me', 'capsules', 'list'],
    queryFn: fetchAllMyCapsules,
    staleTime: 0,
    refetchOnWindowFocus: true,
    gcTime: GC_TIME,
  });

  const categorized = useMemo(() => {
    const items = query.data?.items ?? [];
    return classifyCapsules(items);
  }, [query.data?.items]);

  return {
    ...categorized,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
