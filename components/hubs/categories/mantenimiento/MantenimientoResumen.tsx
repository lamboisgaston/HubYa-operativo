import type { HubPublico } from "@/lib/data/hubs";
import { getHubCategoryConfig } from "@/lib/hubs/getHubCategoryConfig";

export function MantenimientoResumen({ hub }: { hub: HubPublico }) {
  const config = getHubCategoryConfig(hub.categoriaId);
  return <p className="mt-2 text-sm font-bold text-[#66745c]">{config.textos.parametrosDescripcion}</p>;
}
