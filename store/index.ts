import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  AppMode,
  Family,
  HeroStats,
  Profile,
  Task,
  XP_PER_LEVEL,
} from '@/types';
import {
  supabase,
  isSupabaseConfigured,
  TaskRow,
  ProfileRow,
  FamilyRow,
  HeroRow,
} from '@/lib/supabase';

type NewTaskInput = {
  subject: string;
  description: string;
  deadline: string;
  xpReward: number;
  childId: string;
};

interface AppState {
  // session / identity
  session: Session | null;
  profile: Profile | null;
  family: Family | null;
  children: Profile[]; // child profiles in the same family (for parent UI)
  heroByChildId: Record<string, HeroStats>;

  // local UI
  mode: AppMode;
  parentPin: string;
  tasks: Task[];
  hydrated: boolean;
  realtimeSubscribed: boolean;

  // mutators
  setMode: (mode: AppMode) => void;
  setParentPin: (pin: string) => void;
  setSession: (s: Session | null) => void;
  refreshFromRemote: () => Promise<void>;
  bootstrapAsParent: (displayName: string) => Promise<{ inviteCode: string } | null>;
  joinAsChild: (inviteCode: string, displayName: string) => Promise<boolean>;
  regenerateInviteCode: () => Promise<string | null>;
  signOutLocal: () => void;
  setHeroName: (childId: string, name: string) => Promise<void>;

  addTask: (data: NewTaskInput) => Promise<Task | null>;
  submitTask: (id: string, timeSpentSec: number) => Promise<void>;
  approveTask: (id: string, bonusCoins?: number) => Promise<void>;
  rejectTask: (id: string, comment: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  initRealtime: () => void;
  setHydrated: () => void;
}

// ── helpers ────────────────────────────────────────────────────────────────

const todayKey = () => new Date().toISOString().slice(0, 10);

const taskFromRow = (r: TaskRow): Task => ({
  id: r.id,
  familyId: r.family_id,
  childId: r.child_id,
  parentId: r.parent_id,
  subject: r.subject,
  description: r.description,
  deadline: r.deadline,
  xpReward: r.xp_reward,
  status: r.status,
  timeSpentSec: r.time_spent_sec,
  submittedAt: r.submitted_at ?? undefined,
  approvedAt: r.approved_at ?? undefined,
  parentComment: r.parent_comment ?? undefined,
  bonusCoins: r.bonus_coins ?? undefined,
  createdAt: r.created_at,
});

const profileFromRow = (r: ProfileRow): Profile => ({
  id: r.id,
  email: r.email,
  displayName: r.display_name ?? 'Без имени',
  avatarUrl: r.avatar_url,
  role: r.role,
  familyId: r.family_id,
});

const familyFromRow = (r: FamilyRow): Family => ({
  id: r.id,
  ownerId: r.owner_id,
  name: r.name ?? 'Моя семья',
  inviteCode: r.invite_code,
});

const heroFromRow = (r: HeroRow): HeroStats => {
  const { level, xpToNext } = computeLevel(r.xp);
  return {
    name: r.name,
    level: r.level || level,
    xp: r.xp,
    xpToNext,
    coins: r.coins,
    streakDays: r.streak_days,
    lastActiveDate: r.last_active_date ?? undefined,
  };
};

const computeLevel = (xp: number) => ({
  level: Math.floor(xp / XP_PER_LEVEL) + 1,
  xpToNext: XP_PER_LEVEL - (xp % XP_PER_LEVEL),
});

const updateStreak = (hero: HeroStats): HeroStats => {
  const today = todayKey();
  if (hero.lastActiveDate === today) return hero;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const next = hero.lastActiveDate === yesterday ? hero.streakDays + 1 : 1;
  return { ...hero, streakDays: next, lastActiveDate: today };
};

const heroToRow = (childId: string, familyId: string, h: HeroStats): HeroRow => ({
  child_id: childId,
  family_id: familyId,
  name: h.name,
  level: h.level,
  xp: h.xp,
  coins: h.coins,
  streak_days: h.streakDays,
  last_active_date: h.lastActiveDate ?? null,
  updated_at: new Date().toISOString(),
});

// ── store ──────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      session: null,
      profile: null,
      family: null,
      children: [],
      heroByChildId: {},

      mode: 'select',
      parentPin: '1234',
      tasks: [],
      hydrated: false,
      realtimeSubscribed: false,

      setMode: (mode) => set({ mode }),
      setParentPin: (pin) => set({ parentPin: pin }),

      setSession: (session) => {
        const prev = get().session?.user.id;
        set({ session });
        if (session?.user.id && session.user.id !== prev) {
          // initRealtime() is invoked at the END of refreshFromRemote,
          // once `family` is actually loaded — calling it here would be a
          // no-op because family is still null at this point.
          void get().refreshFromRemote();
        }
        if (!session) {
          set({
            profile: null,
            family: null,
            children: [],
            heroByChildId: {},
            tasks: [],
            mode: 'select',
          });
        }
      },

