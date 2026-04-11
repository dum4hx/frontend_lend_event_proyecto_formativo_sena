import type { HelpModuleContent } from "../types";

const operationsHelpContent: HelpModuleContent = {
  moduleId: "operations",
  title: {
    es: "Centro de ayuda: Operaciones",
    en: "Help center: Operations",
  },
  description: {
    es: "Este panel concentra la operacion diaria por ubicacion: inspecciones, finanzas vencidas, inventario critico, transferencias, vencimientos y daños.",
    en: "This dashboard centralizes daily location operations: inspections, overdue financials, critical inventory, transfers, deadlines, and damages.",
  },
  sections: [
    {
      id: "introduction",
      title: { es: "Introduccion", en: "Introduction" },
      body: {
        es: "Aqui supervisas el estado operativo en tiempo real para priorizar acciones del equipo de bodega.",
        en: "Here you monitor real-time operational status to prioritize warehouse team actions.",
      },
      howTo: [
        {
          es: "Abre el modulo desde el menu lateral en Operaciones.",
          en: "Open the module from the sidebar under Operations.",
        },
        {
          es: "Selecciona la ubicacion de trabajo en el selector de sede antes de revisar datos.",
          en: "Select the work location in the site selector before reviewing any data.",
        },
        {
          es: "Revisa las tarjetas KPI para obtener una vista global de la carga operativa.",
          en: "Review the KPI cards for a global view of operational load.",
        },
        {
          es: "Usa las pestanas para navegar entre inspecciones, finanzas, inventario y demas flujos.",
          en: "Use the tabs to navigate between inspections, financials, inventory, and other flows.",
        },
      ],
      tips: [
        {
          es: "Seleccionar primero la ubicacion correcta evita decisiones sobre datos de otra sede.",
          en: "Selecting the right location first avoids decisions based on another site data.",
        },
      ],
    },
    {
      id: "functions",
      title: { es: "Funciones clave", en: "Key functions" },
      body: {
        es: "Puedes refrescar informacion por ubicacion, revisar KPIs, cambiar entre tabs operativos y atender tareas o alertas especificas.",
        en: "You can refresh location data, review KPIs, switch across operational tabs, and address specific tasks or alerts.",
      },
      howTo: [
        {
          es: "Haz clic en 'Actualizar' para forzar sincronizacion de datos operativos en tiempo real.",
          en: "Click 'Refresh' to force sync of real-time operational data.",
        },
        {
          es: "Lee los KPI cards para identificar el flujo con mayor carga (inspecciones, finanzas, etc.).",
          en: "Read the KPI cards to identify the flow with the highest load (inspections, financials, etc.).",
        },
        {
          es: "Selecciona el tab critico y revisa el panel de detalle para ejecutar seguimiento.",
          en: "Select the critical tab and review the detail panel to take action.",
        },
      ],
      bestPractices: [
        {
          es: "Empieza por Overview para una vista global y luego profundiza en el tab con mayor criticidad.",
          en: "Start with Overview for global visibility, then drill into the highest-priority tab.",
        },
      ],
    },
    {
      id: "workflow",
      title: { es: "Flujo recomendado", en: "Recommended flow" },
      body: {
        es: "Valida ubicacion, revisa KPI, identifica alertas por tab y ejecuta seguimiento en inspecciones, finanzas o inventario segun prioridad.",
        en: "Validate location, review KPIs, identify alerts by tab, and follow up in inspections, financials, or inventory by priority.",
      },
      howTo: [
        {
          es: "Verifica que la ubicacion seleccionada sea la correcta en el selector del encabezado.",
          en: "Verify the selected location is correct in the header selector.",
        },
        {
          es: "Lee los KPI para detectar alertas criticas en cada flujo operativo.",
          en: "Read the KPIs to detect critical alerts in each operational flow.",
        },
        {
          es: "Entra al tab con mayor criticidad y ejecuta las acciones requeridas.",
          en: "Enter the tab with the highest priority and execute the required actions.",
        },
        {
          es: "Refresca los datos al terminar para confirmar que el estado se actualizo correctamente.",
          en: "Refresh data after finishing to confirm the status updated correctly.",
        },
      ],
      warnings: [
        {
          es: "Trabajar con una ubicacion incorrecta puede desviar recursos y tiempos de respuesta.",
          en: "Working with the wrong location can misallocate resources and response time.",
        },
      ],
    },
    {
      id: "common-errors",
      title: { es: "Errores comunes", en: "Common errors" },
      body: {
        es: "Un error frecuente es quedarse solo en KPI sin revisar paneles de detalle. Usa las pestanas para confirmar causas y acciones concretas.",
        en: "A common mistake is staying only on KPI cards without checking detail panels. Use tabs to confirm causes and concrete actions.",
      },
      howTo: [
        {
          es: "Si un KPI muestra alta carga, entra al tab correspondiente para ver los registros especificos.",
          en: "If a KPI shows high load, enter the corresponding tab to see specific records.",
        },
        {
          es: "Revisa el panel de detalle de cada tab para confirmar la causa raiz de cada alerta.",
          en: "Review the detail panel in each tab to confirm the root cause of each alert.",
        },
        {
          es: "Ejecuta la accion correctiva desde el panel y refresca para validar su efecto.",
          en: "Execute the corrective action from the panel and refresh to validate its effect.",
        },
      ],
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Encabezado operativo", en: "1) Operational header" },
      body: {
        es: "Este bloque define el contexto de operaciones y centraliza la seleccion de ubicacion y refresco.",
        en: "This block defines operations context and centralizes location selection and refresh.",
      },
      targetSelector: '[data-help-id="operations-header"]',
    },
    {
      id: "step-2-actions",
      title: { es: "2) Ubicacion y actualizar", en: "2) Location and refresh" },
      body: {
        es: "Aqui eliges la ubicacion de trabajo y fuerzas sincronizacion de datos operativos.",
        en: "Here you choose the working location and trigger operational data synchronization.",
      },
      targetSelector: '[data-help-id="operations-actions"]',
    },
    {
      id: "step-3-kpis",
      title: { es: "3) Lectura de KPI", en: "3) KPI reading" },
      body: {
        es: "Los indicadores entregan una vista rapida de carga operativa para priorizar acciones.",
        en: "Indicators provide a quick view of operational load to prioritize actions.",
      },
      targetSelector: '[data-help-id="operations-kpis"]',
    },
    {
      id: "step-4-tabs",
      title: { es: "4) Navegacion por tabs", en: "4) Tab navigation" },
      body: {
        es: "Usa estas pestanas para entrar al area especifica: inspecciones, finanzas, inventario, transferencias, vencimientos o daños.",
        en: "Use these tabs to enter specific areas: inspections, financials, inventory, transfers, deadlines, or damages.",
      },
      targetSelector: '[data-help-id="operations-tabs"]',
    },
    {
      id: "step-5-panels",
      title: { es: "5) Panel de detalle", en: "5) Detail panel" },
      body: {
        es: "En este bloque ejecutas el analisis detallado y seguimiento de cada flujo operativo.",
        en: "In this block you perform detailed analysis and follow-up for each operational flow.",
      },
      targetSelector: '[data-help-id="operations-panels"]',
      warning: {
        es: "Verifica siempre tab activo y ubicacion antes de escalar incidentes o tomar decisiones.",
        en: "Always verify active tab and location before escalating incidents or making decisions.",
      },
    },
  ],
};

export default operationsHelpContent;
