import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export type TaskRow = {
  id: string;
  family_id: string;
  child_id: string;
  parent_id: string;
  subject: string;
  description: string;
  deadline: string;
  xp_reward: number;
  status: 'active' | 'submitted' | 'approved' | 'rejected';
  time_spent_sec: number;
  submitted_at: string | null;
  approved_at: string | null;
  parent_comment: string | null;
  bonus_coins: number | null;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: 'parent' | 'child';
  family_id: string | null;
  created_at: string;
};

export type FamilyRow = {
  id: string;
  owner_id: string;
  name: string | null;
  invite_code: string;
  created_at: string;
};

export type HeroRow = {
  child_id: string;
  family_id: string;
  name: string;
  level: number;
  xp: number;
  coins: number;
  streak_days: number;
  last_active_date: string | null;
  updated_at: string;
};
