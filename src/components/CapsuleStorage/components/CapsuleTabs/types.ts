export type CapsuleTabType = 'opened' | 'locked';

export interface CapsuleTabsProps {
  activeTab: CapsuleTabType;
  openedCount: number;
  lockedCount: number;
  onTabChange: (tab: CapsuleTabType) => void;
}
