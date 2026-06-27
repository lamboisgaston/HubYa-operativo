import Link from "next/link";
import { getHubDetalle } from "@/lib/data/hubs";
import { getHubOr404 } from "./utils";
import { HubCategoryBadge } from "@/components/hubs/HubCategoryBadge";
import { HubCategorySummary } from "@/components/hubs/HubCategorySummary";
import { getHubCategoryConfig } from "@/lib/hubs/getHubCategoryConfig";

export default async function HubEntradaPage({ params }: { params: Promise<{ hubId: string }> }) {
  const { hubId } = await params;
  const hub = await getHubOr404(hubId);
  const detalle = await getHubDetalle(hub.id);
  const serviciosActivos = hub.servicios.filter((servicio) => servicio.activo).length;
  const categoria = getHubCategoryConfig(hub.categoriaId);

  return (
    <main className="min-h-screen bg-[#f6f7f2] px-4 py-6 text-[#1f2a1d]">
      <section className="mx-auto grid max-w-5xl gap-5">
        <header className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#7a8a6d]">Hub seleccionado: {hub.nombre}</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-black">¿Qué querés hacer?</h1>
              <p className="mt-1 text-sm font-bold text-[#66745c]">Todo lo del Hub en una sola estructura, con reportes, formularios y procesos según categoría.</p>
              <div className="mt-3"><HubCategoryBadge category={hub.categoriaId} /></div>
            </div>
            <Link href="/operativo" className="rounded-2xl border border-[#cfd8c6] bg-[#f8faf5] px-4 py-3 text-center text-sm font-black">Volver a mis Hubs</Link>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Ficha", "ficha"],
            ["Usuarios", "usuarios"],
            ["Hub Operativo", "ficha#hub-operativo"],
            ["Reportes", "reportes"],
            ["Comunicaciones", "comunicaciones"],
            ["Respuestas", "respuestas"],
            ["Parámetros", "parametros"],
          ].map(([label, path]) => (
            <Link key={path} href={`/operativo/hubs/${hub.slug}/${path}`} className="rounded-[2rem] border border-[#d8dfd1] bg-white p-8 text-center text-2xl font-black shadow-sm transition hover:border-[#1f2a1d] hover:bg-[#eef2e8]">
              {label}
            </Link>
          ))}
        </div>

        <section className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Resumen simple · {categoria.nombre}</h2>
          <HubCategorySummary hub={hub} />
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl bg-[#f8faf5] p-4"><dt className="font-black text-[#66745c]">Usuarios</dt><dd className="text-2xl font-black">{hub.clientesActivos}</dd></div>
            <div className="rounded-2xl bg-[#f8faf5] p-4"><dt className="font-black text-[#66745c]">Borradores</dt><dd className="text-2xl font-black">{detalle?.reportesBorrador.length ?? 0}</dd></div>
            <div className="rounded-2xl bg-[#f8faf5] p-4"><dt className="font-black text-[#66745c]">Reportes guardados</dt><dd className="text-2xl font-black">{(detalle?.reportesGuardados.length ?? 0) + (detalle?.reportesEnviados.length ?? 0)}</dd></div>
            <div className="rounded-2xl bg-[#f8faf5] p-4"><dt className="font-black text-[#66745c]">Tipo de reporte</dt><dd className="text-2xl font-black capitalize">{categoria.tipoReporte}</dd></div>
            <div className="rounded-2xl bg-[#f8faf5] p-4"><dt className="font-black text-[#66745c]">Servicios activos</dt><dd className="text-2xl font-black">{serviciosActivos}</dd></div>
            <div className="rounded-2xl bg-[#f8faf5] p-4"><dt className="font-black text-[#66745c]">Estabilidad operativa</dt><dd className="font-black">{detalle?.estabilidadOperativa ?? "Sin datos"}</dd></div>
          </dl>
        </section>
      </section>
    </main>
  );
}
