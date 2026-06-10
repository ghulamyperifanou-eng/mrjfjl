export type AnimalType = 'cat' | 'dog' | 'panda' | 'rabbit';

export interface PetState {
  name: string;
  animalType: AnimalType;
  level: number;
  experience: number;      // Current level exp
  nextLevelExp: number;    // Exp needed to next level (e.g. 50, 100, 200, 400)
  totalFedTimes: number;   // Count of feeding times
  status: 'idle' | 'happy' | 'eating' | 'sleeping' | 'dizzy';
  lastFed: number;         // Timestamp
  playPasses: number;      // Unlocked free play/feed/bath passes!
  accessory?: string;      // Current dress up accessory ('none', 'crown', 'glasses', 'scarf', 'wings', 'wizard_hat', etc.)
}

export interface Member {
  id: string;
  name: string;
  avatar: string;          // Emoji avatar
  points: number;          // Private pocket points
  pet: PetState;           // Each member has their own pet animal!
}

export interface ChoreItem {
  id: string;
  title: string;
  rewardPoints: number;
  category: 'chore' | 'study' | 'behavior' | 'health';
  icon: string;
  isCustom?: boolean;
}

export interface RewardItem {
  id: string;
  title: string;
  costPoints: number;
  category: 'treat' | 'pet-play' | 'recreation' | 'snack';
  icon: string;
  stock?: number;
  isCustom?: boolean;
}

export interface ActionLog {
  id: string;
  memberId: string;       // Foreign key to trace who did it
  memberName: string;
  timestamp: number;
  type: 'reward' | 'deduct' | 'level_up' | 'redeem' | 'custom_penalty' | 'pet_grow';
  title: string;
  pointsChange: number;
  currentTotal: number;
}
