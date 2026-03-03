/**
 * @fileoverview 대기실 API 함수
 * @description 타임캡슐 대기실 조회 API 호출 함수
 */

import { apiClient } from '@/commons/provider/api-provider/api-client';
import type { ApiError } from '@/commons/provider/api-provider/api-client';
import { CAPSULE_ENDPOINTS } from '../../endpoints';
import { compressImage } from '@/commons/utils/content';
import type {
  MyContentSaveApiData,
  MyContentSaveResponse,
  MyContentUpdateApiData,
  MyContentUpdateResponse,
  WaitingRoomSettingsResponse,
  WaitingRoomSettingsApiResponse,
  WaitingRoomDetailResponse,
  WaitingRoomDetailApiResponse,
  Participant,
  SlotApiResponse,
  MediaInfo,
  MyContentApiResponse,
  MyContentResponse,
  SaveContentRequest,
  UpdateContentRequest,
  CreateRoomRequest,
  CreateRoomResponse,
  InviteCodeQueryResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  CapsuleSubmitRequest,
  CapsuleSubmitResponse,
} from './types';

/**
 * 공통 API 응답 래퍼({success, data})를 언래핑합니다.
 * 백엔드가 래퍼 없이 raw 데이터를 내려주는 경우도 대비합니다.
 */
