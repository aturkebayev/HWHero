export type TaskStatus = 'active' | 'submitted' | 'approved' | 'rejected';

export type AppMode = 'select' | 'parent' | 'child';
export type Role = 'parent' | 'child';

export interface Profile {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: Role;
  familyId: string | null;
}

export interface Family {
  id: string;
  ownerId: string;
  name: string;
  inviteCode: string;
}

export interface Task {
  id: string;
  familyId: string;
  childId: string;
  parentId: string;
  subject: string;
  description: string;
  deadline: string;
  xpReward: number;
  status: TaskStatus;
  timeSpentSec: number;
  submittedAt?: string;
  approvedAt?: string;
  parentComment?: string;
  bonusCoins?: number;
  createdAt: string;
}

export interface HeroStats {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  coins: number;
  streakDays: number;
  lastActiveDate?: string;
}

export const XP_PER_LEVEL = 1000;

export const SUBJECTS = [
  'Математика',
  'Русский язык',
  'Литература',
  'Биология',
  'История',
  'Физика',
  'Английский',
  'Химия',
  'Другое',
] as const;

export type Subject = (typeof SUBJECTS)[number];

export const SUBJECT_ICONS: Record<string, string> = {
  'Математика': 'calculator',
  'Русский язык': 'language',
  'Литература': 'book',
  'Биология': 'leaf',
  'История': 'time',
  'Физика': 'planet',
  'Английский': 'globe',
  'Химия': 'flask',
  'Другое': 'ellipsis-horizontal',
};

export const HERO_EMOJI_BY_LEVEL = [
  '🥚', '🐣', '🧙', '⚔️', '🏆', '👑', '🌟', '🔥', '💫', '🌌',
];

export const heroEmojiForLevel = (level: number): string => {
  const idx = Math.max(0, Math.min(level - 1, HERO_EMOJI_BY_LEVEL.length - 1));
  return HERO_EMOJI_BY_LEVEL[idx];
};
