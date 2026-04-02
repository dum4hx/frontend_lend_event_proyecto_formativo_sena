import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { loadHelpContent } from "./content/loadHelpContent";
import { resolveHelpModuleId } from "./moduleResolver";
import type { HelpModuleContent, HelpText } from "./types";
import { useLanguage } from "../../../contexts/useLanguage";
import { HelpPanelContext, type HelpPanelContextValue } from "./HelpPanelContextDefinition";

const HELP_SEEN_STORAGE_KEY = "lendevent_help_seen_modules";

function parseSeenModules(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(HELP_SEEN_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      const result: Record<string, boolean> = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === "boolean") {
          result[key] = value;
        }
      }
      return result;
    }
  } catch {
    /* ignore parse errors */
  }

  return {};
}

function saveSeenModules(value: Record<string, boolean>) {
  try {
    localStorage.setItem(HELP_SEEN_STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* ignore storage errors */
  }
}

export function HelpPanelProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [moduleContent, setModuleContent] = useState<HelpModuleContent | null>(null);
  const [seenModules, setSeenModules] = useState<Record<string, boolean>>(parseSeenModules);

  const moduleId = useMemo(() => resolveHelpModuleId(location.pathname), [location.pathname]);

  useEffect(() => {
    queueMicrotask(() => {
      setCurrentStepIndex(0);
      setModuleContent(null);
    });
  }, [moduleId]);

  useEffect(() => {
    if (!isOpen || !moduleId) {
      return;
    }

    let isMounted = true;
    queueMicrotask(() => {
      setIsLoading(true);
    });

    loadHelpContent(moduleId)
      .then((content) => {
        if (isMounted) {
          setModuleContent(content);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, moduleId]);

  useEffect(() => {
    saveSeenModules(seenModules);
  }, [seenModules]);

  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);
  const togglePanel = useCallback(() => setIsOpen((previous) => !previous), []);

  const maxStepIndex = moduleContent ? Math.max(moduleContent.walkthrough.length - 1, 0) : 0;

  const nextStep = useCallback(() => {
    setCurrentStepIndex((previous) => Math.min(previous + 1, maxStepIndex));
  }, [maxStepIndex]);

  const previousStep = useCallback(() => {
    setCurrentStepIndex((previous) => Math.max(previous - 1, 0));
  }, []);

  const finishWalkthrough = useCallback(() => {
    if (!moduleId) {
      setIsOpen(false);
      return;
    }

    setSeenModules((previous) => ({
      ...previous,
      [moduleId]: true,
    }));
    setCurrentStepIndex(0);
    setIsOpen(false);
  }, [moduleId]);

  const activeStep = moduleContent?.walkthrough[currentStepIndex] ?? null;

  useEffect(() => {
    if (!isOpen || !activeStep?.targetSelector || !activeStep.advanceOn) {
      return;
    }

    const matchingElements = document.querySelectorAll<HTMLElement>(activeStep.targetSelector);
    if (matchingElements.length === 0) {
      return;
    }

    const handleAdvance = () => {
      nextStep();
    };

    const eventName = activeStep.advanceOn.event;

    for (const element of matchingElements) {
      element.addEventListener(eventName, handleAdvance, { once: true });
    }

    return () => {
      for (const element of matchingElements) {
        element.removeEventListener(eventName, handleAdvance);
      }
    };
  }, [activeStep, isOpen, nextStep]);

  const resolveText = useCallback((text: HelpText) => {
    if (typeof text === "string") {
      return text;
    }

    return text[language];
  }, [language]);

  const hasSeenCurrentModule = moduleId ? Boolean(seenModules[moduleId]) : false;

  const contextValue = useMemo<HelpPanelContextValue>(
    () => ({
      isOpen,
      isLoading,
      moduleId,
      moduleContent,
      currentStepIndex,
      activeStep,
      hasSeenCurrentModule,
      openPanel,
      closePanel,
      togglePanel,
      nextStep,
      previousStep,
      finishWalkthrough,
      setCurrentStepIndex,
      resolveText,
    }),
    [
      activeStep,
      closePanel,
      currentStepIndex,
      finishWalkthrough,
      hasSeenCurrentModule,
      isLoading,
      isOpen,
      moduleContent,
      moduleId,
      nextStep,
      openPanel,
      previousStep,
      resolveText,
      togglePanel,
    ],
  );

  return <HelpPanelContext.Provider value={contextValue}>{children}</HelpPanelContext.Provider>;
}
