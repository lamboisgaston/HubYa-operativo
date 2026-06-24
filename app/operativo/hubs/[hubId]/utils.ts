import { notFound } from "next/navigation";
import { getHubs, type HubPublico } from "@/lib/data/hubs";

export async function getHubOr404(hubId: string): Promise<HubPublico> {
  const hubs = await getHubs();
  const hub = hubs.find((item) => item.slug === hubId || item.id === hubId);
  if (!hub) notFound();
  return hub as HubPublico;
}
