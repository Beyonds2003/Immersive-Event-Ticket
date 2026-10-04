import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { supabase } from "../../utils/supabase";
import {
  userAtom,
  profileAtom,
  isAuthLoadingAtom,
  type Profile,
} from "../../libs/atoms";

/**
 * Listens to Supabase auth state changes and syncs user + profile
 * into Jotai atoms. Mount once near the app root.
 */
const AuthProvider = () => {
  const setUser = useSetAtom(userAtom);
  const setProfile = useSetAtom(profileAtom);
  const setAuthLoading = useSetAtom(isAuthLoadingAtom);

  useEffect(() => {
    // 1. Restore existing session on mount
    const restoreSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }

      setAuthLoading(false);
    };

    // 2. Fetch profile (role) from the profiles table
    const fetchProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, role, purchased_nfc")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      } else {
        setProfile(null);
      }
    };

    restoreSession();

    // 3. Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, setAuthLoading]);

  return null;
};

export default AuthProvider;
