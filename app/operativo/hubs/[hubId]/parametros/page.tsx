import { HubNav } from "../HubNav";
import { getHubOr404 } from "../utils";
import { HubParametrosOperativosEditor } from "@/components/operativo/HubParametrosOperativosEditor";
import { HubParameterSuggestions } from "@/components/operativo/HubParameterSuggestions";
import { getParameterResponses } from "@/lib/data/parameterResponses";
import { getMensajesResumen } from "@/lib/data/mensajes";

export default async function ParametrosOperativosHubPage({ params }: { params: Promise<{ hubId: string }> }) {
  const { hubId } = await params;
  const hub = await getHubOr404(hubId);
  const parameterResponses = await getParameterResponses(hub.id);
  const resumenMensajes = await getMensajesResumen(hub.id);

  return (
    <main className="min-h-screen bg-[#f6f7f2] px-4 py-6 text-[#1f2a1d]">
      <div className="mx-auto grid max-w-6xl gap-5">
        <HubNav hub={hub} active="parametros" />
        <HubParametrosOperativosEditor hub={hub} />
        <HubParameterSuggestions hub={hub} contactos={resumenMensajes.contactos} respuestas={parameterResponses} />
      </div>
    </main>
  );
}
