import type { HelpModuleContent } from "../types";
import { createCrudFormGuides } from "../formGuideTemplates";

const materialInstancesFormGuides = createCrudFormGuides({
  baseId: "material-instances",
  title: {
    create: {
      es: "Formulario: Crear instancia",
      en: "Form: Create instance",
    },
    edit: {
      es: "Formulario: Editar instancia",
      en: "Form: Edit instance",
    },
  },
  purpose: {
    create: {
      es: "Registrar una unidad fisica de inventario y su ubicacion inicial.",
      en: "Register a physical inventory unit and its initial location.",
    },
    edit: {
      es: "Actualizar metadatos operativos de una unidad existente.",
      en: "Update operational metadata of an existing unit.",
    },
  },
  selector: {
    create: '[data-help-id="material-instances-form-create"]',
    edit: '[data-help-id="material-instances-form-edit"]',
  },
  fields: [
    {
      id: "field-model",
      label: { es: "Tipo de material", en: "Material type" },
      purpose: {
        es: "Asocia la unidad a un tipo definido en catalogo.",
        en: "Associates the unit with a catalog-defined type.",
      },
      dataType: { es: "Seleccion", en: "Select" },
      required: true,
      example: {
        es: "Mesa plegable 1.8m, Proyector 4K",
        en: "Folding table 1.8m, 4K Projector",
      },
      selector: '[data-help-id="material-instances-form-model"]',
    },
    {
      id: "field-serial",
      label: { es: "Serial", en: "Serial" },
      purpose: {
        es: "Identificador unico interno para trazabilidad a lo largo del ciclo de vida de la unidad.",
        en: "Unique internal identifier for traceability throughout the unit's lifecycle.",
      },
      dataType: { es: "Texto", en: "Text" },
      required: true,
      example: { es: "MESA-001, PROJ-2024-007", en: "MESA-001, PROJ-2024-007" },
      selector: '[data-help-id="material-instances-form-serial"]',
    },
    {
      id: "field-barcode",
      label: { es: "Codigo de barras", en: "Barcode" },
      purpose: {
        es: "Facilita flujos con scanner en bodega. Si se omite, se puede asignar despues.",
        en: "Enables scanner-based warehouse workflows. Can be assigned later if omitted.",
      },
      dataType: { es: "Texto/Numerico", en: "Text/Numeric" },
      example: { es: "1234567890128", en: "1234567890128" },
      selector: '[data-help-id="material-instances-form-barcode"]',
    },
    {
      id: "field-location",
      label: { es: "Ubicacion", en: "Location" },
      purpose: {
        es: "Define donde queda almacenada la unidad en bodega. Es necesaria para planificar despachos.",
        en: "Defines where the unit is stored in the warehouse. Required for dispatch planning.",
      },
      dataType: { es: "Seleccion", en: "Select" },
      required: true,
      example: { es: "Bodega A - Estante 3, Deposito principal", en: "Warehouse A - Shelf 3, Main storage" },
      selector: '[data-help-id="material-instances-form-location"]',
    },
  ],
  actions: {
    create: [
      {
        id: "action-create-instance",
        label: { es: "Crear instancia", en: "Create instance" },
        purpose: {
          es: "Guarda la unidad fisica nueva en el inventario.",
          en: "Saves the new physical unit into inventory.",
        },
        consequence: {
          es: "La instancia queda disponible para operaciones de prestamo y mantenimiento.",
          en: "Instance becomes available for loan and maintenance operations.",
        },
        selector: '[data-help-id="material-instances-form-submit"]',
      },
      {
        id: "action-create-cancel",
        label: { es: "Cancelar", en: "Cancel" },
        purpose: {
          es: "Cerrar formulario sin guardar la instancia.",
          en: "Close form without saving the instance.",
        },
        consequence: {
          es: "Se descartan los cambios.",
          en: "Changes are discarded.",
        },
        selector: '[data-help-id="material-instances-form-cancel"]',
      },
    ],
    edit: [
      {
        id: "action-edit-instance",
        label: { es: "Actualizar instancia", en: "Update instance" },
        purpose: {
          es: "Aplica cambios a la instancia seleccionada.",
          en: "Applies changes to the selected instance.",
        },
        consequence: {
          es: "Inventario refleja datos actualizados.",
          en: "Inventory reflects updated data.",
        },
        selector: '[data-help-id="material-instances-form-submit"]',
      },
      {
        id: "action-edit-cancel",
        label: { es: "Cancelar", en: "Cancel" },
        purpose: {
          es: "Salir sin guardar.",
          en: "Exit without saving.",
        },
        consequence: {
          es: "Se mantiene estado previo.",
          en: "Previous state is preserved.",
        },
        selector: '[data-help-id="material-instances-form-cancel"]',
      },
    ],
  },
});

