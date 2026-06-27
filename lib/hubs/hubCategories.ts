export type HubCategorySlug = "mantenimiento-espacios-verdes" | "fumigacion-control-plagas" | "reparto-recurrente" | "servicios-tecnicos" | "otros";

export type HubCategoryConfig = {
  id: HubCategorySlug;
  slug: HubCategorySlug;
  nombre: string;
  descripcion: string;
  tipoReporte: "visita" | "sanitario" | "entrega" | "tecnico" | "general";
  moduloOperativoSugerido: "jardinerosya" | "fumigadoresya" | "comerciarya" | "pileterosya" | "otro";
  camposEspecificos: string[];
  camposEconomicos: string[];
  estados: string[];
  formasMedicion: string[];
  procesosHabilitados: string[];
  visual: { etiqueta: string; color: string; fondo: string; borde: string };
  textos: { servicioPrincipalFallback: string; proximoPaso: string; parametrosTitulo: string; parametrosDescripcion: string };
};

export const HUB_CATEGORY_DEFAULT: HubCategorySlug = "mantenimiento-espacios-verdes";

export const HUB_CATEGORIES: HubCategoryConfig[] = [
  {
    id: "mantenimiento-espacios-verdes",
    slug: "mantenimiento-espacios-verdes",
    nombre: "Mantenimiento de espacios verdes",
    descripcion: "Organiza visitas recurrentes, horas de trabajo, cuadrillas, maquinaria e insumos para jardines y espacios verdes.",
    tipoReporte: "visita",
    moduloOperativoSugerido: "jardinerosya",
    camposEspecificos: ["horas de trabajo", "maquinaria", "jardineros", "insumos", "estimado de distribución"],
    camposEconomicos: ["valor hora", "traslado", "nafta", "aceite", "horas de maquinaria", "comisión responsable"],
    estados: ["programado", "en visita", "finalizado", "reportado"],
    formasMedicion: ["horas", "visitas", "metros cuadrados referenciales", "maquinaria utilizada"],
    procesosHabilitados: ["reporte de visita", "parámetros JardinerosYa", "distribución por cuadrilla", "historial de trabajos"],
    visual: { etiqueta: "Espacios verdes", color: "#1E8F4D", fondo: "#EAF7EF", borde: "#BFE8CF" },
    textos: {
      servicioPrincipalFallback: "Mantenimiento de espacios verdes",
      proximoPaso: "Sumar demanda, revisar cobertura y coordinar visitas de mantenimiento.",
      parametrosTitulo: "JardinerosYa como algoritmo operativo",
      parametrosDescripcion: "Este Hub usa una configuración específica para mantenimiento de espacios verdes: horas de trabajo, traslado, maquinaria e insumos básicos.",
    },
  },
  {
    id: "fumigacion-control-plagas",
    slug: "fumigacion-control-plagas",
    nombre: "Fumigación / control de plagas",
    descripcion: "Prepara certificados, vencimientos, técnicos intervinientes, productos aplicados, planos o trampas y reportes sanitarios.",
    tipoReporte: "sanitario",
    moduloOperativoSugerido: "fumigadoresya",
    camposEspecificos: ["certificado", "vencimiento", "técnico interviniente", "productos aplicados", "plano/trampas"],
    camposEconomicos: ["producto aplicado", "mano de obra técnica", "costo sanitario", "traslado técnico"],
    estados: ["relevamiento", "aplicación", "certificado emitido", "vencido"],
    formasMedicion: ["aplicaciones", "ambientes", "trampas", "vencimientos"],
    procesosHabilitados: ["reporte sanitario", "certificados", "alertas de vencimiento", "productos aplicados"],
    visual: { etiqueta: "Fumigación", color: "#8A4F00", fondo: "#FFF4CC", borde: "#F3D37A" },
    textos: { servicioPrincipalFallback: "Control de plagas", proximoPaso: "Registrar técnico, productos aplicados y vencimiento del certificado.", parametrosTitulo: "Proceso sanitario del Hub", parametrosDescripcion: "Este Hub puede activar certificados, vencimientos, productos aplicados y reportes sanitarios." },
  },
  {
    id: "reparto-recurrente",
    slug: "reparto-recurrente",
    nombre: "Huevos / reparto recurrente",
    descripcion: "Organiza entregas recurrentes, unidades o cajas, recorridos, estado de entrega y costos logísticos.",
    tipoReporte: "entrega",
    moduloOperativoSugerido: "comerciarya",
    camposEspecificos: ["entregas", "unidades/cajas", "recorridos", "estado de entrega"],
    camposEconomicos: ["costo logístico", "precio por unidad", "cajas entregadas", "comisión reparto"],
    estados: ["armando recorrido", "en reparto", "entregado", "reprogramado"],
    formasMedicion: ["unidades", "cajas", "paradas", "kilómetros"],
    procesosHabilitados: ["planilla de entregas", "ruteo", "control de cobranzas", "costos logísticos"],
    visual: { etiqueta: "Reparto", color: "#B45309", fondo: "#FFF7ED", borde: "#FDBA74" },
    textos: { servicioPrincipalFallback: "Reparto recurrente", proximoPaso: "Agrupar pedidos, armar recorridos y controlar entregas.", parametrosTitulo: "Proceso logístico del Hub", parametrosDescripcion: "Este Hub puede organizar unidades, cajas, recorridos, estados de entrega y costos logísticos." },
  },
  {
    id: "servicios-tecnicos", slug: "servicios-tecnicos", nombre: "Servicios técnicos", descripcion: "Base para futuros Hubs técnicos con órdenes, diagnósticos, repuestos e intervenciones.", tipoReporte: "tecnico", moduloOperativoSugerido: "otro", camposEspecificos: ["orden de trabajo", "diagnóstico", "repuestos", "técnico"], camposEconomicos: ["mano de obra", "repuestos", "visita técnica"], estados: ["diagnóstico", "cotizado", "en ejecución", "cerrado"], formasMedicion: ["órdenes", "visitas", "repuestos"], procesosHabilitados: ["orden técnica", "cotización", "cierre de intervención"], visual: { etiqueta: "Técnico", color: "#2563EB", fondo: "#EFF6FF", borde: "#BFDBFE" }, textos: { servicioPrincipalFallback: "Servicio técnico", proximoPaso: "Registrar diagnóstico, responsable técnico y orden de trabajo.", parametrosTitulo: "Proceso técnico del Hub", parametrosDescripcion: "Este Hub queda preparado para órdenes de trabajo, repuestos e intervenciones técnicas." }
  },
  {
    id: "otros", slug: "otros", nombre: "Otros futuros Hubs", descripcion: "Categoría genérica para validar nuevos procesos antes de formalizar una operación propia.", tipoReporte: "general", moduloOperativoSugerido: "otro", camposEspecificos: ["campos a definir"], camposEconomicos: ["costos a definir"], estados: ["borrador", "activo", "pausado"], formasMedicion: ["a definir"], procesosHabilitados: ["ficha general", "reportes generales"], visual: { etiqueta: "General", color: "#475569", fondo: "#F8FAFC", borde: "#CBD5E1" }, textos: { servicioPrincipalFallback: "Servicio a coordinar", proximoPaso: "Definir proceso, campos y responsables de la categoría.", parametrosTitulo: "Proceso general del Hub", parametrosDescripcion: "Este Hub usa la experiencia general hasta formalizar una categoría específica." }
  },
];
