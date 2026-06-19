import Link from "next/link";
import { MensajesYRespuestasPanel } from "@/components/operativo/mensajes/MensajesYRespuestasPanel";
import { getMensajesResumen } from "@/lib/data/mensajes";
import { getParameterResponses } from "@/lib/data/parameterResponses";

export default async function MensajesOperativoPage() {
  const resumen = await getMensajesResumen();
  const parameterResponses = await getParameterResponses();
  return (
    <main className="min-h-screen bg-[#f6f7f2] px-4 py-6 text-[#1f2a1d]">
      <div className="mx-auto grid max-w-7xl gap-5">
        <Link href="/operativo" className="w-fit rounded-2xl border border-[#cfd8c6] bg-white px-4 py-3 text-sm font-black">Volver a operativo</Link>
        <MensajesYRespuestasPanel {...resumen} parameterResponses={parameterResponses} />
      </div>
    </main>
  );
}
