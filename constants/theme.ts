export const Palette = {
  child: {
    primary: '#639922',
    primarySoft: '#EAF3DE',
    primaryDark: '#4A7818',
  },
  parent: {
    primary: '#378ADD',
    primarySoft: '#E6F1FB',
    primaryDark: '#1F6BB8',
  },
  status: {
    active: '#9CA3AF',
    submitted: '#F59E0B',
    approved: '#22C55E',
    rejected: '#EF4444',
  },
  light: {
    bg: '#FFFFFF',
    surface: '#F8FAFB',
    card: '#FFFFFF',
    border: '#E5E7EB',
    text: '#111827',
    textMuted: '#6B7280',
    overlay: 'rgba(0,0,0,0.4)',
  },
  dark: {
    bg: '#0B0F14',
    surface: '#11161D',
    card: '#161C24',
    border: '#1F2731',
    text: '#F3F4F6',
    textMuted: '#9CA3AF',
    overlay: 'rgba(0,0,0,0.6)',
  },
};

export type ThemeMode = 'light' | 'dark';

export const getColors = (mode: ThemeMode) => ({
  ...Palette[mode],
  status: Palette.status,
  child: Palette.child,
  parent: Palette.parent,
});

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};
