const SESSION_KEY = "boys_session_token";
const PROFILE_KEY = "boys_student_profile";

export function saveSessionToken(token: string): void {
  localStorage.setItem(SESSION_KEY, token);
}

export function loadSessionToken(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(PROFILE_KEY);
}

export function saveProfile(profile: { name: string; grade: string; groupName: string }): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadProfile(): { name: string; grade: string; groupName: string } | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as { name: string; grade: string; groupName: string }) : null;
  } catch {
    return null;
  }
}
