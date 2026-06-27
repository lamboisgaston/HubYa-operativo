import type { HubPublico } from "@/lib/data/hubs";
import { getHubCategoryConfig } from "@/lib/hubs/getHubCategoryConfig";
import { MantenimientoResumen } from "./categories/mantenimiento/MantenimientoResumen";
import { FumigacionResumen } from "./categories/fumigacion/FumigacionResumen";
import { RepartoResumen } from "./categories/reparto/RepartoResumen";
import { HubGenericoResumen } from "./categories/generico/HubGenericoResumen";

export function HubCategorySummary({ hub }: { hub: HubPublico }) {
  const config = getHubCategoryConfig(hub.categoriaId);
  if (config.slug === "mantenimiento-espacios-verdes") return <MantenimientoResumen hub={hub} />;
  if (config.slug === "fumigacion-control-plagas") return <FumigacionResumen hub={hub} />;
  if (config.slug === "reparto-recurrente") return <RepartoResumen hub={hub} />;
  return <HubGenericoResumen hub={hub} />;
}
