import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

/**
 * Redirect URL the OAuth provider sends the user back to.
 *  - Expo Go:  exp://192.168.x.y:8081/--/auth-callback
 *  - Standalone build: homeworkhero://auth-callback
 *
 * Must be present in Supabase → Authentication → URL Configuration
 * (Redirect URLs list, and as the Site URL fallback for dev).
 */
export const getRedirectUrl = () => Linking.createURL('auth-callback');

/** Pull access/refresh tokens out of a callback URL (hash or query). */
export const extractTokens = (
  url: string,
): { access_token: string; refresh_token: string } | null => {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(`OAuth error: ${errorCode}`);
  if (params?.access_token && params?.refresh_token) {
    return {
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    };
  }
  // Fallback: parse the hash fragment manually (#access_token=...).
  const hash = url.split('#')[1];
  if (hash) {
    const frag = new URLSearchParams(hash);
    const access = frag.get('access_token');
    const refresh = frag.get('refresh_token');
    if (access && refresh) return { access_token: access, refresh_token: refresh };
  }
  return null;
};

/**
 * Given a callback URL, establish the Supabase session.
 * Returns true if a session was set. Used by the auth-callback route
 * (Android deep-links straight into the app) and by signInWithGoogle (iOS).
 */
export const setSessionFromUrl = async (url: string): Promise<boolean> => {
  if (!supabase) return false;
  const tokens = extractTokens(url);
  if (!tokens) return false;
  const { error } = await supabase.auth.setSession(tokens);
  if (error) throw error;
  return true;
};

export const signInWithGoogle = async (): Promise<void> => {
  if (!supabase) throw new Error('Supabase is not configured');

  const redirectTo = getRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('No OAuth URL returned by Supabase');

  // iOS: the browser session captures the redirect and returns it here.
  // Android: the redirect usually deep-links into the app instead — that
  // path is handled by app/auth-callback.tsx, so a non-success result here
  // is not necessarily an error.
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'success' && result.url) {
    await setSessionFromUrl(result.url);
  }
};

export const signOut = async (): Promise<void> => {
  if (!supabase) return;
  await supabase.auth.signOut();
};
