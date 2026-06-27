import { getHubCategoryConfig } from "@/lib/hubs/getHubCategoryConfig";

export function HubCategoryBadge({ category }: { category?: string | null }) {
  const config = getHubCategoryConfig(category);
  return (
    <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-black" style={{ borderColor: config.visual.borde, backgroundColor: config.visual.fondo, color: config.visual.color }}>
      {config.visual.etiqueta}
    </span>
  );
}