function unwrapApiResponse<T>(payload: any): T {
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    'data' in payload
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

/**
 * 슬롯 데이터를 참여자 데이터로 변환 (snake_case → camelCase)
 */
function transformSlotToParticipant(slot: SlotApiResponse): Participant {
  return {
    participantId: `slot-${slot.slot_number}`,
    // user_id / nickname은 백엔드 스펙상 null 가능 (빈 슬롯)
    // transformWaitingRoomDetail에서 user_id가 있는 슬롯만 변환하도록 보장합니다.
    userId: slot.user_id as string,
    userName: slot.nickname ?? undefined,
    userAvatarUrl: slot.avatar_url ?? undefined,
    slotNumber: slot.slot_number,
    role: slot.is_host ? 'HOST' : 'PARTICIPANT',
    status: slot.status,
    hasContent: slot.has_content ?? false,
  };
}

/**
 * 대기실 상세 정보 변환 (snake_case → camelCase)
 */
function transformWaitingRoomDetail(
  data: WaitingRoomDetailApiResponse,
  maxHeadcount?: number
): WaitingRoomDetailResponse {
  // Next.js BFF/프록시가 이미 camelCase로 내려주는 경우도 지원
  // (E2E 테스트 및 일부 환경에서 camelCase 응답을 모킹/사용)
  if (
    data &&
    typeof data === 'object' &&
    'waitingRoomId' in (data as any) &&
    'participants' in (data as any)
  ) {
    const already = data as unknown as WaitingRoomDetailResponse;
    const safeParticipants = (already.participants ?? []).map((p) => ({
      ...p,
      // 일부 환경/테스트 목데이터에서 누락되는 필드들에 대한 기본값 보정
      status: (p as any).status ?? 'ACCEPTED',
      hasContent: (p as any).hasContent ?? false,
    }));

    return {
      ...already,
      participants: safeParticipants,
      currentHeadcount:
        typeof already.currentHeadcount === 'number'
          ? already.currentHeadcount
          : safeParticipants.length,
      maxHeadcount:
        typeof already.maxHeadcount === 'number'
          ? already.maxHeadcount
          : maxHeadcount ?? safeParticipants.length,
    };
  }

  // slots 배열에서 참여자 목록 가져오기
  const slots = data.slots || [];
  // 빈 슬롯(user_id=null)은 참여자 목록에서 제외하고, UI에서 emptySlotsCount로 처리
  const participants = slots
    .filter((s) => s.user_id)
    .map(transformSlotToParticipant);

  return {
    waitingRoomId: data.room_id,
    capsuleName: data.capsule_name,
    openDate: data.open_date,
    deadline: data.deadline,
    status: data.status ?? 'WAITING',
    currentHeadcount: participants.length,
    // settings가 없으면 slots 길이를 최대 인원으로 추론
    maxHeadcount: maxHeadcount ?? (slots.length || participants.length),
    participants,
    inviteCode: data.invite_code,
    createdAt: data.created_at,
    deadlineAt: data.deadline_at,
    isAutoSubmitted: data.is_auto_submitted,
  };
}

/**
 * 대기실 설정값 변환 (snake_case → camelCase)
 */
function transformWaitingRoomSettings(
  data: WaitingRoomSettingsApiResponse
): WaitingRoomSettingsResponse {
  // Next.js BFF/프록시가 이미 camelCase로 내려주는 경우도 지원
  if (
    data &&
    typeof data === 'object' &&
    'roomId' in (data as any) &&
    'capsuleName' in (data as any)
  ) {
    return data as unknown as WaitingRoomSettingsResponse;
  }

  return {
    roomId: data.room_id,
    capsuleName: data.capsule_name,
    openDate: data.open_date,
    maxHeadcount: data.max_participants,
    maxImagesPerPerson: data.max_images_per_person,
    hasMusic: data.has_music,
    hasVideo: data.has_video,
    inviteCode: data.invite_code,
  };
}

/**
 * 개인 컨텐츠 변환 (snake_case → camelCase)
 */
function transformMyContent(data: MyContentApiResponse): MyContentResponse {
  const textCandidate = ((): string | undefined => {
    if (typeof data.text_message === 'string') return data.text_message;
    if (typeof data.text === 'string') return data.text;
    return undefined;
  })();

  const imageUrls = ((): string[] | undefined => {
    if (!data.images) return undefined;
    if (Array.isArray(data.images)) {
      const first = data.images[0] as any;
      if (first && typeof first === 'object' && typeof first.url === 'string') {
        return (data.images as Array<{ url: string }>).map((i) => i.url);
      }
      return data.images as string[];
    }
    return undefined;
  })();

  // 음악 정보: 객체 형태 또는 URL 문자열
  const musicInfo = ((): MediaInfo | string | undefined => {
    if (typeof data.music === 'string') return data.music;
    if (data.music && typeof (data.music as any).url === 'string') {
      return {
        media_id: (data.music as any).media_id || '',
        url: (data.music as any).url,
      };
    }
    return undefined;
  })();

  // 비디오 정보: 객체 형태 또는 URL 문자열
  const videoInfo = ((): MediaInfo | string | undefined => {
    if (typeof data.video === 'string') return data.video;
    if (data.video && typeof (data.video as any).url === 'string') {
      return {
        media_id: (data.video as any).media_id || '',
        url: (data.video as any).url,
      };
    }
    return undefined;
  })();

  return {
    text: textCandidate,
    images: imageUrls,
    music: musicInfo,
    video: videoInfo,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * 스텝룸 콘텐츠 저장(재저장) 응답 변환 (snake_case → camelCase)
 */
function transformMyContentSave(data: MyContentSaveApiData): MyContentSaveResponse {
  return {
    userId: data.user_id,
    nickname: data.nickname,
    status: data.status,
    savedAt: data.saved_at,
    uploadedImages: data.uploaded_images,
    uploadedMusic: data.uploaded_music,
    uploadedVideo: data.uploaded_video,
  };
}

/**
 * 스텝룸 콘텐츠 부분 수정(PATCH) 응답 변환 (snake_case → camelCase)
 */
function transformMyContentUpdate(
  data: MyContentUpdateApiData
): MyContentUpdateResponse {
  return {
    userId: data.user_id,
    nickname: data.nickname,
    status: data.status,
    updatedAt: data.updated_at,
    uploadedImages: data.uploaded_images,
    uploadedMusic: data.uploaded_music,
    uploadedVideo: data.uploaded_video,
  };
}

/**
 * 컨텐츠 저장 요청을 FormData로 변환
 */
function createContentFormData(
  data: SaveContentRequest | UpdateContentRequest
): FormData {
  const formData = new FormData();

  if (data.text !== undefined) {
    // 백엔드 스펙: text_message (필수)
    formData.append('text_message', data.text);
  }

  // POST 전용: invite_code
  if ('inviteCode' in data && data.inviteCode) {
    formData.append('invite_code', data.inviteCode);
  }

  // PATCH 전용: existing_image_urls (인덱스 배열 형식)
  if ('existingImageUrls' in data && data.existingImageUrls?.length) {
    data.existingImageUrls.forEach((url, index) => {
      formData.append(`existing_image_urls[${index}]`, url);
    });
  }

  if (data.images && data.images.length > 0) {
    data.images.forEach((image) => {
      formData.append('images', image);
    });
  }

  if (data.music) {
    formData.append('music', data.music);
  }

  if (data.video) {
    formData.append('video', data.video);
  }

  return formData;
}

/**
 * 대기실 설정값 조회 API
 * 
 * 캡슐 설정에서 설정한 정보를 조회합니다.
 * JWT Bearer 토큰이 자동으로 포함됩니다.
 * 
 * @param {string} capsuleId - 대기실 ID (캡슐 ID)
 * @returns {Promise<WaitingRoomSettingsResponse>} 대기실 설정값 응답
 * 
 * @throws {404} STEP_ROOM_NOT_FOUND - 대기실을 찾을 수 없음
 * @throws {401} UNAUTHORIZED - 인증되지 않은 사용자
 * @throws {403} FORBIDDEN - 권한 없는 사용자
 * 
 * @example
 * ```typescript
 * const settings = await getWaitingRoomSettings('capsule-123');
 * ```
 */
export async function getWaitingRoomSettings(
  capsuleId: string
): Promise<WaitingRoomSettingsResponse> {
  const response = await apiClient.get(
    CAPSULE_ENDPOINTS.WAITING_ROOM_SETTINGS(capsuleId)
  );
  const data = unwrapApiResponse<WaitingRoomSettingsApiResponse>(response.data);
  // snake_case → camelCase 변환
  return transformWaitingRoomSettings(data);
}

/**
 * 대기실 상세 정보 조회 API
 * 
 * 대기실 상세 정보 및 참여자 목록을 조회합니다.
 * JWT Bearer 토큰이 자동으로 포함됩니다.
 * 
 * @param {string} capsuleId - 대기실 ID (캡슐 ID)
 * @returns {Promise<WaitingRoomDetailResponse>} 대기실 상세 정보 응답
 * 
 * @throws {404} STEP_ROOM_NOT_FOUND - 대기실을 찾을 수 없음
 * @throws {401} UNAUTHORIZED - 인증되지 않은 사용자
 * @throws {403} FORBIDDEN - 권한 없는 사용자
 * 
 * @example
 * ```typescript
 * const detail = await getWaitingRoomDetail('capsule-123');
 * ```
 */
export async function getWaitingRoomDetail(
  capsuleId: string
): Promise<WaitingRoomDetailResponse> {
  const response = await apiClient.get(
    CAPSULE_ENDPOINTS.WAITING_ROOM_DETAIL(capsuleId)
  );
  const data = unwrapApiResponse<WaitingRoomDetailApiResponse>(response.data);
  // snake_case → camelCase 변환 (maxHeadcount는 settings에서 가져와야 함)
  return transformWaitingRoomDetail(data);
}

/**
 * 본인 컨텐츠 조회 API
 *
 * 사용자가 작성한 컨텐츠를 조회합니다.
 * JWT Bearer 토큰이 자동으로 포함됩니다.
 *
 * 404 에러는 "아직 작성하지 않았습니다"를 의미하는 정상적인 응답이므로,
 * 빈 MyContentResponse를 반환합니다.
 *
 * @param {string} capsuleId - 대기실 ID (캡슐 ID)
 * @returns {Promise<MyContentResponse>} 본인 컨텐츠 응답 (404일 경우 빈 객체)
 *
 * @throws {401} UNAUTHORIZED - 인증되지 않은 사용자
 * @throws {403} FORBIDDEN - 권한 없는 사용자
 *
 * @example
 * ```typescript
 * const content = await getMyContent('capsule-123');
 * ```
 */
export async function getMyContent(
  capsuleId: string
): Promise<MyContentResponse> {
  try {
    const response = await apiClient.get(
      CAPSULE_ENDPOINTS.MY_CONTENT(capsuleId)
    );
    const data = unwrapApiResponse<MyContentApiResponse>(response.data);
    // snake_case → camelCase 변환
    return transformMyContent(data);
  } catch (error) {
    const apiError = error as ApiError;
    
    // 404 에러는 "아직 작성하지 않았습니다"를 의미하는 정상적인 응답
    if (apiError?.status === 404) {
      // 빈 응답 반환
      return {
        text: undefined,
        images: undefined,
        music: undefined,
        video: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };
    }
    // 다른 에러는 그대로 throw
    throw error;
  }
}

/**
 * 컨텐츠 저장 API (신규 작성)
 *
 * 사용자가 작성한 컨텐츠를 저장합니다.
 * JWT Bearer 토큰이 자동으로 포함됩니다.
 *
 * @param {string} capsuleId - 대기실 ID (캡슐 ID)
 * @param {SaveContentRequest} data - 컨텐츠 저장 요청 데이터
 * @returns {Promise<MyContentResponse>} 저장된 컨텐츠 응답
 *
 * @throws {400} VALIDATION_ERROR - 유효성 검사 실패
 * @throws {400} FILE_SIZE_EXCEEDED - 파일 크기 초과
 * @throws {400} FILE_TYPE_INVALID - 파일 형식 불일치
 * @throws {400} MEDIA_LIMIT_EXCEEDED - 미디어 제한 초과
 * @throws {404} STEP_ROOM_NOT_FOUND - 대기실을 찾을 수 없음
 * @throws {401} UNAUTHORIZED - 인증되지 않은 사용자
 * @throws {403} FORBIDDEN - 권한 없는 사용자
 *
 * @example
 * ```typescript
 * const content = await saveContent('capsule-123', {
 *   text: '안녕하세요',
 *   images: [file1, file2],
 *   music: musicFile,
 *   video: videoFile,
 * });
 * ```
 */
export async function saveContent(
  capsuleId: string,
  data: SaveContentRequest
): Promise<MyContentSaveResponse> {
  const compressedData = {
    ...data,
    images: data.images ? await Promise.all(data.images.map(compressImage)) : data.images,
  };
  const formData = createContentFormData(compressedData);
  const response = await apiClient.post(
    CAPSULE_ENDPOINTS.MY_CONTENT(capsuleId),
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 파일 업로드는 2분 타임아웃
    }
  );
  const saved = unwrapApiResponse<MyContentSaveApiData>(response.data);
  return transformMyContentSave(saved);
}

/**
 * 컨텐츠 수정 API
 *
 * 사용자가 작성한 컨텐츠를 수정합니다.
 * JWT Bearer 토큰이 자동으로 포함됩니다.
 *
 * @param {string} capsuleId - 대기실 ID (캡슐 ID)
 * @param {UpdateContentRequest} data - 컨텐츠 수정 요청 데이터
 * @returns {Promise<MyContentResponse>} 수정된 컨텐츠 응답
 *
 * @throws {400} VALIDATION_ERROR - 유효성 검사 실패
 * @throws {400} FILE_SIZE_EXCEEDED - 파일 크기 초과
 * @throws {400} FILE_TYPE_INVALID - 파일 형식 불일치
 * @throws {400} MEDIA_LIMIT_EXCEEDED - 미디어 제한 초과
 * @throws {404} STEP_ROOM_NOT_FOUND - 대기실을 찾을 수 없음
 * @throws {401} UNAUTHORIZED - 인증되지 않은 사용자
 * @throws {403} FORBIDDEN - 권한 없는 사용자
 *
 * @example
 * ```typescript
 * const content = await updateContent('capsule-123', {
 *   text: '수정된 텍스트',
 *   images: [file1],
 * });
 * ```
 */
export async function updateContent(
  capsuleId: string,
  data: UpdateContentRequest
): Promise<MyContentUpdateResponse> {
  const compressedData = {
    ...data,
    images: data.images ? await Promise.all(data.images.map(compressImage)) : data.images,
  };
  const formData = createContentFormData(compressedData);
  // 문서 기준: PATCH로 부분 수정
  const response = await apiClient.patch(
    CAPSULE_ENDPOINTS.MY_CONTENT(capsuleId),
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 파일 업로드는 2분 타임아웃
    }
  );
  const updated = unwrapApiResponse<MyContentUpdateApiData>(response.data);
  return transformMyContentUpdate(updated);
}

/**
 * 방 생성 API (타임캡슐 대기실 생성 + 초대 코드 발급)
 *
 * POST /api/capsules/step-rooms/create
 *
 * @param {CreateRoomRequest} data - 방 생성 요청 데이터
 * @returns {Promise<CreateRoomResponse>} 방 생성 응답
 */
export async function createRoom(
  data: CreateRoomRequest
): Promise<CreateRoomResponse> {
  const response = await apiClient.post(
    CAPSULE_ENDPOINTS.CREATE_ROOM,
    data
  );
  // 방 생성 응답은 래퍼 없이 내려온다고 가정
  return unwrapApiResponse<CreateRoomResponse>(response.data);
}

/**
 * 초대 코드로 방 정보 조회 API (Public API - 인증 불필요)
 *
 * GET /api/capsules/step-rooms/by-code?invite_code={code}
 *
 * @param {string} code - 초대 코드 (대소문자 구분 없이 입력 가능)
 * @returns {Promise<InviteCodeQueryResponse>} 초대 코드 조회 응답
 */
export async function queryRoomByInviteCode(
  code: string
): Promise<InviteCodeQueryResponse> {
  // Public API 이므로 Authorization 헤더를 제거하여 호출
  const response = await apiClient.get(
    CAPSULE_ENDPOINTS.INVITE_CODE_QUERY(code),
    {
      headers: {
        Authorization: undefined,
      },
    }
  );
  return unwrapApiResponse<InviteCodeQueryResponse>(response.data);
}

/**
 * 초대 코드로 방 참여 API
 *
 * POST /api/capsules/step-rooms/{capsuleId}/join
 *
 * @param {string} capsuleId - 대기실 ID (캡슐 ID)
 * @param {JoinRoomRequest} data - 참여 요청 데이터
 * @returns {Promise<JoinRoomResponse>} 방 참여 응답
 *
 * @note
 * - 409 ALREADY_JOINED 는 상위에서 처리하기 위해 그대로 throw 합니다.
 */
export async function joinRoom(
  capsuleId: string,
  data: JoinRoomRequest
): Promise<JoinRoomResponse> {
  const response = await apiClient.post(
    CAPSULE_ENDPOINTS.JOIN_ROOM(capsuleId),
    data
  );
  return unwrapApiResponse<JoinRoomResponse>(response.data);
}

/**
 * 타임캡슐 제출 API (방장 전용)
 *
 * POST /api/capsules/step-rooms/:roomId/submit
 *
 * 방장이 모든 참여자의 콘텐츠 작성 완료 후 타임캡슐을 최종 제출합니다.
 * JWT Bearer 토큰이 자동으로 포함됩니다.
 *
 * @param {string} roomId - 대기실 ID
 * @param {CapsuleSubmitRequest} data - 제출 요청 데이터 (GPS 위치)
 * @returns {Promise<CapsuleSubmitResponse>} 제출 응답
 *
 * @throws {400} INCOMPLETE_PARTICIPANTS - 모든 참여자가 콘텐츠를 제출하지 않음
 * @throws {400} INVALID_LOCATION - 유효하지 않은 위치 정보
 * @throws {400} PAYMENT_NOT_COMPLETED - 결제가 완료되지 않음
 * @throws {401} UNAUTHORIZED - 인증되지 않은 사용자
 * @throws {403} NOT_HOST - 방장이 아닌 사용자
 * @throws {404} ROOM_NOT_FOUND - 대기실을 찾을 수 없음
 * @throws {409} ALREADY_SUBMITTED - 이미 제출된 타임캡슐
 * @throws {500} INTERNAL_SERVER_ERROR - 서버 오류
 *
 * @example
 * ```typescript
 * const result = await submitCapsule('room-123', {
 *   latitude: 37.5665,
 *   longitude: 126.9780,
 * });
 * ```
 */
export async function submitCapsule(
  roomId: string,
  data: CapsuleSubmitRequest
): Promise<CapsuleSubmitResponse> {
  const response = await apiClient.post<CapsuleSubmitResponse>(
    CAPSULE_ENDPOINTS.SUBMIT_CAPSULE(roomId),
    data
  );
  return response.data;
}
