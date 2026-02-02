/**
 * 참여 중인 타임캡슐 목록 API (GET /api/me/capsules)
 */

import type { AxiosError } from 'axios';
import { apiClient } from '@/commons/provider/api-provider/api-client';
import { AUTH_ENDPOINTS } from '@/commons/apis/endpoints';
import type { MyCapsuleListResponse } from './types';

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

/** 서버가 { data } 형태로 감싸서 반환하는 경우 */
interface WrappedResponse {
  data?: MyCapsuleListResponse;
}

/**
 * 참여 중인 타임캡슐 목록 조회 (한 페이지)
 *
 * GET /api/me/capsules?limit=&offset=
 * 401/500 시 빈 배열이 아닌 빈 응답 구조 반환해 UI 유지 (에러는 throw하지 않고 빈 데이터 반환)
 *
 * @returns 목록 응답 (에러 시 items: [], total: 0, hasNext: false)
 */
export async function getMyCapsules(
  limit: number = DEFAULT_LIMIT,
  offset: number = DEFAULT_OFFSET
): Promise<MyCapsuleListResponse> {
  try {
    const url = `${AUTH_ENDPOINTS.ME_CAPSULES}?limit=${limit}&offset=${offset}`;
    const response = await apiClient.get<MyCapsuleListResponse | WrappedResponse>(url);

    const raw = response.data;
    if (raw && Array.isArray((raw as MyCapsuleListResponse).items)) {
      return raw as MyCapsuleListResponse;
    }
    const wrapped = raw as WrappedResponse;
    if (wrapped?.data && Array.isArray(wrapped.data.items)) {
      return wrapped.data;
    }
    return { items: [], total: 0, limit, offset, hasNext: false };
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const status = axiosError.response?.status;
    if (status === 401 || status === 500 || !axiosError.response) {
      return { items: [], total: 0, limit, offset, hasNext: false };
    }
    throw error;
  }
}

/**
 * 참여 중인 타임캡슐 전체 수집 (hasNext 동안 반복 호출)
 *
 * @returns 합쳐진 items, total, hasNext: false
 */
export async function fetchAllMyCapsules(): Promise<MyCapsuleListResponse> {
  let offset = 0;
  const allItems: MyCapsuleListResponse['items'] = [];
  let total = 0;
  let hasNext = true;

  while (hasNext) {
    const res = await getMyCapsules(DEFAULT_LIMIT, offset);
    allItems.push(...res.items);
    total = res.total;
    hasNext = res.hasNext === true && res.items.length > 0 && allItems.length < total;
    offset += res.items.length;
  }

  return { items: allItems, total, limit: DEFAULT_LIMIT, offset: 0, hasNext: false };
}
