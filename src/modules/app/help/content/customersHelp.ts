import type { HelpModuleContent } from "../types";

const customerCreateFormGuide = {
  id: "customers-create-form",
  title: { es: "Formulario: Crear cliente", en: "Form: Create customer" },
  purpose: {
    es: "Registrar un cliente con datos de contacto y documento para procesos comerciales.",
    en: "Register a customer with contact and document data for commercial processes.",
  },
  mode: "create" as const,
  selector: '[data-help-id="customers-form-create"]',
  usageFlow: [
    {
      es: "Paso 1: completa nombres y apellidos principales.",
      en: "Step 1: complete main first and last names.",
    },
    {
      es: "Paso 2: ingresa correo, telefono y documento valido.",
      en: "Step 2: provide valid email, phone, and document data.",
    },
    {
      es: "Paso 3: agrega direccion si aplica y confirma creacion.",
      en: "Step 3: add address if needed and confirm creation.",
    },
  ],
  fields: [
    {
      id: "field-first-name",
      label: { es: "Primer nombre", en: "First name" },
      purpose: {
        es: "Nombre principal para identificar al cliente.",
        en: "Primary name used to identify the customer.",
      },
      dataType: { es: "Texto", en: "Text" },
      required: true,
      selector: '[data-help-id="customers-form-first-name"]',
    },
    {
      id: "field-last-name",
      label: { es: "Primer apellido", en: "Last name" },
      purpose: {
        es: "Apellido principal para coincidencia documental.",
        en: "Primary surname for document matching.",
      },
      dataType: { es: "Texto", en: "Text" },
      required: true,
      selector: '[data-help-id="customers-form-last-name"]',
    },
    {
      id: "field-email",
      label: { es: "Correo", en: "Email" },
      purpose: {
        es: "Canal para notificaciones de ordenes y facturacion.",
        en: "Channel for order and billing notifications.",
      },
      dataType: { es: "Email", en: "Email" },
      required: true,
      selector: '[data-help-id="customers-form-email"]',
    },
    {
      id: "field-phone",
      label: { es: "Telefono", en: "Phone" },
      purpose: {
        es: "Contacto directo para coordinacion operativa.",
        en: "Direct contact for operational coordination.",
      },
      dataType: { es: "Numerico", en: "Numeric" },
      required: true,
      selector: '[data-help-id="customers-form-phone"]',
    },
    {
      id: "field-document-type",
      label: { es: "Tipo de documento", en: "Document type" },
      purpose: {
        es: "Clasifica el documento de identidad presentado.",
        en: "Classifies the identity document provided.",
      },
      dataType: { es: "Seleccion", en: "Select" },
      required: true,
      selector: '[data-help-id="customers-form-document-type"]',
    },
    {
      id: "field-document-number",
      label: { es: "Numero de documento", en: "Document number" },
      purpose: {
        es: "Identificador unico del cliente.",
        en: "Unique customer identifier.",
      },
      dataType: { es: "Texto/Numerico", en: "Text/Numeric" },
      required: true,
      selector: '[data-help-id="customers-form-document-number"]',
    },
  ],
  actions: [
    {
      id: "action-create-customer",
      label: { es: "Crear cliente", en: "Create customer" },
      purpose: {
        es: "Guarda el cliente en la base operativa.",
        en: "Saves the customer in the operational database.",
      },
      consequence: {
        es: "El cliente queda disponible para pedidos y alquileres.",
        en: "The customer becomes available for orders and rentals.",
      },
      selector: '[data-help-id="customers-form-create"] button[type="submit"]',
    },
    {
      id: "action-cancel-customer",
      label: { es: "Cancelar", en: "Cancel" },
      purpose: {
        es: "Cerrar formulario sin crear cliente.",
        en: "Close form without creating the customer.",
      },
      consequence: {
        es: "Se descartan cambios pendientes.",
        en: "Pending changes are discarded.",
      },
      selector: '[data-help-id="customers-form-create"] button.btn-secondary',
    },
  ],
};

const customerEditFormGuide = {
  id: "customers-edit-form",
  title: { es: "Formulario: Editar cliente", en: "Form: Edit customer" },
  purpose: {
    es: "Actualizar datos de contacto y direccion manteniendo identidad documental.",
    en: "Update contact and address data while preserving document identity.",
  },
  mode: "edit" as const,
  selector: '[data-help-id="customers-form-edit"]',
  usageFlow: [
    {
      es: "Paso 1: verifica cliente y documento de referencia.",
      en: "Step 1: verify customer and reference document.",
    },
    {
      es: "Paso 2: actualiza contacto y direccion.",
      en: "Step 2: update contact and address.",
    },
    {
      es: "Paso 3: guarda cambios del cliente.",
      en: "Step 3: save customer changes.",
    },
  ],
  fields: customerCreateFormGuide.fields,
  actions: [
    {
      id: "action-edit-customer-save",
      label: { es: "Guardar cambios", en: "Save changes" },
      purpose: {
        es: "Persistir actualizacion del cliente.",
        en: "Persist customer update.",
      },
      consequence: {
        es: "El registro se actualiza en la tabla de clientes.",
        en: "Record is updated in customers table.",
      },
      selector: '[data-help-id="customers-form-edit"] button[type="submit"]',
    },
    {
      id: "action-edit-customer-cancel",
      label: { es: "Cancelar", en: "Cancel" },
      purpose: {
        es: "Cerrar edicion sin guardar.",
        en: "Close editing without saving.",
      },
      consequence: {
        es: "Se mantienen datos previos del cliente.",
        en: "Previous customer data remains.",
      },
      selector: '[data-help-id="customers-form-edit"] button.btn-secondary',
    },
  ],
};

