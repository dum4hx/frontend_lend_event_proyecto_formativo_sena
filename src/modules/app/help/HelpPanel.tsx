import { useEffect, useMemo, useState } from "react";
import {
  BookOpenText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  Flag,
  ListChecks,
  Lightbulb,
  TriangleAlert,
  X,
} from "lucide-react";
import { useHelpPanel } from "./useHelpPanel";
import type {
  HelpContentSection,
  HelpFormFieldGuide,
  HelpFormGuide,
  HelpLocalizedText,
} from "./types";

const PANEL_LABELS: Record<string, HelpLocalizedText> = {
  header: { en: "Interactive Help", es: "Ayuda interactiva" },
  fallbackTitle: { en: "Contextual Guide", es: "Guía contextual" },
  loading: { en: "Loading help content...", es: "Cargando contenido de ayuda..." },
  noContent: {
    en: "This module does not have help content yet. Add a new module configuration to scale coverage.",
    es: "Este módulo aún no tiene contenido de ayuda. Agrega una configuración de módulo para ampliar la cobertura.",
  },
  overview: { en: "Overview", es: "Resumen" },
  seenBefore: {
    en: "You have already completed this guide before.",
    es: "Ya completaste esta guía antes.",
  },
  notSeenYet: {
    en: "You have not completed this guide yet.",
    es: "Aún no has completado esta guía.",
  },
  howTo: { en: "How to", es: "Cómo hacerlo" },
  formAssistant: { en: "Form Assistant", es: "Asistente de formulario" },
  formAssistantHint: {
    en: "Focus any input inside highlighted forms to get contextual field help.",
    es: "Enfoca cualquier campo dentro de los formularios resaltados para obtener ayuda contextual.",
  },
  usageFlow: { en: "Usage flow", es: "Flujo de uso" },
  fields: { en: "Fields", es: "Campos" },
  actions: { en: "Actions", es: "Acciones" },
  typeLabel: { en: "Type:", es: "Tipo:" },
  required: { en: "Required", es: "Requerido" },
  validation: { en: "Validation:", es: "Validación:" },
  exampleLabel: { en: "Example:", es: "Ejemplo:" },
  dataType: { en: "Data type:", es: "Tipo de dato:" },
  requiredField: { en: "Required field", es: "Campo requerido" },
  tipLabel: { en: "Tip:", es: "Consejo:" },
  warningLabel: { en: "Warning:", es: "Advertencia:" },
  bestPracticeLabel: { en: "Best practice:", es: "Buena práctica:" },
  advanceHint: {
    en: "This step can advance when you click the highlighted area.",
    es: "Este paso avanza cuando haces clic en el área resaltada.",
  },
  noSteps: { en: "No walkthrough steps configured.", es: "No hay pasos de guía configurados." },
  walkthrough: { en: "Walkthrough", es: "Guía paso a paso" },
  previous: { en: "Previous", es: "Anterior" },
  next: { en: "Next", es: "Siguiente" },
  finish: { en: "Finish", es: "Finalizar" },
  helpButton: { en: "Help", es: "Ayuda" },
};

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
  const [openSectionIds, setOpenSectionIds] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    setOpenSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const targetRect = useTargetRect(activeStep?.targetSelector, isOpen);

  const tooltipPosition = useMemo(() => {
    if (!targetRect) {
      return null;
    }

    const tooltipTop = Math.min(
      window.innerHeight - 190,
      Math.max(12, targetRect.top + targetRect.height + 10),
    );
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
      queueMicrotask(() => setActiveFieldTooltip(null));
      return;
    }

    const formGuides = moduleContent?.formGuides;
    if (!formGuides || formGuides.length === 0) {
      queueMicrotask(() => setActiveFieldTooltip(null));
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
          <span className="hidden sm:inline">{resolveText(PANEL_LABELS.helpButton)}</span>
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
            {resolveText(activeFieldTooltip.form.title)} ·{" "}
            {resolveText(activeFieldTooltip.field.label)}
          </p>
          <p className="mt-1 text-zinc-300">{resolveText(activeFieldTooltip.field.purpose)}</p>
          <p className="mt-1 text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300">
              {resolveText(PANEL_LABELS.dataType)}
            </span>{" "}
            {resolveText(activeFieldTooltip.field.dataType)}
          </p>
          {activeFieldTooltip.field.required && (
            <p className="mt-1 text-xs text-amber-300">{resolveText(PANEL_LABELS.requiredField)}</p>
          )}
          {activeFieldTooltip.field.example && (
            <p className="mt-1 text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300">
                {resolveText(PANEL_LABELS.exampleLabel)}
              </span>{" "}
              {resolveText(activeFieldTooltip.field.example)}
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
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">
              {resolveText(PANEL_LABELS.header)}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[#FFD700]">
              {moduleContent
                ? resolveText(moduleContent.title)
                : resolveText(PANEL_LABELS.fallbackTitle)}
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
          {isLoading && (
            <p className="text-sm text-zinc-400">{resolveText(PANEL_LABELS.loading)}</p>
          )}

          {!isLoading && !moduleContent && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-sm text-zinc-300">{resolveText(PANEL_LABELS.noContent)}</p>
            </div>
          )}

          {!isLoading && moduleContent && (
            <div className="space-y-6">
              <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="flex items-center gap-2 text-[#FFD700]">
                  <BookOpenText size={16} />
                  <p className="text-sm font-semibold">{resolveText(PANEL_LABELS.overview)}</p>
                </div>
                <p className="mt-2 text-sm text-zinc-300">
                  {resolveText(moduleContent.description)}
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  {resolveText(
                    hasSeenCurrentModule ? PANEL_LABELS.seenBefore : PANEL_LABELS.notSeenYet,
                  )}
                </p>
              </section>

              <section className="space-y-2">
                {moduleContent.sections.map((section: HelpContentSection) => {
                  const isExpanded = openSectionIds.has(section.id);
                  const hasExtra =
                    (section.tips && section.tips.length > 0) ||
                    (section.warnings && section.warnings.length > 0) ||
                    (section.bestPractices && section.bestPractices.length > 0) ||
                    (section.howTo && section.howTo.length > 0);

                  return (
                    <article
                      key={section.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-zinc-800/50"
                        aria-expanded={isExpanded}
                      >
                        <span className="text-sm font-semibold text-white">
                          {resolveText(section.title)}
                        </span>
                        {hasExtra ? (
                          isExpanded ? (
                            <ChevronUp size={14} className="shrink-0 text-zinc-400" />
                          ) : (
                            <ChevronDown size={14} className="shrink-0 text-zinc-400" />
                          )
                        ) : null}
                      </button>

                      <div className="px-4 pb-3">
                        <p className="text-sm text-zinc-300">{resolveText(section.body)}</p>

                        {isExpanded && (
                          <div className="mt-3 space-y-3">
                            {section.howTo && section.howTo.length > 0 && (
                              <div>
                                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#FFD700]">
                                  <ListChecks size={13} />
                                  {resolveText(PANEL_LABELS.howTo)}
                                </p>
                                <ol className="space-y-1.5 pl-1">
                                  {section.howTo.map((step, index) => (
                                    <li
                                      key={`${section.id}-howto-${index}`}
                                      className="flex items-start gap-2 text-xs text-zinc-300"
                                    >
                                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#FFD700]/50 text-[10px] font-bold text-[#FFD700]">
                                        {index + 1}
                                      </span>
                                      <span>{resolveText(step)}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}

                            {section.tips && section.tips.length > 0 && (
                              <div className="space-y-1">
                                {section.tips.map((item, index) => (
                                  <p
                                    key={`${section.id}-tip-${index}`}
                                    className="flex items-start gap-2 text-xs text-zinc-300"
                                  >
                                    <Lightbulb
                                      size={13}
                                      className="mt-0.5 shrink-0 text-[#FFD700]"
                                    />
                                    <span>{resolveText(item)}</span>
                                  </p>
                                ))}
                              </div>
                            )}

                            {section.warnings && section.warnings.length > 0 && (
                              <div className="space-y-1">
                                {section.warnings.map((item, index) => (
                                  <p
                                    key={`${section.id}-warn-${index}`}
                                    className="flex items-start gap-2 text-xs text-zinc-300"
                                  >
                                    <TriangleAlert
                                      size={13}
                                      className="mt-0.5 shrink-0 text-red-400"
                                    />
                                    <span>{resolveText(item)}</span>
                                  </p>
                                ))}
                              </div>
                            )}

                            {section.bestPractices && section.bestPractices.length > 0 && (
                              <div className="space-y-1">
                                {section.bestPractices.map((item, index) => (
                                  <p
                                    key={`${section.id}-practice-${index}`}
                                    className="flex items-start gap-2 text-xs text-zinc-300"
                                  >
                                    <Flag size={13} className="mt-0.5 shrink-0 text-emerald-400" />
                                    <span>{resolveText(item)}</span>
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </section>

              {moduleContent.formGuides && moduleContent.formGuides.length > 0 && (
                <section className="space-y-3">
                  <article className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                    <h3 className="text-sm font-semibold text-white">
                      {resolveText(PANEL_LABELS.formAssistant)}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-400">
                      {resolveText(PANEL_LABELS.formAssistantHint)}
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
                          <h3 className="text-sm font-semibold text-white">
                            {resolveText(formGuide.title)}
                          </h3>
                          <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                            {formGuide.mode}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-300">
                          {resolveText(formGuide.purpose)}
                        </p>

                        {(formGuide.usageFlow?.length ?? 0) > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                              {resolveText(PANEL_LABELS.usageFlow)}
                            </p>
                            <div className="mt-2 space-y-1">
                              {(formGuide.usageFlow ?? []).map((step, index) => (
                                <p
                                  key={`${formGuide.id}-flow-${index}`}
                                  className="text-xs text-zinc-300"
                                >
                                  {resolveText(step)}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                            {resolveText(PANEL_LABELS.fields)}
                          </p>
                          <div className="mt-2 space-y-2">
                            {formGuide.fields.map((field) => (
                              <div
                                key={field.id}
                                className="rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-2"
                              >
                                <p className="text-xs font-semibold text-zinc-200">
                                  {resolveText(field.label)}
                                </p>
                                <p className="mt-1 text-xs text-zinc-400">
                                  {resolveText(field.purpose)}
                                </p>
                                <p className="mt-1 text-[11px] text-zinc-500">
                                  {resolveText(PANEL_LABELS.typeLabel)}{" "}
                                  {resolveText(field.dataType)}
                                  {field.required ? ` · ${resolveText(PANEL_LABELS.required)}` : ""}
                                </p>
                                {field.validations && field.validations.length > 0 && (
                                  <p className="mt-1 text-[11px] text-zinc-500">
                                    {resolveText(PANEL_LABELS.validation)}{" "}
                                    {field.validations.map((v) => resolveText(v)).join(" | ")}
                                  </p>
                                )}
                                {field.example && (
                                  <p className="mt-1 text-[11px] text-zinc-500">
                                    {resolveText(PANEL_LABELS.exampleLabel)}{" "}
                                    {resolveText(field.example)}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                            {resolveText(PANEL_LABELS.actions)}
                          </p>
                          <div className="mt-2 space-y-1">
                            {formGuide.actions.map((action) => (
                              <p key={action.id} className="text-xs text-zinc-300">
                                <span className="font-semibold text-zinc-100">
                                  {resolveText(action.label)}:
                                </span>{" "}
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
                  <h3 className="text-sm font-semibold text-white">
                    {resolveText(PANEL_LABELS.walkthrough)}
                  </h3>
                  <span className="text-xs text-zinc-400">
                    {stepCount === 0 ? "0/0" : `${currentStepIndex + 1}/${stepCount}`}
                  </span>
                </div>

                {activeStep ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-[#FFD700]">
                      {resolveText(activeStep.title)}
                    </p>
                    <p className="text-sm text-zinc-300">{resolveText(activeStep.body)}</p>

                    {activeStep.tip && (
                      <p className="text-xs text-zinc-300">
                        <span className="font-semibold text-[#FFD700]">
                          {resolveText(PANEL_LABELS.tipLabel)}
                        </span>{" "}
                        {resolveText(activeStep.tip)}
                      </p>
                    )}

                    {activeStep.warning && (
                      <p className="text-xs text-zinc-300">
                        <span className="font-semibold text-red-400">
                          {resolveText(PANEL_LABELS.warningLabel)}
                        </span>{" "}
                        {resolveText(activeStep.warning)}
                      </p>
                    )}

                    {activeStep.bestPractice && (
                      <p className="text-xs text-zinc-300">
                        <span className="font-semibold text-emerald-400">
                          {resolveText(PANEL_LABELS.bestPracticeLabel)}
                        </span>{" "}
                        {resolveText(activeStep.bestPractice)}
                      </p>
                    )}

                    {activeStep.advanceOn && (
                      <p className="rounded-md border border-[#FFD700]/40 bg-[#FFD700]/10 px-2 py-1 text-xs text-[#FFD700]">
                        {resolveText(PANEL_LABELS.advanceHint)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-zinc-400">{resolveText(PANEL_LABELS.noSteps)}</p>
                )}

                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={previousStep}
                    disabled={isFirstStep || stepCount === 0}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                    {resolveText(PANEL_LABELS.previous)}
                  </button>

                  {!isLastStep ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={stepCount === 0}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#FFD700]/70 bg-[#121212] px-3 py-2 text-xs font-semibold text-[#FFD700] transition hover:bg-[#1b1b1b] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {resolveText(PANEL_LABELS.next)}
                      <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={finishWalkthrough}
                      className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
                    >
                      {resolveText(PANEL_LABELS.finish)}
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
