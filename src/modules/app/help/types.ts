export type HelpLanguage = "en" | "es";

export interface HelpLocalizedText {
  en: string;
  es: string;
}

export type HelpText = string | HelpLocalizedText;

export interface HelpContentSection {
  id: string;
  title: HelpText;
  body: HelpText;
  tips?: HelpText[];
  warnings?: HelpText[];
  bestPractices?: HelpText[];
}

export interface HelpAdvanceOn {
  event: "click";
}

export interface HelpWalkthroughStep {
  id: string;
  title: HelpText;
  body: HelpText;
  targetSelector?: string;
  tip?: HelpText;
  warning?: HelpText;
  bestPractice?: HelpText;
  advanceOn?: HelpAdvanceOn;
}

export type HelpFormMode = "create" | "edit" | "both";

export interface HelpFormFieldGuide {
  id: string;
  label: HelpText;
  purpose: HelpText;
  dataType: HelpText;
  required?: boolean;
  validations?: HelpText[];
  example?: HelpText;
  selector?: string;
}

export interface HelpFormActionGuide {
  id: string;
  label: HelpText;
  purpose: HelpText;
  consequence: HelpText;
  selector?: string;
}

export interface HelpFormGuide {
  id: string;
  title: HelpText;
  purpose: HelpText;
  mode: HelpFormMode;
  selector?: string;
  usageFlow: HelpText[];
  fields: HelpFormFieldGuide[];
  actions: HelpFormActionGuide[];
}

export interface HelpModuleContent {
  moduleId: string;
  title: HelpText;
  description: HelpText;
  sections: HelpContentSection[];
  walkthrough: HelpWalkthroughStep[];
  formGuides?: HelpFormGuide[];
}

export interface HelpModuleDefinition {
  moduleId: string;
  routePrefixes: string[];
}
