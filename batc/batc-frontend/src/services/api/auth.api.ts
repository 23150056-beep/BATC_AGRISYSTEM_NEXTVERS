import apiClient from "./client";
import type { User } from "@/types";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<TokenPair>("/auth/login/", payload).then((r) => r.data),

  logout: (refresh: string) =>
    apiClient.post("/auth/logout/", { refresh }).then((r) => r.data),

  refresh: (refresh: string) =>
    apiClient.post<Pick<TokenPair, "access">>("/auth/refresh/", { refresh }).then((r) => r.data),

  me: () => apiClient.get<User>("/auth/me/").then((r) => r.data),
};
