import Link from "next/link";
import { getHubOr404 } from "./utils";
import { HubCategoryBadge } from "@/components/hubs/HubCategoryBadge";

export default async function HubEntradaPage({ params }: { params: Promise<{ hubId: string }> }) {
  const { hubId } = await params;
  const hub = await getHubOr404(hubId);

  const acciones = hub.branchId === "ventas" ? [
    { label: "Propuestas comerciales", href: `/operativo/hubs/${hub.slug}/ventas`, helper: "Crear propuesta, compartir link, registrar respuestas y organizar entrega." },
    { label: "Ver clientes", href: `/operativo/hubs/${hub.slug}/usuarios`, helper: "Integrantes/clientes del Hub que reciben propuestas." },
  ] : [
    { label: "Ver clientes", href: `/operativo/hubs/${hub.slug}/usuarios`, helper: "Clientes, vecinos o integrantes asociados a este Hub." },
    { label: "Agregar cliente", href: `/operativo/hubs/${hub.slug}/usuarios#agregar`, helper: "Cargar un cliente o vecino nuevo en este Hub." },
    { label: "Generar reporte", href: `/operativo/hubs/${hub.slug}/reporte`, helper: "Crear un reporte simple de trabajo." },
    { label: "Ver historial", href: `/operativo/hubs/${hub.slug}/reportes`, helper: "Revisar reportes guardados y enviados." },
    { label: "Configurar Hub", href: `/operativo/hubs/${hub.slug}/ficha`, helper: "Editar ficha, equipo y parámetros cuando haga falta." },
  ];

  return (
    <main className="min-h-screen bg-[#f6f7f2] px-4 py-6 text-[#1f2a1d]">
      <section className="mx-auto grid max-w-4xl gap-5">
        <header className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#7a8a6d]">Inicio → {hub.branch.name} → {hub.nombre}</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-black">¿Qué querés hacer?</h1>
              <p className="mt-2 text-sm font-bold leading-6 text-[#66745c]">Elegí una acción. Mostramos solo el siguiente paso para que el Hub no se sienta como un panel técnico.</p>
              <div className="mt-3"><HubCategoryBadge category={hub.categoriaId} /></div>
            </div>
            <Link href={`/operativo?rama=${hub.branch.slug}`} className="rounded-2xl border border-[#cfd8c6] bg-[#f8faf5] px-4 py-3 text-center text-sm font-black">Volver a Hubs</Link>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {acciones.map((accion) => (
            <Link key={accion.href} href={accion.href} className="rounded-[2rem] border border-[#d8dfd1] bg-white p-7 shadow-sm transition hover:border-[#1f2a1d] hover:bg-[#eef2e8]">
              <h2 className="text-2xl font-black">{accion.label}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#66745c]">{accion.helper}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
