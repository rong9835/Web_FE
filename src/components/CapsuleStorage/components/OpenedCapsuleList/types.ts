import type { MyCapsuleItem } from '@/commons/apis/capsules/my-capsules/types';

export interface OpenedCapsuleListProps {
  capsules: MyCapsuleItem[];
  onCardClick: (capsuleId: string) => void;
}
