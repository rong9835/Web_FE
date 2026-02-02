/**
 * 열린 타임캡슐 상세 API (GET /api/timecapsules/:id?user_id=)
 * 서버 snake_case 응답 시 camelCase로 변환
 */

import { apiClient } from '@/commons/provider/api-provider/api-client';
import { CAPSULE_ENDPOINTS } from '@/commons/apis/endpoints';
import type {
  CapsuleDetailResponse,
  CapsuleDetailSlot,
  CapsuleDetailSlotAuthor,
  SlotContent,
  SlotContentImage,
  SlotContentVideo,
  SlotContentAudio,
} from '@/commons/apis/capsules/my-capsules/types';

/** 서버 snake_case 응답 (실제 구조) */
interface SnakeMediaItem {
  media_id: string;
  object_key: string;
}

interface SnakeSlot {
  slot_id: string;
  slot_index: number;
  user_id: string;
  nickname: string;
  profile_img?: string;
  is_owner: boolean;
  is_filled: boolean;
  status: string;
  text_message?: string;
  images_ids?: SnakeMediaItem[];
  audio_id?: SnakeMediaItem | null;
  video_id?: SnakeMediaItem | null;
}

interface SnakeDetailResponse {
  id: string;
  title: string;
  headcount: number;
  is_locked: boolean;
  slots: SnakeSlot[];
  stats?: { total_slots: number; filled_slots: number; empty_slots: number };
}

function toCamelSlotAuthor(slot: SnakeSlot): CapsuleDetailSlotAuthor {
  // is_filled가 false이거나 user_id가 없으면 빈 슬롯
  if (!slot.is_filled || !slot.user_id) {
    return {
      id: '',
      name: '빈 슬롯',
      emoji: '🥚',
    };
  }
  return {
    id: slot.user_id,
    name: slot.nickname || '익명',
    emoji: '👤', // 기본 이모지 (서버에서 emoji를 주지 않으므로)
    profileImg: slot.profile_img,
  };
}

function toCamelContent(slot: SnakeSlot): SlotContent | undefined {
  // is_filled가 false이면 content가 없음
  if (!slot.is_filled) {
    return undefined;
  }

  const content: SlotContent = {};

  // 텍스트 메시지
  if (slot.text_message) {
    content.text = slot.text_message;
  }

  // 이미지들 - media_id를 전달하면 플레이어가 자동으로 URL로 변환
  if (slot.images_ids?.length) {
    content.images = slot.images_ids.map(
      (img): SlotContentImage => ({
        id: img.media_id,
        url: img.media_id, // media_id를 그대로 전달
        thumbnailUrl: img.media_id,
      })
    );
  }

  // 비디오 - media_id를 전달하면 VideoPlayer가 자동으로 URL로 변환
  if (slot.video_id && slot.video_id.media_id) {
    content.video = {
      id: slot.video_id.media_id,
      url: slot.video_id.media_id, // media_id를 그대로 전달
      thumbnailUrl: slot.video_id.media_id,
    } as SlotContentVideo;
  }

  // 오디오 - media_id를 전달하면 AudioPlayer가 자동으로 URL로 변환
  if (slot.audio_id && slot.audio_id.media_id) {
    content.audio = {
      id: slot.audio_id.media_id,
      title: slot.nickname ? `${slot.nickname}의 음성` : '음성 메시지',
      url: slot.audio_id.media_id, // media_id를 그대로 전달
    } as SlotContentAudio;
  }

  return Object.keys(content).length > 0 ? content : undefined;
}

function toCamelSlot(s: SnakeSlot): CapsuleDetailSlot {
  return {
    slotId: s.slot_id,
    author: toCamelSlotAuthor(s),
    isWritten: s.is_filled, // is_written 대신 is_filled 사용
    content: toCamelContent(s),
  };
}

function toCamelDetail(raw: SnakeDetailResponse): CapsuleDetailResponse {
  return {
    id: raw.id,
    title: raw.title,
    headcount: raw.headcount,
    isLocked: raw.is_locked,
    slots: raw.slots.map(toCamelSlot),
    stats: raw.stats
      ? {
          totalSlots: raw.stats.total_slots,
          filledSlots: raw.stats.filled_slots,
          emptySlots: raw.stats.empty_slots,
        }
      : undefined,
  };
}

/** 이미 camelCase인지 여부 (items 등으로 판단) */
function isSnakeResponse(raw: unknown): raw is SnakeDetailResponse {
  if (raw && typeof raw === 'object' && Array.isArray((raw as SnakeDetailResponse).slots)) {
    const first = (raw as SnakeDetailResponse).slots[0];
    if (first && 'slot_id' in first) return true;
  }
  return false;
}

/**
 * 타임캡슐 상세 조회
 *
 * GET /api/timecapsules/:id?user_id=
 * 401/403/404/500 시 throw (훅에서 처리)
 */
export async function getCapsuleDetail(
  id: string,
  userId: string
): Promise<CapsuleDetailResponse> {
  try {
    const response = await apiClient.get<CapsuleDetailResponse | SnakeDetailResponse>(
      CAPSULE_ENDPOINTS.TIMECAPSULE_DETAIL(id),
      {
        params: { user_id: userId },
      }
    );
    const raw = response.data;

    if (isSnakeResponse(raw)) {
      return toCamelDetail(raw);
    }
    return raw as CapsuleDetailResponse;
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error('권한이 없어요');
    }
    if (error.response?.status === 404) {
      throw new Error('캡슐을 찾을 수 없어요');
    }
    if (error.response?.status === 401) {
      throw new Error('로그인이 필요해요');
    }
    throw new Error('불러오지 못했어요');
  }
}
