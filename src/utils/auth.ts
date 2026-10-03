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

  // Profile & session are synced automatically by AuthProvider's onAuthStateChange
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
