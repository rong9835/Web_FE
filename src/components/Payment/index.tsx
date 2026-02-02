'use client';

/**
 * @fileoverview Payment 메인 컨테이너 컴포넌트
 * @description 결제 페이지의 최상위 컨테이너, 전체 결제 플로우 관리
 *
 * @note
 * Phase 5에서 실제 API 호출로 교체되었습니다.
 */

import React from 'react';
import { TimeCapsuleHeader } from '@/commons/components/timecapsule-header';
import { OrderSummary } from './components/OrderSummary';
import { TossPaymentWidget } from './components/TossPaymentWidget';
import { PaymentStatus } from './components/PaymentStatus';
import { AgreementSection } from './components/AgreementSection';
import { ErrorDisplay } from './components/ErrorDisplay';
import { RetryButton } from './components/RetryButton';
import { usePaymentPage } from './hooks';
import styles from './styles.module.css';

/**
 * Payment 컴포넌트
 *
 * 결제 페이지의 최상위 컨테이너입니다.
 * - URL 쿼리 파라미터에서 주문 ID 추출
 * - 실제 API를 통한 주문 정보 조회
 * - 결제 플로우 오케스트레이션
 */
export function Payment() {
  const {
    orderId,
    orderSummaryData,
    isLoadingOrder,
    orderError,
    errorType,
    setAgreementState,
    isAllAgreed,
    paymentState,
    isPaymentCompleted,
    handlePaymentSuccess,
    handlePaymentError,
    handleBack,
    handleRetry,
    retry,
  } = usePaymentPage();

  // 주문 정보 로딩 중
  if (isLoadingOrder) {
    return (
      <div className={styles.container}>
        <TimeCapsuleHeader
          title="결제하기"
          onBack={handleBack}
        />
        <div className={styles.loading}>
          <PaymentStatus status="loading" />
        </div>
      </div>
    );
  }

  // 주문 정보 조회 실패
  if (orderError || !orderSummaryData) {
    const errorMessage =
      orderError?.message || '주문 정보를 불러올 수 없습니다.';
    return (
      <div className={styles.container}>
        <TimeCapsuleHeader
          title="결제하기"
          onBack={handleBack}
        />
        <div className={styles.content}>
          <div className={styles.errorSection}>
            <ErrorDisplay message={errorMessage} type={errorType} />
            <RetryButton onRetry={handleRetry} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 헤더: 뒤로가기 + "결제하기" 제목 */}
      <TimeCapsuleHeader
        title="결제하기"
        onBack={handleBack}
      />
      <div className={styles.content}>

        {/* 주문 상품 섹션 */}
        <OrderSummary data={orderSummaryData} />

        {/* 전체 동의 섹션 */}
        <AgreementSection
          onAgreementChange={(state) => setAgreementState(state)}
        />

        {/* 결제 상태 표시 */}
        {paymentState.status !== 'idle' && (
          <PaymentStatus
            status={paymentState.status}
            error={paymentState.error}
          />
        )}

        {/* US3: 오류 처리 */}
        {paymentState.status === 'failed' && paymentState.error && (
          <div className={styles.errorSection}>
            <ErrorDisplay message={paymentState.error} type="payment" />
            <RetryButton onRetry={retry} />
          </div>
        )}

        {/* 결제 버튼 */}
        {!isPaymentCompleted && (
          <div className={styles.paymentButtonWrapper}>
            <TossPaymentWidget
              orderId={orderId || ''}
              amount={orderSummaryData.totalAmount}
              orderName="타임캡슐 생성"
              customerName={orderSummaryData.capsuleName}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              disabled={!isAllAgreed}
            />
          </div>
        )}
      </div>
    </div>
  );
}
