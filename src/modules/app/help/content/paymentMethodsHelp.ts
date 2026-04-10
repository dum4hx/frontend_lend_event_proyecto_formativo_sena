import type { HelpModuleContent } from "../types";
import { createCrudFormGuides } from "../formGuideTemplates";

const paymentMethodCrudFormGuides = createCrudFormGuides({
  baseId: "payment-method",
  title: {
    create: {
      es: "Formulario: Crear metodo de pago",
      en: "Form: Create payment method",
    },
    edit: {
      es: "Formulario: Editar metodo de pago",
      en: "Form: Edit payment method",
    },
  },
  purpose: {
    create: {
      es: "Registrar un nuevo metodo de pago disponible para la organizacion.",
      en: "Register a new payment method available to the organization.",
    },
    edit: {
      es: "Actualizar datos y estado de un metodo de pago existente.",
      en: "Update data and status of an existing payment method.",
    },
  },
  selector: {
    create: '[data-help-id="payment-method-form-create"]',
    edit: '[data-help-id="payment-method-form-edit"]',
  },
  fields: [
    {
      id: "field-name",
      label: { es: "Nombre", en: "Name" },
      purpose: {
        es: "Define el nombre visible del metodo de pago para operadores y administradores.",
        en: "Defines the visible payment method name for operators and administrators.",
      },
      dataType: { es: "Texto", en: "Text" },
      required: true,
      validations: [
        { es: "Obligatorio", en: "Required" },
        { es: "Longitud maxima: 100 caracteres", en: "Max length: 100 characters" },
      ],
      example: { es: "Transferencia bancaria", en: "Bank transfer" },
      selector: '[data-help-id="payment-method-form-name"]',
    },
    {
      id: "field-description",
      label: { es: "Descripcion", en: "Description" },
      purpose: {
        es: "Aporta contexto adicional sobre uso o restricciones del metodo.",
        en: "Provides extra context about usage or constraints of the method.",
      },
      dataType: { es: "Texto multilinea", en: "Multiline text" },
      validations: [{ es: "Opcional", en: "Optional" }],
      example: {
        es: "Usar para pagos corporativos con comprobante.",
        en: "Use for corporate payments with receipt.",
      },
      selector: '[data-help-id="payment-method-form-description"]',
    },
    {
      id: "field-status",
      label: { es: "Estado", en: "Status" },
      purpose: {
        es: "Activa o desactiva disponibilidad del metodo para nuevas operaciones.",
        en: "Enables or disables method availability for new operations.",
      },
      dataType: { es: "Interruptor booleano", en: "Boolean toggle" },
      validations: [{ es: "Solo visible en edicion", en: "Visible in edit mode only" }],
      selector: '[data-help-id="payment-method-form-status"]',
    },
  ],
  actions: {
    create: [
      {
        id: "action-create-save",
        label: { es: "Crear Metodo", en: "Create Method" },
        purpose: {
          es: "Guarda el nuevo metodo con la informacion ingresada.",
          en: "Saves the new method with entered data.",
        },
        consequence: {
          es: "El registro queda disponible en el catalogo al actualizar la lista.",
          en: "The record becomes available in the catalog after list refresh.",
        },
        selector: '[data-help-id="payment-method-form-submit"]',
      },
      {
        id: "action-create-cancel",
        label: { es: "Cancelar", en: "Cancel" },
        purpose: {
          es: "Cierra el formulario sin guardar cambios.",
          en: "Closes the form without saving changes.",
        },
        consequence: {
          es: "Se descarta la informacion no guardada.",
          en: "Unsaved information is discarded.",
        },
        selector: '[data-help-id="payment-method-form-cancel"]',
      },
    ],
    edit: [
      {
        id: "action-edit-save",
        label: { es: "Guardar Cambios", en: "Save Changes" },
        purpose: {
          es: "Actualiza el metodo de pago con los cambios aplicados.",
          en: "Updates the payment method with applied changes.",
        },
        consequence: {
          es: "El catalogo refleja el nuevo estado y configuracion.",
          en: "The catalog reflects the new state and configuration.",
        },
        selector: '[data-help-id="payment-method-form-submit"]',
      },
      {
        id: "action-edit-cancel",
        label: { es: "Cancelar", en: "Cancel" },
        purpose: {
          es: "Sale del modo edicion sin confirmar ajustes.",
          en: "Exits edit mode without confirming adjustments.",
        },
        consequence: {
          es: "Se mantienen los datos actuales del metodo.",
          en: "Current method data remains unchanged.",
        },
        selector: '[data-help-id="payment-method-form-cancel"]',
      },
    ],
  },
});