      signOutLocal: () =>
        set({
          session: null,
          profile: null,
          family: null,
          children: [],
          heroByChildId: {},
          tasks: [],
          mode: 'select',
        }),

      refreshFromRemote: async () => {
        if (!supabase) return;
        const uid = get().session?.user.id;
        if (!uid) return;

        // own profile
        const { data: profRows } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', uid)
          .limit(1);
        const profRow = profRows?.[0] as ProfileRow | undefined;
        if (!profRow) {
          // not yet onboarded — leave profile null so UI routes to /onboarding
          set({ profile: null });
          return;
        }
        const profile = profileFromRow(profRow);
        set({ profile });

        if (!profile.familyId) return;

        // family
        const { data: famRows } = await supabase
          .from('families')
          .select('*')
          .eq('id', profile.familyId)
          .limit(1);
        const family = famRows?.[0] ? familyFromRow(famRows[0] as FamilyRow) : null;

        // siblings (children in family)
        const { data: allMembers } = await supabase
          .from('profiles')
          .select('*')
          .eq('family_id', profile.familyId);
        const children = (allMembers as ProfileRow[] | null)
          ?.filter((p) => p.role === 'child')
          .map(profileFromRow) ?? [];

        // tasks
        const { data: tRows } = await supabase
          .from('tasks')
          .select('*')
          .eq('family_id', profile.familyId)
          .order('created_at', { ascending: false });
        const tasks = (tRows as TaskRow[] | null)?.map(taskFromRow) ?? [];

        // heroes
        const { data: hRows } = await supabase
          .from('heroes')
          .select('*')
          .eq('family_id', profile.familyId);
        const heroByChildId: Record<string, HeroStats> = {};
        for (const h of (hRows as HeroRow[] | null) ?? []) {
          heroByChildId[h.child_id] = heroFromRow(h);
        }

        set({ family, children, tasks, heroByChildId });

        // Now that `family` is populated, (idempotently) start realtime.
        get().initRealtime();
      },

      bootstrapAsParent: async (displayName) => {
        if (!supabase) return null;
        const { data, error } = await supabase.rpc('bootstrap_parent', {
          p_display_name: displayName,
        });
        if (error) throw error;
        await get().refreshFromRemote();
        const row = (data as { r_invite_code: string }[] | null)?.[0];
        return row ? { inviteCode: row.r_invite_code } : null;
      },

      joinAsChild: async (inviteCode, displayName) => {
        if (!supabase) return false;
        const { error } = await supabase.rpc('join_family_as_child', {
          p_invite_code: inviteCode.trim().toUpperCase(),
          p_display_name: displayName,
        });
        if (error) throw error;
        await get().refreshFromRemote();
        return true;
      },

      regenerateInviteCode: async () => {
        if (!supabase) return null;
        const familyId = get().family?.id;
        if (!familyId) return null;
        const { data, error } = await supabase.rpc('regenerate_invite_code', {
          p_family_id: familyId,
        });
        if (error) throw error;
        const code = data as string;
        const family = get().family;
        if (family) set({ family: { ...family, inviteCode: code } });
        return code;
      },

      setHeroName: async (childId, name) => {
        const hero = get().heroByChildId[childId];
        if (!hero) return;
        const updated = { ...hero, name };
        set({ heroByChildId: { ...get().heroByChildId, [childId]: updated } });
        if (supabase && get().family) {
          await supabase
            .from('heroes')
            .update({ name })
            .eq('child_id', childId);
        }
      },

      addTask: async (data) => {
        if (!supabase) return null;
        const profile = get().profile;
        const family = get().family;
        if (!profile || !family || profile.role !== 'parent') return null;

        const row: Omit<TaskRow, 'id' | 'created_at' | 'submitted_at' | 'approved_at' | 'parent_comment' | 'bonus_coins'> & {
          submitted_at: null;
          approved_at: null;
          parent_comment: null;
          bonus_coins: null;
        } = {
          family_id: family.id,
          child_id: data.childId,
          parent_id: profile.id,
          subject: data.subject,
          description: data.description,
          deadline: data.deadline,
          xp_reward: data.xpReward,
          status: 'active',
          time_spent_sec: 0,
          submitted_at: null,
          approved_at: null,
          parent_comment: null,
          bonus_coins: null,
        };

        const { data: inserted, error } = await supabase
          .from('tasks')
          .insert(row)
          .select('*')
          .single();
        if (error || !inserted) return null;
        const task = taskFromRow(inserted as TaskRow);
        set({ tasks: [task, ...get().tasks] });
        return task;
      },

