/**
 * 캡슐보관함 E2E/UI 테스트용 Mock 데이터
 */

import type { MyCapsuleItem, CategorizedCapsules } from '@/commons/apis/capsules/my-capsules/types';
import type { CapsuleDetailResponse } from '@/commons/apis/capsules/my-capsules/types';

export const mockMyCapsuleItem: MyCapsuleItem = {
  id: 'mock-capsule-1',
  title: '2025년 봄 캡슐',
  status: 'WAITING',
  openDate: null,
  participantCount: 5,
  completedCount: 2,
  myWriteStatus: false,
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
  location: { latitude: 37.5, longitude: 127.0 },
};

export const mockOpenedCapsule: MyCapsuleItem = {
  id: 'mock-opened-1',
  title: '열린 캡슐 제목',
  status: 'COMPLETED',
  openDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  participantCount: 3,
  completedCount: 3,
  myWriteStatus: true,
  deadline: null,
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  location: { latitude: 37.5, longitude: 127.0 },
};

export const mockLockedCapsule: MyCapsuleItem = {
  id: 'mock-locked-1',
  title: '잠긴 캡슐 제목',
  status: 'BURIED',
  openDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  participantCount: 4,
  completedCount: 4,
  myWriteStatus: true,
  deadline: null,
  createdAt: new Date().toISOString(),
};

export const mockCategorizedCapsules: CategorizedCapsules = {
  waitingRooms: [mockMyCapsuleItem],
  openedCapsules: [mockOpenedCapsule],
  lockedCapsules: [mockLockedCapsule],
};

export const mockCapsuleDetailResponse: CapsuleDetailResponse = {
  id: 'mock-opened-1',
  title: '열린 캡슐 제목',
  headcount: 3,
  isLocked: false,
  slots: [
    {
      slotId: 'slot-1',
      author: { id: 'u1', name: '참여자1', emoji: '😀' },
      isWritten: true,
      content: {
        text: '첫 번째 슬롯 텍스트입니다.',
        images: [],
      },
    },
    {
      slotId: 'slot-2',
      author: { id: 'u2', name: '참여자2', emoji: '🎉' },
      isWritten: true,
      content: { text: '두 번째 슬롯 내용.' },
    },
  ],
  stats: { totalSlots: 3, filledSlots: 2, emptySlots: 1 },
};