const paymentMethodsHelpContent: HelpModuleContent = {
  moduleId: "payment-methods",
  title: {
    es: "Centro de ayuda: Metodos de pago",
    en: "Help center: Payment methods",
  },
  description: {
    es: "Este modulo permite administrar los metodos de pago aceptados por la organizacion y controlar su disponibilidad operativa.",
    en: "This module lets you manage payment methods accepted by the organization and control their operational availability.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Aqui puedes crear, editar y desactivar metodos de pago para mantener el flujo de cobro alineado con la operacion.",
        en: "Here you can create, edit, and deactivate payment methods to keep the billing flow aligned with operations.",
      },
      howTo: [
        {
          es: "Abre el modulo desde Configuracion > Metodos de pago.",
          en: "Open the module from Settings > Payment methods.",
        },
        {
          es: "Usa el buscador para verificar si el metodo ya existe antes de crear uno nuevo.",
          en: "Use the search box to verify the method doesn't already exist before creating a new one.",
        },
        {
          es: "Haz clic en 'Nuevo metodo' para abrir el formulario y registrar el metodo de pago.",
          en: "Click 'New method' to open the form and register the payment method.",
        },
      ],
      tips: [
        {
          es: "Conserva nombres claros y consistentes para evitar errores al registrar pagos en pedidos y facturas.",
          en: "Keep clear and consistent names to avoid mistakes when recording payments in orders and invoices.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes actualizar la lista, buscar metodos por nombre o descripcion, crear nuevos metodos y gestionar cambios sobre registros existentes.",
        en: "You can refresh the list, search methods by name or description, create new methods, and manage changes on existing records.",
      },
      howTo: [
        {
          es: "Para crear: haz clic en 'Nuevo metodo', ingresa nombre y descripcion, y confirma el registro.",
          en: "To create: click 'New method', enter name and description, and confirm the record.",
        },
        {
          es: "Para editar: localiza el metodo en la tabla y usa el icono de edicion para actualizar datos.",
          en: "To edit: locate the method in the table and use the edit icon to update data.",
        },
        {
          es: "Para desactivar: usa la accion de estado disponible en la fila del metodo de pago.",
          en: "To deactivate: use the status action available in the payment method row.",
        },
      ],
      bestPractices: [
        {
          es: "Antes de desactivar un metodo, valida si hay procesos activos que dependan de ese medio de pago.",
          en: "Before deactivating a method, validate whether active processes depend on that payment channel.",
        },
      ],
    },
    {
      id: "workflow",
      title: { es: "Flujo recomendado", en: "Recommended flow" },
      body: {
        es: "Revisa el listado actual, filtra por busqueda, abre creacion o edicion y confirma el estado final del metodo en la tabla.",
        en: "Review the current list, filter by search, open create or edit, and confirm final method status in the table.",
      },
      howTo: [
        {
          es: "Busca el metodo por nombre para confirmar que no existe antes de crear uno nuevo.",
          en: "Search the method by name to confirm it doesn't exist before creating a new one.",
        },
        {
          es: "Si necesitas actualizar datos, abre el formulario de edicion desde la fila del metodo.",
          en: "If you need to update data, open the edit form from the method row.",
        },
        {
          es: "Confirma el estado final del metodo en la tabla despues de guardar los cambios.",
          en: "Confirm the final method status in the table after saving changes.",
        },
      ],
      warnings: [
        {
          es: "Eliminar o desactivar un metodo sin evaluar impacto puede afectar registro de pagos en otras areas.",
          en: "Deleting or deactivating a method without impact review can affect payment recording in other areas.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Un error frecuente es crear metodos duplicados con variaciones de nombre. Usa la busqueda antes de crear nuevos registros.",
        en: "A common mistake is creating duplicate methods with name variations. Use search before creating new records.",
      },
      howTo: [
        {
          es: "Antes de crear, busca por nombre exacto y variaciones posibles para evitar duplicados.",
          en: "Before creating, search by exact name and possible variations to avoid duplicates.",
        },
        {
          es: "Si encuentras un duplicado, desactiva o elimina el menos usado antes de continuar.",
          en: "If you find a duplicate, deactivate or delete the least-used one before continuing.",
        },
        {
          es: "Para verificar dependencias, revisa pedidos o facturas recientes que usen ese metodo.",
          en: "To check dependencies, review recent orders or invoices using that payment method.",
        },
      ],
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Contexto del modulo", en: "1) Module context" },
      body: {
        es: "Este encabezado presenta el objetivo del modulo y el alcance de gestion de metodos de pago.",
        en: "This header presents the module objective and payment-method management scope.",
      },
      targetSelector: '[data-help-id="payment-methods-header"]',
    },
    {
      id: "step-2-actions",
      title: { es: "2) Acciones principales", en: "2) Main actions" },
      body: {
        es: "Desde aqui puedes refrescar la lista o crear un nuevo metodo de pago.",
        en: "From here you can refresh the list or create a new payment method.",
      },
      targetSelector: '[data-help-id="payment-methods-actions"]',
    },
    {
      id: "step-3-search",
      title: { es: "3) Busca metodos", en: "3) Search methods" },
      body: {
        es: "El buscador ayuda a ubicar rapidamente metodos por nombre o descripcion.",
        en: "The search box helps quickly locate methods by name or description.",
      },
      targetSelector: '[data-help-id="payment-methods-search"]',
      tip: {
        es: "Buscar antes de crear evita duplicados funcionales en la organizacion.",
        en: "Searching before creating avoids functional duplicates in the organization.",
      },
    },
    {
      id: "step-4-table",
      title: { es: "4) Administra el catalogo", en: "4) Manage the catalog" },
      body: {
        es: "La tabla centraliza estado, edicion y eliminacion de metodos disponibles.",
        en: "The table centralizes status, editing, and deletion of available methods.",
      },
      targetSelector: '[data-help-id="payment-methods-table"]',
      warning: {
        es: "Confirma el metodo objetivo antes de eliminar, especialmente en ambientes con alto volumen de cobros.",
        en: "Confirm the target method before deleting, especially in high-volume billing environments.",
      },
    },
  ],
  formGuides: paymentMethodCrudFormGuides,
};

export default paymentMethodsHelpContent;
