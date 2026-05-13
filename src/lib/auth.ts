import { supabaseClient } from './supabaseClient';

export async function getAccessToken() {
  if (!supabaseClient) {
    return '';
  }
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  return session?.access_token ?? '';
}

export async function signOut() {
  if (!supabaseClient) {
    return;
  }
  await supabaseClient.auth.signOut();
}
