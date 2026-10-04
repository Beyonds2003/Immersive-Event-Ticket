import { atom } from "jotai";
import type { User } from "@supabase/supabase-js";

export type Profile = {
  full_name: string;
  email: string;
  role: string;
  purchased_nfc: boolean;
} | null;

/** Synced from React Router location.pathname into the R3F canvas via Jotai */
export const pathnameAtom = atom<string>(window.location.pathname);

/** Synced profile dialog open/close state */
export const isProfileOpenAtom = atom<boolean>(false);

/** Synced physics engine loaded state */
export const isPhysicsLoadedAtom = atom<boolean>(false);

/** True once the loading screen has fully completed */
export const isLoadingDoneAtom = atom<boolean>(false);

/** Current authenticated user (null when logged out) */
export const userAtom = atom<User | null>(null);

/** Current user's profile from the profiles table */
export const profileAtom = atom<Profile>(null);

/** True while auth session is being restored on app start */
export const isAuthLoadingAtom = atom<boolean>(true);
