/**
 * 날짜 포맷팅 함수
 * ISO 8601 → "YYYY-MM-DD"
 */
export const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 결제 상태 텍스트 변환
 */
export const getStatusText = (status: string): string => {
  switch (status) {
    case 'DONE':
      return '완료';
    case 'CANCELED':
      return '취소됨';
    default:
      return status;
  }
};
