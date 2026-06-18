import { MensajesYRespuestasPanel } from "@/components/operativo/mensajes/MensajesYRespuestasPanel";
import { getMensajesResumen } from "@/lib/data/mensajes";
import { HubNav } from "../HubNav";
import { getHubOr404 } from "../utils";

export default async function MensajesHubPage({ params }: { params: Promise<{ hubId: string }> }) {
  const { hubId } = await params;
  const hub = await getHubOr404(hubId);
  const resumen = await getMensajesResumen(hub.id);
  return (
    <main className="min-h-screen bg-[#f6f7f2] px-4 py-6 text-[#1f2a1d]">
      <div className="mx-auto grid max-w-7xl gap-5">
        <HubNav hub={hub} active="mensajes" />
        <MensajesYRespuestasPanel {...resumen} hubActual={hub} />
      </div>
    </main>
  );
}
