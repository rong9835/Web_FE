/**
 * @fileoverview 결제 내역 페이지 훅
 * @description 결제 내역 페이지의 상태 관리 및 이벤트 핸들러
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMyPayments } from '@/commons/apis/payment/hooks/usePaymentHistory';
import type { PaymentListItem } from '@/commons/apis/payment/types';
import { formatCurrency } from '@/commons/utils/format';

/**
 * usePaymentHistoryPage 훅
 *
 * 결제 내역 페이지의 모든 상태와 로직을 관리합니다.
 */
export function usePaymentHistoryPage() {
  const router = useRouter();
  const [selectedPayment, setSelectedPayment] = useState<PaymentListItem | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  // API 호출
  const { data, isLoading, error } = useMyPayments({
    page: 1,
    limit: 100,
    status: 'ALL',
  });

  const allPayments = data?.payments || [];

  // 헤더 닫기 핸들러
  const handleClose = () => {
    router.back();
  };

  // 카드 클릭 핸들러
  const handleCardPress = (payment: PaymentListItem) => {
    setSelectedPayment(payment);
    setIsDetailVisible(true);
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setIsDetailVisible(false);
  };

  // 영수증 상세보기
  const handleViewReceipt = (payment: PaymentListItem) => {
    // 샌드박스 환경 체크
    const isSandbox = payment.receiptUrl?.includes('sandbox');

    if (isSandbox) {
      // 샌드박스 환경에서는 영수증 URL이 제대로 작동하지 않을 수 있음
      alert(
        '⚠️ 테스트 환경 안내\n\n' +
        '현재 샌드박스(테스트) 환경에서는 영수증 상세보기가 제한됩니다.\n\n' +
        `결제 정보:\n` +
        `• 주문번호: ${payment.orderNo}\n` +
        `• 결제금액: ${formatCurrency(payment.amount)}\n` +
        `• 결제수단: ${payment.method}\n` +
        `• 결제일: ${new Date(payment.approvedAt).toLocaleDateString('ko-KR')}\n\n` +
        '실제 프로덕션 환경에서는 정상적으로 영수증을 확인하실 수 있습니다.'
      );
      return;
    }

    // 프로덕션 환경에서는 영수증 URL 열기
    if (payment.receiptUrl) {
      window.open(payment.receiptUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('영수증 URL을 찾을 수 없습니다.');
    }
  };

  return {
    // 결제 목록 데이터
    data,
    allPayments,
    isLoading,
    error,

    // 상세 모달 상태
    selectedPayment,
    isDetailVisible,

    // 이벤트 핸들러
    handleClose,
    handleCardPress,
    handleCloseModal,
    handleViewReceipt,
  };
}