const materialInstancesHelpContent: HelpModuleContent = {
  moduleId: "material-instances",
  title: {
    es: "Centro de ayuda: Instancias de material",
    en: "Help center: Material instances",
  },
  description: {
    es: "Este modulo administra el inventario fisico real: unidades individuales, estados, codigos de barras y trazabilidad operativa. Cada instancia representa un objeto fisico que puede prestarse, inspeccionarse o transferirse.",
    en: "This module manages real physical inventory: individual units, statuses, barcodes, and operational traceability. Each instance represents a physical object that can be loaned, inspected, or transferred.",
  },
  sections: [
    {
      id: "overview",
      title: { es: "¿Que es una instancia?", en: "What is an instance?" },
      body: {
        es: "Una instancia es la representacion digital de un objeto fisico unico en tu inventario — por ejemplo, una mesa especifica con serial MESA-001. A diferencia de los tipos de material (que definen caracteristicas generales), las instancias rastrean ubicacion y estado en tiempo real.",
        en: "An instance is the digital representation of a unique physical object in your inventory — for example, a specific table with serial MESA-001. Unlike material types (which define general characteristics), instances track real-time location and status.",
      },
    },
    {
      id: "create-instance",
      title: { es: "Crear una instancia", en: "Create an instance" },
      body: {
        es: "Registra un nuevo objeto fisico en el inventario asignandole tipo, serial, ubicacion y opcionalmente un codigo de barras.",
        en: "Register a new physical object in inventory by assigning it a type, serial, location, and optionally a barcode.",
      },
      howTo: [
        {
          es: "Verifica que exista al menos un tipo de material en el modulo Material Types.",
          en: "Verify that at least one material type exists in the Material Types module.",
        },
        {
          es: "Verifica que exista al menos una ubicacion configurada en el modulo Locations.",
          en: "Verify that at least one location is configured in the Locations module.",
        },
        {
          es: "Haz clic en el boton 'New instance' en la barra de acciones.",
          en: "Click the 'New instance' button in the actions bar.",
        },
        {
          es: "Selecciona el tipo de material al que pertenece esta unidad.",
          en: "Select the material type this unit belongs to.",
        },
        {
          es: "Ingresa el serial unico (ej: MESA-001). Usa un formato consistente en tu organizacion.",
          en: "Enter the unique serial (e.g., MESA-001). Use a consistent format across your organization.",
        },
        {
          es: "Opcionalmente agrega el codigo de barras fisico del objeto.",
          en: "Optionally add the physical barcode of the object.",
        },
        {
          es: "Selecciona la ubicacion de almacenamiento inicial.",
          en: "Select the initial storage location.",
        },
        {
          es: "Haz clic en 'Create instance'. La unidad quedara disponible para operaciones.",
          en: "Click 'Create instance'. The unit will be available for operations.",
        },
      ],
      tips: [
        {
          es: "Si aun no hay tipos o ubicaciones, el sistema mostrara un modal de prerequisitos con acceso directo a los modulos necesarios.",
          en: "If no types or locations exist yet, the system will show a prerequisite modal with direct links to the required modules.",
        },
      ],
    },
    {
      id: "search-filter",
      title: { es: "Buscar y filtrar instancias", en: "Search and filter instances" },
      body: {
        es: "La barra de busqueda filtra dinamicamente por serial, codigo de barras, tipo de material y ubicacion.",
        en: "The search bar dynamically filters by serial, barcode, material type, and location.",
      },
      howTo: [
        {
          es: "Escribe en el campo de busqueda cualquier parte del serial, barcode, nombre del tipo o nombre de la ubicacion.",
          en: "Type in the search field any part of the serial, barcode, type name, or location name.",
        },
        {
          es: "Los resultados se filtran en tiempo real — no se requiere presionar Enter.",
          en: "Results filter in real time — no need to press Enter.",
        },
        {
          es: "Para limpiar el filtro, borra el contenido del campo de busqueda.",
          en: "To clear the filter, erase the content of the search field.",
        },
        {
          es: "Si el volumen es alto, usa la paginacion en la parte inferior para navegar por grupos de 10.",
          en: "If volume is high, use the pagination at the bottom to navigate through groups of 10.",
        },
      ],
      tips: [
        {
          es: "Buscar por ubicacion es util para auditar que unidades se encuentran en un espacio fisico especifico.",
          en: "Searching by location is useful to audit which units are in a specific physical space.",
        },
      ],
    },
    {
      id: "scanner-workflow",
      title: { es: "Flujo con scanner de codigo de barras", en: "Barcode scanner workflow" },
      body: {
        es: "El scanner integrado permite localizar instancias por codigo fisico y cambiar su estado directamente, ideal para operaciones de campo (prestamo, devolucion, mantenimiento).",
        en: "The integrated scanner lets you locate instances by physical barcode and change their status directly, ideal for field operations (loan, return, maintenance).",
      },
      howTo: [
        {
          es: "Asegurate de que el switch 'Scanner enabled' este activado en la seccion de scanner.",
          en: "Make sure the 'Scanner enabled' switch is activated in the scanner section.",
        },
        {
          es: "Escanea el codigo de barras del objeto fisico con el lector. El codigo aparece automaticamente en el campo.",
          en: "Scan the barcode of the physical object with the reader. The code appears automatically in the field.",
        },
        {
          es: "Si la unidad existe: se selecciona y muestra su informacion. Puedes actualizar el estado con los botones rapidos.",
          en: "If the unit exists: it is selected and its information is shown. You can update its status with the quick buttons.",
        },
        {
          es: "Si el codigo no existe: aparece una alerta ofreciendo registrar la unidad con ese codigo como barcode.",
          en: "If the code does not exist: an alert appears offering to register the unit with that code as barcode.",
        },
        {
          es: "Para entrada manual: escribe el codigo en el campo 'Manual scan input' y haz clic en 'Scan'.",
          en: "For manual entry: type the code in the 'Manual scan input' field and click 'Scan'.",
        },
        {
          es: "Tras localizar una unidad, usa los botones de estado (Available, In use, Maintenance, Retired) para actualizarlo.",
          en: "After locating a unit, use the status buttons (Available, In use, Maintenance, Retired) to update it.",
        },
      ],
      warnings: [
        {
          es: "Cambiar al estado 'Retired' marca la unidad como fuera de servicio y puede impedir que sea incluida en nuevas operaciones.",
          en: "Changing to 'Retired' status marks the unit as out of service and may prevent it from being included in new operations.",
        },
      ],
      tips: [
        {
          es: "El ultimo codigo escaneado sirve como nota de auditoria al actualizar estado desde el flujo de scanner.",
          en: "The last scanned code serves as an audit note when updating status from the scanner flow.",
        },
      ],
    },
    {
      id: "bulk-barcode-print",
      title: { es: "Imprimir codigos de barras en masa", en: "Bulk barcode printing" },
      body: {
        es: "Permite generar e imprimir etiquetas de codigo de barras para multiples instancias seleccionadas simultaneamente.",
        en: "Allows generating and printing barcode labels for multiple selected instances simultaneously.",
      },
      howTo: [
        {
          es: "Usa los checkboxes de la lista para seleccionar las instancias que necesitas etiquetar.",
          en: "Use the checkboxes in the list to select the instances you need to label.",
        },
        {
          es: "Para seleccionar todas las instancias visibles, usa el checkbox del encabezado de la tabla.",
          en: "To select all visible instances, use the checkbox in the table header.",
        },
        {
          es: "Con al menos una instancia seleccionada, haz clic en 'Print barcodes'.",
          en: "With at least one instance selected, click 'Print barcodes'.",
        },
        {
          es: "El modal de impresion muestra una vista previa. Revisa que todos los codigos sean correctos.",
          en: "The print modal shows a preview. Verify that all codes are correct.",
        },
        {
          es: "Confirma la impresion. El sistema genera un layout listo para impresora de etiquetas o PDF.",
          en: "Confirm the print. The system generates a layout ready for a label printer or PDF.",
        },
      ],
      tips: [
        {
          es: "Imprime codigos al registrar unidades nuevas para etiquetarlas fisicamente antes de almacenarlas.",
          en: "Print barcodes when registering new units to physically label them before storing.",
        },
      ],
    },
    {
      id: "import-instances",
      title: { es: "Importar instancias desde archivo", en: "Import instances from file" },
      body: {
        es: "Para incorporar grandes volumenes de inventario rapidamente, usa la importacion masiva desde un archivo estructurado (CSV/Excel).",
        en: "To quickly incorporate large inventory volumes, use bulk import from a structured file (CSV/Excel).",
      },
      howTo: [
        {
          es: "Haz clic en el boton 'Import' en la barra de acciones.",
          en: "Click the 'Import' button in the actions bar.",
        },
        {
          es: "Descarga la plantilla de importacion si es la primera vez que lo haces.",
          en: "Download the import template if it is your first time.",
        },
        {
          es: "Completa la plantilla con: modelId (ID del tipo de material), serialNumber, barcode (opcional), locationId.",
          en: "Fill the template with: modelId (material type ID), serialNumber, barcode (optional), locationId.",
        },
        {
          es: "Carga el archivo completo en el modal de importacion.",
          en: "Upload the completed file in the import modal.",
        },
        {
          es: "El sistema procesa cada fila y muestra un resumen de exitos y errores.",
          en: "The system processes each row and displays a summary of successes and errors.",
        },
        {
          es: "Revisa los seriales importados en la lista para confirmar que todos quedaron correctamente.",
          en: "Review the imported serials in the list to confirm they were all registered correctly.",
        },
      ],
      warnings: [
        {
          es: "Si un serial ya existe en el sistema, la fila sera rechazada para evitar duplicados.",
          en: "If a serial already exists in the system, the row will be rejected to avoid duplicates.",
        },
      ],
    },
    {
      id: "status-management",
      title: { es: "Gestion de estados de instancia", en: "Instance status management" },
      body: {
        es: "Cada instancia tiene un estado que controla su disponibilidad operativa. Los estados posibles son: Available, In use, Maintenance y Retired.",
        en: "Each instance has a status that controls its operational availability. Possible statuses are: Available, In use, Maintenance, and Retired.",
      },
      howTo: [
        {
          es: "Para cambiar estado via scanner: escanea la unidad, luego selecciona el nuevo estado con los botones rapidos.",
          en: "To change status via scanner: scan the unit, then select the new status with the quick buttons.",
        },
        {
          es: "Available: unidad lista para ser incluida en operaciones de prestamo.",
          en: "Available: unit ready to be included in loan operations.",
        },
        {
          es: "In use: unidad actualmente en un prestamo activo. El sistema actualiza esto automaticamente durante operaciones.",
          en: "In use: unit currently in an active loan. The system updates this automatically during operations.",
        },
        {
          es: "Maintenance: unidad fuera de servicio temporal por revision o reparacion.",
          en: "Maintenance: unit temporarily out of service for inspection or repair.",
        },
        {
          es: "Retired: unidad dada de baja permanentemente. Usar solo cuando el objeto ya no puede utilizarse.",
          en: "Retired: unit permanently decommissioned. Use only when the object can no longer be used.",
        },
      ],
      warnings: [
        {
          es: "No marques como 'Retired' si la unidad solo necesita mantenimiento temporal — usa 'Maintenance' en su lugar.",
          en: "Do not mark as 'Retired' if the unit only needs temporary maintenance — use 'Maintenance' instead.",
        },
      ],
      bestPractices: [
        {
          es: "Mantener los estados actualizados en tiempo real es clave para que el sistema de reservas y prestamos opere correctamente.",
          en: "Keeping statuses updated in real time is key for the reservation and loan system to operate correctly.",
        },
      ],
    },
    {
      id: "delete-instance",
      title: { es: "Eliminar una instancia", en: "Delete an instance" },
      body: {
        es: "La eliminacion es permanente y no puede deshacerse. Solo debe usarse cuando la instancia fue registrada por error.",
        en: "Deletion is permanent and cannot be undone. It should only be used when the instance was registered by mistake.",
      },
      howTo: [
        {
          es: "Localiza la instancia en la lista.",
          en: "Locate the instance in the list.",
        },
        {
          es: "Haz clic en el icono de eliminar (papelera) en la fila correspondiente.",
          en: "Click the delete icon (trash) in the corresponding row.",
        },
        {
          es: "Aparece un toast de confirmacion. Lee el mensaje y haz clic en 'Confirm' para proceder.",
          en: "A confirmation toast appears. Read the message and click 'Confirm' to proceed.",
        },
        {
          es: "Si no deseas eliminar, simplemente no confirmes el toast — se cierra automaticamente.",
          en: "If you do not want to delete, simply do not confirm the toast — it closes automatically.",
        },
      ],
      warnings: [
        {
          es: "Si la instancia sigue asociada a operaciones activas, eliminarla puede generar inconsistencias. Cambia su estado a Retired en su lugar.",
          en: "If the instance is still linked to active operations, deleting it can cause inconsistencies. Change its status to Retired instead.",
        },
      ],
    },
    {
      id: "metrics",
      title: { es: "Leer las metricas del inventario", en: "Reading inventory metrics" },
      body: {
        es: "Las tarjetas de resumen muestran la distribucion actual del inventario por estado, ofreciendo visibilidad rapida de la salud operativa.",
        en: "The summary cards show the current inventory distribution by status, offering quick visibility into operational health.",
      },
      howTo: [
        {
          es: "Observa las tarjetas de estado al inicio de la vista para conocer el total de unidades y su distribucion.",
          en: "Observe the status cards at the top of the view to know the total units and their distribution.",
        },
        {
          es: "Un numero alto en 'Maintenance' puede indicar que necesitas revisar el proceso de mantenimiento.",
          en: "A high number in 'Maintenance' may indicate you need to review the maintenance process.",
        },
        {
          es: "Un numero alto en 'In use' con pocos 'Available' indica baja disponibilidad — considera ampliar inventario.",
          en: "A high 'In use' count with few 'Available' suggests low availability — consider expanding inventory.",
        },
      ],
    },
  ],
  walkthrough: [
    {
      id: "step-1-header",
      title: { es: "1) Catalogo de inventario fisico", en: "1) Physical inventory catalog" },
      body: {
        es: "Este modulo lista todas las unidades fisicas del inventario. Cada fila representa un objeto real que se puede prestar.",
        en: "This module lists all physical inventory units. Each row represents a real object that can be loaned.",
      },
      targetSelector: '[data-help-id="material-instances-title"]',
    },
    {
      id: "step-2-actions",
      title: { es: "2) Barra de acciones", en: "2) Actions bar" },
      body: {
        es: "Desde aqui puedes crear instancias, importar desde archivo, imprimir codigos de barras seleccionados y buscar en el catalogo.",
        en: "From here you can create instances, import from a file, print selected barcodes, and search the catalog.",
      },
      targetSelector: '[data-help-id="material-instances-actions"]',
    },
    {
      id: "step-3-scanner",
      title: { es: "3) Panel de scanner", en: "3) Scanner panel" },
      body: {
        es: "Este bloque permite localizar unidades por codigo de barras o serial. Al escanear, puedes cambiar el estado de la unidad con un solo clic: ideal para operaciones de campo.",
        en: "This block lets you locate units by barcode or serial. After scanning, you can update the unit's status with one click — ideal for field operations.",
      },
      targetSelector: '[data-help-id="material-instances-scanner"]',
      tip: {
        es: "Activa el scanner fisico y apunta al codigo de barras de la etiqueta para autocompletar el campo.",
        en: "Activate the physical scanner and point it at the label's barcode to auto-fill the field.",
      },
    },
    {
      id: "step-4-stats",
      title: { es: "4) Metricas de disponibilidad", en: "4) Availability metrics" },
      body: {
        es: "Estas tarjetas muestran en tiempo real cuantas unidades estan disponibles, en uso, en mantenimiento y retiradas.",
        en: "These cards show in real time how many units are available, in use, under maintenance, and retired.",
      },
      targetSelector: '[data-help-id="material-instances-stats"]',
    },
    {
      id: "step-5-list",
      title: { es: "5) Lista de instancias", en: "5) Instances list" },
      body: {
        es: "Aqui ves todas las unidades filtradas. Seleccionalas para impresion masiva, haz clic en una para ver detalle, o elimina las que corresponda.",
        en: "Here you see all filtered units. Select them for bulk printing, click one to view details, or delete where appropriate.",
      },
      targetSelector: '[data-help-id="material-instances-list"]',
      warning: {
        es: "Antes de eliminar, verifica que la unidad no este en un prestamo o inspeccion activa.",
        en: "Before deleting, verify the unit is not in an active loan or inspection.",
      },
    },
    {
      id: "step-6-pagination",
      title: { es: "6) Paginacion", en: "6) Pagination" },
      body: {
        es: "Navega entre paginas cuando el inventario crece. La paginacion muestra 10 unidades por pagina.",
        en: "Navigate between pages as inventory grows. Pagination shows 10 units per page.",
      },
      targetSelector: '[data-help-id="material-instances-pagination"]',
    },
  ],
  formGuides: materialInstancesFormGuides,
};

export default materialInstancesHelpContent;
