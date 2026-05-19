import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { apiRequest } from "../api/api";
import {
  type AuthSession,
  type UserInfo,
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
} from "../api/authSession";

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  email: string;
  password: string;
  displayName?: string;
};

export const useAuthStore = defineStore("auth", () => {
  const session = ref<AuthSession | null>(getAuthSession());

  const user = computed(() => session.value?.user ?? null);
  const isLoggedIn = computed(() => Boolean(session.value?.accessToken));

  function syncFromStorage() {
    session.value = getAuthSession();
  }

  async function login(payload: LoginPayload) {
    const nextSession = await apiRequest<AuthSession>(
      "/api/users/login",
      {
        method: "POST",
        body: payload,
      },
      { skipAuth: true },
    );
    saveAuthSession(nextSession);
    session.value = nextSession;
    return nextSession;
  }

  async function registerUser(payload: RegisterPayload) {
    return apiRequest<UserInfo>(
      "/api/users/register",
      {
        method: "POST",
        body: payload,
      },
      { skipAuth: true },
    );
  }

  async function logout() {
    try {
      if (session.value?.accessToken) {
        await apiRequest<void>("/api/users/logout", { method: "POST" });
      }
    } finally {
      clearAuthSession();
      session.value = null;
    }
  }

  window.addEventListener("auth:changed", syncFromStorage);

  return {
    session,
    user,
    isLoggedIn,
    login,
    logout,
    registerUser,
    syncFromStorage,
  };
});
