import { HUB_CATEGORIES, HUB_CATEGORY_DEFAULT, type HubCategoryConfig, type HubCategorySlug } from "./hubCategories";

export function isHubCategorySlug(value: unknown): value is HubCategorySlug {
  return HUB_CATEGORIES.some((category) => category.slug === value);
}

export function getHubCategoryConfig(category?: string | null): HubCategoryConfig {
  return HUB_CATEGORIES.find((item) => item.slug === category) || HUB_CATEGORIES.find((item) => item.slug === HUB_CATEGORY_DEFAULT)!;
}

export function normalizeHubCategory(value: unknown): HubCategorySlug {
  if (isHubCategorySlug(value)) return value;
  const normalizado = String(value || "").toLowerCase();
  if (["jardinerosya", "jardineria", "jardinería", "mantenimiento", "espacios verdes"].some((alias) => normalizado.includes(alias))) return "mantenimiento-espacios-verdes";
  if (["fumigadoresya", "fumigacion", "fumigación", "plagas"].some((alias) => normalizado.includes(alias))) return "fumigacion-control-plagas";
  if (["comerciarya", "huevos", "reparto", "entrega"].some((alias) => normalizado.includes(alias))) return "reparto-recurrente";
  if (["tecnico", "técnico", "pileterosya"].some((alias) => normalizado.includes(alias))) return "servicios-tecnicos";
  return HUB_CATEGORY_DEFAULT;
}
