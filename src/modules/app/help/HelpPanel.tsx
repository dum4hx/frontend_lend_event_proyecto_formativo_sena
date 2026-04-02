import { useEffect, useMemo, useState } from "react";
import { BookOpenText, ChevronLeft, ChevronRight, CircleHelp, Flag, Lightbulb, TriangleAlert, X } from "lucide-react";
import { useHelpPanel } from "./useHelpPanel";
import type { HelpFormFieldGuide, HelpFormGuide } from "./types";

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface ActiveFieldTooltip {
  form: HelpFormGuide;
  field: HelpFormFieldGuide;
  top: number;
  left: number;
}

function elementIsVisible(selector: string | undefined): boolean {
  if (!selector) {
    return false;
  }

  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function useTargetRect(selector: string | undefined, enabled: boolean): TargetRect | null {
  const [rect, setRect] = useState<TargetRect | null>(null);

  useEffect(() => {
    if (!enabled || !selector) {
      queueMicrotask(() => {
        setRect(null);
      });
      return;
    }

    const updateRect = () => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) {
        setRect(null);
        return;
      }

      const elementRect = element.getBoundingClientRect();
      setRect({
        top: elementRect.top,
        left: elementRect.left,
        width: elementRect.width,
        height: elementRect.height,
      });
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    const intervalId = window.setInterval(updateRect, 300);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
      window.clearInterval(intervalId);
    };
  }, [enabled, selector]);

  return rect;
}

