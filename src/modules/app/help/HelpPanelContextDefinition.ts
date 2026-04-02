import { createContext } from "react";
import type { HelpModuleContent, HelpText, HelpWalkthroughStep } from "./types";

export interface HelpPanelContextValue {
  isOpen: boolean;
  isLoading: boolean;
  moduleId: string | null;
  moduleContent: HelpModuleContent | null;
  currentStepIndex: number;
  activeStep: HelpWalkthroughStep | null;
  hasSeenCurrentModule: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  nextStep: () => void;
  previousStep: () => void;
  finishWalkthrough: () => void;
  setCurrentStepIndex: (value: number) => void;
  resolveText: (text: HelpText) => string;
}

export const HelpPanelContext = createContext<HelpPanelContextValue | undefined>(undefined);
