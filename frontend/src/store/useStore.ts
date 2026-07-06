import { create } from 'zustand';

interface StoreState {
  user: any | null;
  projects: any[];
  setUser: (user: any) => void;
  addProject: (project: any) => void;
}

export const useStore = create<StoreState>((set) => ({
  user: null,
  projects: [],
  setUser: (user) => set({ user }),
  addProject: (project) =>
    set((state) => ({
      projects: [...state.projects, project],
    })),
}));
