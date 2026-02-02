/**
 * @fileoverview 결제 페이지 메인 훅
 * @description 결제 페이지의 모든 상태와 로직을 통합 관리하는 훅
 */

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useOrderInfo } from './useOrderInfo';
import { usePayment } from './usePayment';
import { useOrderStatus } from '@/commons/apis/orders/hooks/useOrderStatus';
import type { AgreementState } from '../components/AgreementSection/types';
import type { ApiError } from '@/commons/provider/api-provider/api-client';

/**
 * 에러 타입 판단 함수
 *
 * ApiError의 속성을 분석하여 적절한 에러 타입을 반환합니다.
 * - 네트워크 오류: status가 없거나 특정 코드인 경우
 * - 주문 오류: 그 외의 경우
 */
function getErrorType(error: ApiError | Error | null): 'network' | 'order' | 'general' {
  if (!error) return 'general';

  // ApiError 타입 체크
  const apiError = error as ApiError;

  // 네트워크 오류 판단: status가 없거나 특정 코드인 경우
  if (
    !apiError.status ||
    apiError.code === 'ERR_NETWORK' ||
    apiError.code === 'ECONNABORTED' ||
    apiError.code === 'ERR_CANCELED' ||
    error.message?.toLowerCase().includes('network') ||
    error.message?.toLowerCase().includes('fetch')
  ) {
    return 'network';
  }

  // 기본적으로 주문 관련 오류
  return 'order';
}

/**
 * usePaymentPage 훅
 *
 * 결제 페이지의 모든 상태와 로직을 통합 관리합니다.
 * - URL 파라미터에서 주문 ID 추출
 * - 주문 정보 및 상태 조회
 * - 동의 상태 관리
 * - 결제 플로우 관리
 */
export function usePaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  // 주문 정보 조회
  const { orderSummaryData, isLoading: isLoadingOrder, error: orderError } =
    useOrderInfo(orderId);

  // 주문 상태 조회 (결제 완료 후 폴링)
  const { data: orderStatus } = useOrderStatus(orderId, {
    enablePolling: true,
    pollingInterval: 3000,
  });

  // 동의 상태 관리
  const [agreementState, setAgreementState] = useState<AgreementState>({
    allAgreed: false,
    termsAgreed: false,
    privacyAgreed: false,
    paymentAgreed: false,
  });

  // 결제 플로우 관리
  const {
    paymentState,
    handlePaymentSuccess,
    handlePaymentError,
    retry,
  } = usePayment(
    orderId || '',
    orderSummaryData?.totalAmount || 0,
    `타임캡슐 주문 - ${orderId || ''}`
  );

  // 모든 필수 동의가 완료되었는지 확인
  const isAllAgreed =
    agreementState.termsAgreed &&
    agreementState.privacyAgreed &&
    agreementState.paymentAgreed;

  // 결제 완료 상태 확인
  const isPaymentCompleted =
    orderStatus?.order_status === 'PAID' ||
    paymentState.status === 'success';

  // 에러 타입 판단
  const errorType = getErrorType(orderError);

  // 뒤로가기 핸들러
  const handleBack = () => {
    router.back();
  };

  // 재시도 핸들러
  const handleRetry = () => {
    window.location.reload();
  };

  return {
    // URL 파라미터
    orderId,

    // 주문 정보
    orderSummaryData,
    isLoadingOrder,
    orderError,
    errorType,

    // 주문 상태
    orderStatus,

    // 동의 상태
    agreementState,
    setAgreementState,
    isAllAgreed,

    // 결제 상태
    paymentState,
    isPaymentCompleted,

    // 이벤트 핸들러
    handlePaymentSuccess,
    handlePaymentError,
    handleBack,
    handleRetry,
    retry,
  };
}
