import { atom } from "jotai";

/** Synced from React Router location.pathname into the R3F canvas via Jotai */
export const pathnameAtom = atom<string>(window.location.pathname);

/** Synced profile dialog open/close state */
export const isProfileOpenAtom = atom<boolean>(false);
