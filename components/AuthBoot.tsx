import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store';

/**
 * Mount once near the root. Subscribes to Supabase auth changes
 * and keeps the Zustand session/profile in sync.
 */
export const AuthBoot = () => {
  const setSession = useAppStore((s) => s.setSession);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [setSession]);

  return null;
};
