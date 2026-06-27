import type { HubCategorySlug } from "./hubCategories";

export type BranchSlug = "mantenimiento-verde" | "control-de-plagas" | "ventas";
export type BranchStatus = "activa" | "preparada" | "pausada";
export type BranchModule = "usuarios" | "clientes" | "reportes" | "procesos" | "certificados" | "vencimientos" | "productos" | "pedidos" | "entregas" | "cobranzas" | "maquinaria" | "distribucion";

export type BranchConfig = {
  id: BranchSlug;
  name: string;
  slug: BranchSlug;
  description: string;
  status: BranchStatus;
  icon: string;
  color: string;
  enabledModules: BranchModule[];
  reportType: "mantenimiento" | "sanitario" | "venta-reparto";
  processType: "visitas-verdes" | "cobertura-sanitaria" | "logistica-comercial";
  hubCategories: HubCategorySlug[];
  mainService: string;
  fields: string[];
  economicFields: string[];
  states: string[];
  metrics: string[];
  texts: {
    title: string;
    hubLabel: string;
    nextStep: string;
    emptyState: string;
  };
};

export const BRANCH_DEFAULT: BranchSlug = "mantenimiento-verde";

export const BRANCHES: BranchConfig[] = [
  {
    id: "mantenimiento-verde",
    slug: "mantenimiento-verde",
    name: "Mantenimiento verde",
    description: "Jardines, espacios verdes, visitas, maquinaria y reportes.",
    status: "activa",
    icon: "🌿",
    color: "#1E8F4D",
    enabledModules: ["usuarios", "clientes", "reportes", "procesos", "maquinaria", "distribucion"],
    reportType: "mantenimiento",
    processType: "visitas-verdes",
    hubCategories: ["mantenimiento-espacios-verdes"],
    mainService: "Mantenimiento de espacios verdes",
    fields: ["horas trabajadas", "maquinaria", "jardineros", "reportes de visitas", "estimado de distribución"],
    economicFields: ["valor hora", "traslado", "nafta", "aceite", "horas de maquinaria", "comisión responsable"],
    states: ["programado", "en visita", "finalizado", "reportado"],
    metrics: ["horas", "visitas", "maquinaria utilizada", "distribución por cuadrilla"],
    texts: { title: "Operación de mantenimiento verde", hubLabel: "Hubs de mantenimiento", nextStep: "Coordinar visitas, cuadrillas, maquinaria y reportes de mantenimiento.", emptyState: "Todavía no hay Hubs dentro de Mantenimiento verde." },
  },
  {
    id: "control-de-plagas",
    slug: "control-de-plagas",
    name: "Control de plagas",
    description: "Fumigaciones, certificados, vencimientos, técnicos y productos.",
    status: "preparada",
    icon: "🛡️",
    color: "#8A4F00",
    enabledModules: ["usuarios", "clientes", "reportes", "procesos", "certificados", "vencimientos", "productos"],
    reportType: "sanitario",
    processType: "cobertura-sanitaria",
    hubCategories: ["fumigacion-control-plagas"],
    mainService: "Control de plagas",
    fields: ["certificados", "vencimientos", "productos aplicados", "técnicos intervinientes", "trampas", "reportes sanitarios", "historial por ubicación"],
    economicFields: ["producto aplicado", "mano de obra técnica", "costo sanitario", "traslado técnico"],
    states: ["relevamiento", "aplicación", "certificado emitido", "vencido"],
    metrics: ["aplicaciones", "ambientes", "trampas", "vencimientos", "cobertura sanitaria"],
    texts: { title: "Operación sanitaria", hubLabel: "Hubs sanitarios", nextStep: "Registrar técnico, productos, certificados, vencimientos y cobertura sanitaria.", emptyState: "Rama preparada: creá Hubs como Consorcios, Comercios, Industrias o Mineras." },
  },
  {
    id: "ventas",
    slug: "ventas",
    name: "Ventas",
    description: "Pedidos, entregas, cajas, recorridos y clientes recurrentes.",
    status: "preparada",
    icon: "📦",
    color: "#B45309",
    enabledModules: ["usuarios", "clientes", "reportes", "procesos", "productos", "pedidos", "entregas", "cobranzas"],
    reportType: "venta-reparto",
    processType: "logistica-comercial",
    hubCategories: ["reparto-recurrente"],
    mainService: "Venta y reparto recurrente",
    fields: ["productos", "pedidos", "cajas/unidades", "repartos", "recorridos", "entregas", "clientes recurrentes", "estado de cobro"],
    economicFields: ["precio por unidad", "cajas entregadas", "costo logístico", "estado de cobro", "comisión reparto"],
    states: ["pedido tomado", "armando recorrido", "en reparto", "entregado", "pendiente de cobro"],
    metrics: ["productos", "pedidos", "cajas", "paradas", "kilómetros", "cobros"],
    texts: { title: "Operación comercial y reparto", hubLabel: "Hubs de venta", nextStep: "Agrupar pedidos, armar recorridos, controlar entregas y estados de cobro.", emptyState: "Rama preparada: creá Hubs como Huevos, Verduras o Productos recurrentes." },
  },
];

export function getBranchConfig(slug?: string | null): BranchConfig {
  return BRANCHES.find((branch) => branch.slug === slug) || BRANCHES.find((branch) => branch.slug === BRANCH_DEFAULT)!;
}

export function getBranchByCategory(category?: string | null): BranchConfig {
  return BRANCHES.find((branch) => branch.hubCategories.includes(category as HubCategorySlug)) || getBranchConfig();
}

export function normalizeBranchSlug(value: unknown, category?: string | null): BranchSlug {
  const normalized = String(value || "").toLowerCase();
  const bySlug = BRANCHES.find((branch) => branch.slug === normalized || branch.name.toLowerCase() === normalized);
  if (bySlug) return bySlug.slug;
  if (["jardinerosya", "jardineria", "jardinería", "mantenimiento", "verde", "espacios verdes"].some((alias) => normalized.includes(alias))) return "mantenimiento-verde";
  if (["fumigadoresya", "fumigacion", "fumigación", "plagas", "sanitario"].some((alias) => normalized.includes(alias))) return "control-de-plagas";
  if (["comerciarya", "huevos", "ventas", "reparto", "entrega"].some((alias) => normalized.includes(alias))) return "ventas";
  return getBranchByCategory(category).slug;
}

export function getDefaultCategoryForBranch(branchSlug?: string | null): HubCategorySlug {
  return getBranchConfig(branchSlug).hubCategories[0];
}
