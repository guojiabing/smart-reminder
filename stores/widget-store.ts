import { create } from "zustand";
import { produce } from "immer";

interface WidgetState {
  isOpen: boolean;
  isRead: boolean;
  isAnimating: boolean;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  markAsRead: () => void;
  setAnimating: (animating: boolean) => void;
}

export const useWidgetStore = create<WidgetState>((set) => ({
  isOpen: false, // Minimized by default
  isRead: false,
  isAnimating: false,
  
  toggleOpen: () => set(produce((state: WidgetState) => {
    state.isOpen = !state.isOpen;
  })),

  setOpen: (open: boolean) => set(produce((state: WidgetState) => {
    state.isOpen = open;
  })),
  
  markAsRead: () => set(produce((state: WidgetState) => {
    state.isRead = true;
  })),
  
  setAnimating: (animating: boolean) => set(produce((state: WidgetState) => {
    state.isAnimating = animating;
  })),
}));
