import { notFound } from "next/navigation";
import { getHubs } from "@/lib/data/hubs";

export async function getHubOr404(hubId: string) {
  const hubs = await getHubs();
  const hub = hubs.find((item) => item.slug === hubId || item.id === hubId);
  if (!hub) notFound();
  return hub;
}