      submitTask: async (id, timeSpentSec) => {
        if (!supabase) return;
        const target = get().tasks.find((t) => t.id === id);
        if (!target) return;
        const update = {
          status: 'submitted' as const,
          time_spent_sec: target.timeSpentSec + timeSpentSec,
          submitted_at: new Date().toISOString(),
          parent_comment: null,
        };
        const { data, error } = await supabase
          .from('tasks')
          .update(update)
          .eq('id', id)
          .select('*')
          .single();
        if (error || !data) return;
        const updated = taskFromRow(data as TaskRow);
        set({ tasks: get().tasks.map((t) => (t.id === id ? updated : t)) });
      },

      approveTask: async (id, bonusCoins = 0) => {
        if (!supabase) return;
        const target = get().tasks.find((t) => t.id === id);
        if (!target) return;

        const { data: tData, error: tErr } = await supabase
          .from('tasks')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            bonus_coins: bonusCoins,
          })
          .eq('id', id)
          .select('*')
          .single();
        if (tErr || !tData) return;
        const updatedTask = taskFromRow(tData as TaskRow);

        const childId = target.childId;
        const baseHero =
          get().heroByChildId[childId] ?? {
            name: 'Герой',
            level: 1,
            xp: 0,
            xpToNext: XP_PER_LEVEL,
            coins: 0,
            streakDays: 0,
          };
        const xpGain = target.xpReward;
        const coinGain = Math.floor(target.xpReward / 10) + bonusCoins;
        const newXp = baseHero.xp + xpGain;
        const { level, xpToNext } = computeLevel(newXp);
        const merged: HeroStats = updateStreak({
          ...baseHero,
          xp: newXp,
          level,
          xpToNext,
          coins: baseHero.coins + coinGain,
        });

        await supabase
          .from('heroes')
          .upsert(heroToRow(childId, target.familyId, merged), { onConflict: 'child_id' });

        set({
          tasks: get().tasks.map((t) => (t.id === id ? updatedTask : t)),
          heroByChildId: { ...get().heroByChildId, [childId]: merged },
        });
      },

      rejectTask: async (id, comment) => {
        if (!supabase) return;
        const { data, error } = await supabase
          .from('tasks')
          .update({ status: 'rejected', parent_comment: comment })
          .eq('id', id)
          .select('*')
          .single();
        if (error || !data) return;
        const updated = taskFromRow(data as TaskRow);
        set({ tasks: get().tasks.map((t) => (t.id === id ? updated : t)) });
      },

      deleteTask: async (id) => {
        if (!supabase) return;
        await supabase.from('tasks').delete().eq('id', id);
        set({ tasks: get().tasks.filter((t) => t.id !== id) });
      },

      initRealtime: () => {
        const sb = supabase;
        const familyId = get().family?.id;
        if (!sb || !familyId || get().realtimeSubscribed) return;
        set({ realtimeSubscribed: true });

        sb.channel(`tasks-${familyId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'tasks', filter: `family_id=eq.${familyId}` },
            (payload) => {
              const op = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
              if (op === 'DELETE') {
                const id = (payload.old as TaskRow | undefined)?.id;
                if (id) set({ tasks: get().tasks.filter((t) => t.id !== id) });
                return;
              }
              const row = payload.new as TaskRow;
              const t = taskFromRow(row);
              const tasks = get().tasks;
              set({
                tasks: tasks.some((x) => x.id === t.id)
                  ? tasks.map((x) => (x.id === t.id ? t : x))
                  : [t, ...tasks],
              });
            },
          )
          .subscribe();

        sb.channel(`heroes-${familyId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'heroes', filter: `family_id=eq.${familyId}` },
            (payload) => {
              const row = payload.new as HeroRow | undefined;
              if (!row) return;
              set({
                heroByChildId: {
                  ...get().heroByChildId,
                  [row.child_id]: heroFromRow(row),
                },
              });
            },
          )
          .subscribe();

        sb.channel(`profiles-${familyId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'profiles', filter: `family_id=eq.${familyId}` },
            () => {
              void get().refreshFromRemote();
            },
          )
          .subscribe();
      },

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'hwhero-state',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        parentPin: s.parentPin,
        mode: s.mode,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

// ── selectors ───────────────────────────────────────────────────────────────

export const selectActiveTasks = (s: AppState) =>
  s.tasks.filter((t) => t.status === 'active' || t.status === 'rejected');

export const selectSubmittedTasks = (s: AppState) =>
  s.tasks.filter((t) => t.status === 'submitted');

export const selectVisibleForChild = (s: AppState) => {
  const me = s.profile?.id;
  if (!me) return [];
  return s.tasks.filter((t) => t.childId === me && t.status !== 'approved');
};

export const selectOverdueTasks = (s: AppState) => {
  const now = Date.now();
  return s.tasks.filter(
    (t) =>
      (t.status === 'active' || t.status === 'rejected') &&
      new Date(t.deadline).getTime() < now,
  );
};

export const selectHeroForCurrentChild = (s: AppState): HeroStats | null => {
  const me = s.profile?.id;
  if (!me) return null;
  return s.heroByChildId[me] ?? null;
};

export { isSupabaseConfigured };
