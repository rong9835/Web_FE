import type { MyCapsuleItem } from '@/commons/apis/capsules/my-capsules/types';

export interface WaitingRoomSectionProps {
  capsules: MyCapsuleItem[];
  onCardClick: (capsuleId: string) => void;
}
