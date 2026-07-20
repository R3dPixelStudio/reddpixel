import { create } from 'zustand'

// THE FIX: Change enum to a readonly object
export const MODES = {
  LANDING: 'LANDING',
  TRAVERSAL: 'TRAVERSAL',
  EXPLORE: 'EXPLORE'
} as const;

// Extract the type for your interface
export type ModeType = typeof MODES[keyof typeof MODES];

interface ExperienceState {
  currentPhase: number;
  mode: ModeType; 
  isTransitioning: boolean;
  isMobile: boolean;
  isLowEnd: boolean;
  isCubeReady: boolean;
  setCubeReady: () => void;
  setPhase: (phase: number) => void;
  setMode: (mode: ModeType) => void;
  setIsTransitioning: (status: boolean) => void;
  setMobileLayout: (isMobile: boolean) => void;
  setHardwareProfile: (isLowEnd: boolean) => void;
  showTraversalControls: () => boolean;
}

export const useExperience = create<ExperienceState>((set, get) => ({
  currentPhase: 0, 
  mode: MODES.LANDING,
  isTransitioning: false,
  isMobile: false,
  isLowEnd: false,
  isCubeReady: false,
  setCubeReady: () => set({ isCubeReady: true }),
  setPhase: (phase) => set({ currentPhase: Math.max(0, Math.min(phase, 3)) }),
  setMode: (mode) => set({ mode }),
  setIsTransitioning: (status) => set({ isTransitioning: status }),
  setMobileLayout: (isMobile) => set({ isMobile }),
  setHardwareProfile: (isLowEnd) => set({ isLowEnd }),
  
  showTraversalControls: () => {
    return get().currentPhase > 0;
  }
}))