export function HelpPanel() {
  const {
    isOpen,
    isLoading,
    moduleContent,
    activeStep,
    currentStepIndex,
    hasSeenCurrentModule,
    togglePanel,
    closePanel,
    nextStep,
    previousStep,
    finishWalkthrough,
    resolveText,
  } = useHelpPanel();

  const stepCount = moduleContent?.walkthrough.length ?? 0;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = stepCount === 0 || currentStepIndex >= stepCount - 1;
  const [activeFieldTooltip, setActiveFieldTooltip] = useState<ActiveFieldTooltip | null>(null);

  const targetRect = useTargetRect(activeStep?.targetSelector, isOpen);

  const tooltipPosition = useMemo(() => {
    if (!targetRect) {
      return null;
    }

    const tooltipTop = Math.min(window.innerHeight - 190, Math.max(12, targetRect.top + targetRect.height + 10));
    const tooltipLeft = Math.min(window.innerWidth - 360, Math.max(12, targetRect.left));

    return {
      top: tooltipTop,
      left: tooltipLeft,
    };
  }, [targetRect]);

  const activeFormGuide = useMemo(() => {
    const formGuides = moduleContent?.formGuides;
    if (!formGuides || formGuides.length === 0) {
      return null;
    }

    return formGuides.find((guide) => elementIsVisible(guide.selector)) ?? formGuides[0];
  }, [moduleContent?.formGuides]);

  useEffect(() => {
    if (!isOpen) {
      setActiveFieldTooltip(null);
      return;
    }

    const formGuides = moduleContent?.formGuides;
    if (!formGuides || formGuides.length === 0) {
      setActiveFieldTooltip(null);
      return;
    }

    const focusHandler = (event: FocusEvent) => {
      const focused = event.target as HTMLElement | null;
      if (!focused) {
        return;
      }

      for (const formGuide of formGuides) {
        for (const fieldGuide of formGuide.fields) {
          if (!fieldGuide.selector) {
            continue;
          }

          const matched = focused.closest(fieldGuide.selector);
          if (!matched) {
            continue;
          }

          const rect = matched.getBoundingClientRect();
          const top = Math.min(window.innerHeight - 220, Math.max(12, rect.top + rect.height + 8));
          const left = Math.min(window.innerWidth - 360, Math.max(12, rect.left));

          setActiveFieldTooltip({
            form: formGuide,
            field: fieldGuide,
            top,
            left,
          });
          return;
        }
      }
    };

    const blurHandler = () => {
      window.setTimeout(() => {
        const activeElement = document.activeElement as HTMLElement | null;
        if (!activeElement) {
          setActiveFieldTooltip(null);
          return;
        }

        for (const formGuide of formGuides) {
          for (const fieldGuide of formGuide.fields) {
            if (!fieldGuide.selector) {
              continue;
            }

            if (activeElement.closest(fieldGuide.selector)) {
              return;
            }
          }
        }

        setActiveFieldTooltip(null);
      }, 0);
    };

    document.addEventListener("focusin", focusHandler);
    document.addEventListener("focusout", blurHandler);

    return () => {
      document.removeEventListener("focusin", focusHandler);
      document.removeEventListener("focusout", blurHandler);
    };
  }, [isOpen, moduleContent?.formGuides]);

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={togglePanel}
          className="fixed bottom-6 right-6 z-[70] inline-flex items-center gap-2 rounded-full border border-[#FFD700]/70 bg-[#121212] px-4 py-2 text-sm font-semibold text-[#FFD700] shadow-lg shadow-black/40 transition hover:-translate-y-0.5 hover:bg-[#1a1a1a]"
          aria-label="Toggle contextual help panel"
        >
          <CircleHelp size={18} />
          <span className="hidden sm:inline">Help</span>
        </button>
      )}

      {isOpen && (
        <button
          type="button"
          aria-label="Close help panel"
          className="fixed inset-0 z-[58] bg-black/25"
          onClick={closePanel}
        />
      )}

      {isOpen && targetRect && (
        <div
          className="pointer-events-none fixed z-[60] rounded-xl border-2 border-[#FFD700] bg-[#FFD700]/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        />
      )}

      {isOpen && activeStep && tooltipPosition && (
        <div
          className="fixed z-[61] max-w-xs rounded-xl border border-[#FFD700]/60 bg-[#0e0e0e] p-3 text-sm text-zinc-100 shadow-xl"
          style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
          role="status"
          aria-live="polite"
        >
          <p className="font-semibold text-[#FFD700]">{resolveText(activeStep.title)}</p>
          <p className="mt-1 text-zinc-300">{resolveText(activeStep.body)}</p>
        </div>
      )}

      {isOpen && activeFieldTooltip && (
        <div
          className="fixed z-[62] max-w-sm rounded-xl border border-[#FFD700]/60 bg-[#0e0e0e] p-3 text-sm text-zinc-100 shadow-xl"
          style={{ top: activeFieldTooltip.top, left: activeFieldTooltip.left }}
          role="status"
          aria-live="polite"
        >
          <p className="font-semibold text-[#FFD700]">
            {resolveText(activeFieldTooltip.form.title)} · {resolveText(activeFieldTooltip.field.label)}
          </p>
          <p className="mt-1 text-zinc-300">{resolveText(activeFieldTooltip.field.purpose)}</p>
          <p className="mt-1 text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300">Data type:</span> {resolveText(activeFieldTooltip.field.dataType)}
          </p>
          {activeFieldTooltip.field.required && (
            <p className="mt-1 text-xs text-amber-300">Required field</p>
          )}
          {activeFieldTooltip.field.example && (
            <p className="mt-1 text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300">Example:</span> {resolveText(activeFieldTooltip.field.example)}
            </p>
          )}
        </div>
      )}

      <aside
        className={`fixed right-0 top-0 z-[65] h-screen w-full max-w-md border-l border-zinc-700/70 bg-[#101010] text-white shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <header className="flex items-start justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Interactive Help</p>
            <h2 className="mt-1 text-lg font-semibold text-[#FFD700]">
              {moduleContent ? resolveText(moduleContent.title) : "Contextual Guide"}
            </h2>
          </div>
          <button
            type="button"
            onClick={closePanel}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            aria-label="Close help panel"
          >
            <X size={18} />
          </button>
        </header>

        <div className="h-[calc(100%-75px)] overflow-y-auto px-5 py-4">
          {isLoading && <p className="text-sm text-zinc-400">Loading help content...</p>}

          {!isLoading && !moduleContent && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-sm text-zinc-300">
                This module does not have help content yet. Add a new module configuration to scale coverage.
              </p>
            </div>
          )}

          {!isLoading && moduleContent && (
            <div className="space-y-6">
              <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="flex items-center gap-2 text-[#FFD700]">
                  <BookOpenText size={16} />
                  <p className="text-sm font-semibold">Overview</p>
                </div>
                <p className="mt-2 text-sm text-zinc-300">{resolveText(moduleContent.description)}</p>
                <p className="mt-2 text-xs text-zinc-400">
                  {hasSeenCurrentModule
                    ? "You have already completed this guide before."
                    : "You have not completed this guide yet."}
                </p>
              </section>

              <section className="space-y-3">
                {moduleContent.sections.map((section) => (
                  <article key={section.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                    <h3 className="text-sm font-semibold text-white">{resolveText(section.title)}</h3>
                    <p className="mt-1 text-sm text-zinc-300">{resolveText(section.body)}</p>

                    {section.tips?.map((item, index) => (
                      <p key={`${section.id}-tip-${index}`} className="mt-2 flex items-start gap-2 text-xs text-zinc-300">
                        <Lightbulb size={14} className="mt-0.5 text-[#FFD700]" />
                        <span>{resolveText(item)}</span>
                      </p>
                    ))}

                    {section.warnings?.map((item, index) => (
                      <p key={`${section.id}-warn-${index}`} className="mt-2 flex items-start gap-2 text-xs text-zinc-300">
                        <TriangleAlert size={14} className="mt-0.5 text-red-400" />
                        <span>{resolveText(item)}</span>
                      </p>
                    ))}

                    {section.bestPractices?.map((item, index) => (
                      <p key={`${section.id}-practice-${index}`} className="mt-2 flex items-start gap-2 text-xs text-zinc-300">
                        <Flag size={14} className="mt-0.5 text-emerald-400" />
                        <span>{resolveText(item)}</span>
                      </p>
                    ))}
                  </article>
                ))}
              </section>

              {moduleContent.formGuides && moduleContent.formGuides.length > 0 && (
                <section className="space-y-3">
                  <article className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                    <h3 className="text-sm font-semibold text-white">Form Assistant</h3>
                    <p className="mt-1 text-xs text-zinc-400">
                      Focus any input inside highlighted forms to get contextual field help.
                    </p>
                  </article>

                  {moduleContent.formGuides.map((formGuide) => {
                    const isActive = activeFormGuide?.id === formGuide.id;

                    return (
                      <article
                        key={formGuide.id}
                        className={`rounded-xl border p-4 ${
                          isActive
                            ? "border-[#FFD700]/50 bg-[#FFD700]/5"
                            : "border-zinc-800 bg-zinc-900/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-white">{resolveText(formGuide.title)}</h3>
                          <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                            {formGuide.mode}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-300">{resolveText(formGuide.purpose)}</p>

                        <div className="mt-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Usage flow</p>
                          <div className="mt-2 space-y-1">
                            {formGuide.usageFlow.map((step, index) => (
                              <p key={`${formGuide.id}-flow-${index}`} className="text-xs text-zinc-300">
                                {resolveText(step)}
                              </p>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Fields</p>
                          <div className="mt-2 space-y-2">
                            {formGuide.fields.map((field) => (
                              <div key={field.id} className="rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-2">
                                <p className="text-xs font-semibold text-zinc-200">{resolveText(field.label)}</p>
                                <p className="mt-1 text-xs text-zinc-400">{resolveText(field.purpose)}</p>
                                <p className="mt-1 text-[11px] text-zinc-500">
                                  Type: {resolveText(field.dataType)}
                                  {field.required ? " · Required" : ""}
                                </p>
                                {field.validations && field.validations.length > 0 && (
                                  <p className="mt-1 text-[11px] text-zinc-500">
                                    Validation: {field.validations.map((v) => resolveText(v)).join(" | ")}
                                  </p>
                                )}
                                {field.example && (
                                  <p className="mt-1 text-[11px] text-zinc-500">
                                    Example: {resolveText(field.example)}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Actions</p>
                          <div className="mt-2 space-y-1">
                            {formGuide.actions.map((action) => (
                              <p key={action.id} className="text-xs text-zinc-300">
                                <span className="font-semibold text-zinc-100">{resolveText(action.label)}:</span>{" "}
                                {resolveText(action.purpose)} {resolveText(action.consequence)}
                              </p>
                            ))}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </section>
              )}

              <section className="rounded-xl border border-zinc-800 bg-[#0d0d0d] p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Walkthrough</h3>
                  <span className="text-xs text-zinc-400">
                    {stepCount === 0 ? "0/0" : `${currentStepIndex + 1}/${stepCount}`}
                  </span>
                </div>

                {activeStep ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-[#FFD700]">{resolveText(activeStep.title)}</p>
                    <p className="text-sm text-zinc-300">{resolveText(activeStep.body)}</p>

                    {activeStep.tip && (
                      <p className="text-xs text-zinc-300">
                        <span className="font-semibold text-[#FFD700]">Tip:</span> {resolveText(activeStep.tip)}
                      </p>
                    )}

                    {activeStep.warning && (
                      <p className="text-xs text-zinc-300">
                        <span className="font-semibold text-red-400">Warning:</span> {resolveText(activeStep.warning)}
                      </p>
                    )}

                    {activeStep.bestPractice && (
                      <p className="text-xs text-zinc-300">
                        <span className="font-semibold text-emerald-400">Best practice:</span> {resolveText(activeStep.bestPractice)}
                      </p>
                    )}

                    {activeStep.advanceOn && (
                      <p className="rounded-md border border-[#FFD700]/40 bg-[#FFD700]/10 px-2 py-1 text-xs text-[#FFD700]">
                        This step can advance when you click the highlighted area.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-zinc-400">No walkthrough steps configured.</p>
                )}

                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={previousStep}
                    disabled={isFirstStep || stepCount === 0}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                    Previous
                  </button>

                  {!isLastStep ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={stepCount === 0}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#FFD700]/70 bg-[#121212] px-3 py-2 text-xs font-semibold text-[#FFD700] transition hover:bg-[#1b1b1b] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={finishWalkthrough}
                      className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
                    >
                      Finish
                    </button>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
