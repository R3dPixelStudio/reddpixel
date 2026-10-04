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
  reducedMotion: boolean;
  isContentView: boolean;
  isSceneObscured: boolean;
  isSceneSettling: boolean;
  isCubeInteracting: boolean;
  setCubeInteracting: (value: boolean) => void;
  setSceneSettling: (value: boolean) => void;
  workCollectionOpen: boolean;
  workCollectionClosing: boolean;
  workCloseRequest: number;
  setWorkCollection: (open: boolean, closing?: boolean) => void;
  requestWorkClose: () => void;
  setSceneObscured: (value: boolean) => void;
  setReducedMotion: (value: boolean) => void;
  setContentView: (value: boolean) => void;
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
  isMobile: typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  isLowEnd: false,
  isCubeReady: false,
  reducedMotion: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  isContentView: false,
  isSceneObscured: false,
  isSceneSettling: false,
  isCubeInteracting: false,
  setCubeInteracting: (isCubeInteracting) => set({ isCubeInteracting }),
  setSceneSettling: (isSceneSettling) => set({ isSceneSettling }),
  workCollectionOpen: false,
  workCollectionClosing: false,
  workCloseRequest: 0,
  setWorkCollection: (workCollectionOpen, workCollectionClosing = false) => set({ workCollectionOpen, workCollectionClosing }),
  requestWorkClose: () => set(state => ({ workCloseRequest: state.workCloseRequest + 1 })),
  setSceneObscured: (isSceneObscured) => set({ isSceneObscured }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setContentView: (isContentView) => set({ isContentView }),
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
