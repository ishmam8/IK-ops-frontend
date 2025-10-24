// src/features/auth/api/auth.api.ts
import { http } from "@/lib/http";

type TokenPair = { access: string; refresh: string };

export async function login(username: string, password: string): Promise<TokenPair> {
  const data = await http.post<TokenPair>("/api/login/", { username, password }, { auth: false });
  // PLACEHOLDER: persist tokens your way (localStorage, memory, etc.)
  // TODO: 
  // persist in HTTP cookies with HttpOnly flag for security
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
  return data;
}

export async function refresh(): Promise<string> {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) throw new Error("No refresh token");

  const data = await http.post<TokenPair>("/api/token/refresh/", { refresh }, { auth: false });
  // TODO: 
  // persist in HTTP cookies with HttpOnly flag for security NOT localStorage
  localStorage.setItem("access_token", data.access);
  if (data.refresh) localStorage.setItem("refresh_token", data.refresh); // if rotation enabled
  return data.access;
}