const customersHelpContent: HelpModuleContent = {
  moduleId: "customers",
  title: {
    es: "Centro de ayuda: Clientes",
    en: "Help center: Customers",
  },
  description: {
    es: "Este modulo centraliza la gestion del ciclo de vida de clientes: alta, consulta, edicion, bloqueo y eliminacion.",
    en: "This module centralizes customer lifecycle management: create, view, edit, block, and delete.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Usa esta pantalla para mantener datos de clientes limpios y actualizados para operaciones comerciales y de alquiler.",
        en: "Use this screen to keep customer data clean and up-to-date for commerce and rental operations.",
      },
      tips: [
        {
          es: "Antes de crear un cliente nuevo, usa el buscador para evitar duplicados.",
          en: "Before creating a new customer, use search to avoid duplicates.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes filtrar por estado y tipo de documento, revisar el detalle, editar, activar/desactivar, bloquear y eliminar clientes.",
        en: "You can filter by status and document type, inspect details, edit, activate/deactivate, block, and delete customers.",
      },
      bestPractices: [
        {
          es: "Reserva la eliminacion permanente para casos realmente necesarios.",
          en: "Reserve permanent deletion for truly necessary cases.",
        },
      ],
    },
    {
      id: "examples",
      title: { es: "Ejemplo de flujo", en: "Flow example" },
      body: {
        es: "Flujo recomendado: filtra por estado, revisa detalle, corrige datos y luego activa o desactiva segun politica.",
        en: "Recommended flow: filter by status, inspect details, correct data, then activate or deactivate according to policy.",
      },
      warnings: [
        {
          es: "Bloquear un cliente impacta su uso en nuevos alquileres.",
          en: "Blocking a customer affects usage in new rentals.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Error frecuente: editar o eliminar sin revisar relaciones activas. Verifica operaciones vigentes antes de acciones destructivas.",
        en: "Common mistake: editing or deleting without checking active relations. Validate ongoing operations before destructive actions.",
      },
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Contexto del modulo", en: "1) Module context" },
      body: {
        es: "Este encabezado describe el objetivo del modulo de clientes.",
        en: "This header describes the objective of the customers module.",
      },
      targetSelector: '[data-help-id="customers-title"]',
    },
    {
      id: "step-2-stats",
      title: { es: "2) Resumen rapido", en: "2) Quick summary" },
      body: {
        es: "Estas tarjetas muestran el total y la distribucion por estado para priorizar acciones.",
        en: "These cards show total count and status distribution to prioritize actions.",
      },
      targetSelector: '[data-help-id="customers-stat-cards"]',
      tip: {
        es: "Un aumento de bloqueados puede indicar problemas de cartera o cumplimiento.",
        en: "An increase in blocked customers can indicate portfolio or compliance issues.",
      },
    },
    {
      id: "step-3-filters",
      title: { es: "3) Filtra y crea", en: "3) Filter and create" },
      body: {
        es: "Usa filtros para encontrar clientes y crea nuevos registros cuando sea necesario.",
        en: "Use filters to find customers and create new records when needed.",
      },
      targetSelector: '[data-help-id="customers-filters"]',
    },
    {
      id: "step-4-table",
      title: { es: "4) Opera sobre resultados", en: "4) Operate on results" },
      body: {
        es: "Desde la tabla puedes ver detalle, editar y ejecutar acciones de estado o eliminacion.",
        en: "From the table you can view details, edit, and execute status or deletion actions.",
      },
      targetSelector: '[data-help-id="customers-table"]',
      warning: {
        es: "Confirma bien antes de eliminar permanentemente.",
        en: "Double-check before permanently deleting.",
      },
    },
    {
      id: "step-5-pagination",
      title: { es: "5) Navega paginas", en: "5) Navigate pages" },
      body: {
        es: "Cuando hay mas resultados, usa la paginacion para revisar todo el universo de clientes.",
        en: "When there are more results, use pagination to review the full customer set.",
      },
      targetSelector: '[data-help-id="customers-pagination"]',
    },
  ],
  formGuides: [customerCreateFormGuide, customerEditFormGuide],
};

export default customersHelpContent;
