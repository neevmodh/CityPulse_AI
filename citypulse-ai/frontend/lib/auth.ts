import { User } from "@/types";

const USER_KEY = "citypulse_user";
const TOKEN_KEY = "citypulse_token";

export function saveSession(user: User, token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
}

export function getSession(): { user: User; token: string } | null {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem(USER_KEY);
  const token = localStorage.getItem(TOKEN_KEY);
  if (!user || !token) return null;
  try {
    return { user: JSON.parse(user), token };
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function getUser(): User | null {
  return getSession()?.user ?? null;
}

export function getToken(): string | null {
  return getSession()?.token ?? null;
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function hasRole(role: User["role"]): boolean {
  return getUser()?.role === role;
}

// Demo login helper — sets a fake session for demo mode
export function setDemoSession(role: "citizen" | "worker" | "admin") {
  const demoUsers: Record<string, User> = {
    citizen: { id: "u001", name: "Arjun Mehta", email: "arjun@demo.com", role: "citizen", ward: "Ward-7" },
    worker:  { id: "u020", name: "Rajesh Kumar", email: "rajesh@demo.com", role: "worker", ward: "Ward-1" },
    admin:   { id: "u030", name: "Anita Singh", email: "admin@demo.com", role: "admin", ward: "ALL" },
  };
  saveSession(demoUsers[role], `demo_token_${role}`);
}
