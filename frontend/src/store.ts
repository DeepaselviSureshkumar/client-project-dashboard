import { create } from "zustand";

export type User = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER";
};

type AuthState = {
  user: User | null;
  setUser: (user: User | null) => void;
};

export const useAuth = create<AuthState>(set => ({
  user: null,
  setUser: user => set({ user })
}));
