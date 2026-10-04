import { getDefaultStore } from "jotai";
import { profileAtom, type Profile } from "../libs/atoms";
import { supabase } from "./supabase";

export async function sendOtpSupabase(email: string) {
  if (!email) {
    return { error: "Email is required", success: false };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { error: error.message, success: false };
  }

  return { success: true, error: "" };
}

export async function verifyOtp(email: string, token: string) {
  if (!email || !token) {
    const missing = [!email && "Email", !token && "OTP"].filter(Boolean);

    return {
      success: false,
      error: `${missing.join(" and ")} ${missing.length > 1 ? "are" : "is"} required!`,
    };
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data.user) {
    return { success: false, error: "Verification failed" };
  }

  const user = data.user;

  // Only assign default name if the user doesn't have one; never overwrite an existing name
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, role, purchased_nfc")
      .eq("id", user.id)
      .single();

    if (!profile?.full_name?.trim()) {
      const username = email.split("@")[0].replace(/\d+$/, "");
      const formattedUsername =
        username.charAt(0).toUpperCase() + username.slice(1);

      const { data: updatedProfile } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email,
          full_name: formattedUsername,
        })
        .select("full_name, email, role, purchased_nfc")
        .single();

      if (updatedProfile) {
        getDefaultStore().set(profileAtom, updatedProfile as Profile);
      }
    } else {
      // User already has a name: preserve it without modifying the database
      getDefaultStore().set(profileAtom, profile as Profile);
    }
  }

  return { success: true, error: "" };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, error: error.message };
  }

  // AuthProvider's onAuthStateChange clears userAtom & profileAtom automatically
  return { success: true, error: "" };
}
