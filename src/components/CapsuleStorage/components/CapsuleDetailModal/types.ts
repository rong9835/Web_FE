import type { CapsuleDetailSlot } from '@/commons/apis/capsules/my-capsules/types';

export interface CapsuleDetailModalProps {
  visible: boolean;
  capsuleId: string | null;
  title: string;
  slots: CapsuleDetailSlot[];
  selectedSlotIndex: number;
  onSelectSlot: (index: number) => void;
  onClose: () => void;
  /** 상세 로딩 중 */
  isLoading?: boolean;
  /** 403/404 등 에러 메시지 */
  errorMessage?: string | null;
}
