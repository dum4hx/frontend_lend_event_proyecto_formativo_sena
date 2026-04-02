import type {
  HelpFormActionGuide,
  HelpFormFieldGuide,
  HelpFormGuide,
  HelpText,
} from "./types";

interface CrudFormTemplateInput {
  baseId: string;
  title: {
    create: HelpText;
    edit: HelpText;
  };
  purpose: {
    create: HelpText;
    edit: HelpText;
  };
  selector: {
    create: string;
    edit: string;
  };
  usageFlow?: {
    create?: HelpText[];
    edit?: HelpText[];
  };
  fields: HelpFormFieldGuide[];
  actions: {
    create: HelpFormActionGuide[];
    edit: HelpFormActionGuide[];
  };
}

const DEFAULT_CREATE_FLOW: HelpText[] = [
  {
    es: "Paso 1: completa los campos obligatorios.",
    en: "Step 1: complete required fields.",
  },
  {
    es: "Paso 2: valida formato y datos clave.",
    en: "Step 2: validate format and key values.",
  },
  {
    es: "Paso 3: guarda o cancela el formulario.",
    en: "Step 3: save or cancel the form.",
  },
];

const DEFAULT_EDIT_FLOW: HelpText[] = [
  {
    es: "Paso 1: revisa datos actuales del registro.",
    en: "Step 1: review current record data.",
  },
  {
    es: "Paso 2: ajusta campos permitidos y valida cambios.",
    en: "Step 2: update allowed fields and validate changes.",
  },
  {
    es: "Paso 3: guarda cambios o cancela la edicion.",
    en: "Step 3: save changes or cancel editing.",
  },
];

export function createCrudFormGuides(input: CrudFormTemplateInput): HelpFormGuide[] {
  return [
    {
      id: `${input.baseId}-create`,
      title: input.title.create,
      purpose: input.purpose.create,
      mode: "create",
      selector: input.selector.create,
      usageFlow: input.usageFlow?.create ?? DEFAULT_CREATE_FLOW,
      fields: input.fields,
      actions: input.actions.create,
    },
    {
      id: `${input.baseId}-edit`,
      title: input.title.edit,
      purpose: input.purpose.edit,
      mode: "edit",
      selector: input.selector.edit,
      usageFlow: input.usageFlow?.edit ?? DEFAULT_EDIT_FLOW,
      fields: input.fields,
      actions: input.actions.edit,
    },
  ];
}
