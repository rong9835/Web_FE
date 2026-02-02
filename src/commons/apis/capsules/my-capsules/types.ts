/**
 * 참여 중인 타임캡슐 목록 API 타입 (GET /api/me/capsules)
 */

export type MyCapsuleStatus = 'WAITING' | 'COMPLETED' | 'EXPIRED' | 'BURIED';

export interface MyCapsuleItem {
  id: string;
  title: string;
  status: MyCapsuleStatus;
  openDate: string | null;
  participantCount: number;
  completedCount: number;
  myWriteStatus: boolean;
  deadline: string | null;
  createdAt: string;
  location?: { latitude: number; longitude: number };
}

export interface MyCapsuleListResponse {
  items: MyCapsuleItem[];
  total: number;
  limit: number;
  offset: number;
  hasNext?: boolean;
}

export interface CategorizedCapsules {
  waitingRooms: MyCapsuleItem[];
  openedCapsules: MyCapsuleItem[];
  lockedCapsules: MyCapsuleItem[];
}

/**
 * 타임캡슐 상세 API 타입 (GET /api/timecapsules/:id?user_id=)
 * 서버 snake_case 응답 시 camelCase 변환 후 사용
 */
export interface CapsuleDetailSlotAuthor {
  id: string;
  name: string;
  emoji: string;
  profileImg?: string;
}

export interface SlotContentImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
}

export interface SlotContentVideo {
  id: string;
  url: string;
  thumbnailUrl: string;
}

export interface SlotContentAudio {
  id: string;
  title: string;
  url: string;
}

export interface SlotContent {
  text?: string;
  images?: SlotContentImage[];
  video?: SlotContentVideo;
  audio?: SlotContentAudio;
}

export interface CapsuleDetailSlot {
  slotId: string;
  author: CapsuleDetailSlotAuthor;
  isWritten: boolean;
  content?: SlotContent;
}

export interface CapsuleDetailResponse {
  id: string;
  title: string;
  headcount: number;
  isLocked: boolean;
  slots: CapsuleDetailSlot[];
  stats?: { totalSlots: number; filledSlots: number; emptySlots: number };
}
