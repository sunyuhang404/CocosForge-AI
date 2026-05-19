export type UserInfo = {
  id: number;
  email: string;
  displayName?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthSession = {
  user: UserInfo;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: string;
  refreshTokenExpiresAt: string;
};

const AUTH_STORAGE_KEY = "gameforge.auth.session";

export function getAuthSession(): AuthSession | null {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function getAccessToken(): string {
  return getAuthSession()?.accessToken ?? "";
}

export function saveAuthSession(session: AuthSession) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent("auth:changed"));
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("auth:changed"));
}
