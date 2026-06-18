import { redirect } from "next/navigation";

export default async function ReporteHubSingularPage({ params }: { params: Promise<{ hubId: string }> }) {
  const { hubId } = await params;
  redirect(`/operativo/hubs/${hubId}/reportes`);
}
