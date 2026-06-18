import { HubNav } from "../HubNav";
import { getHubOr404 } from "../utils";
import { HubInformacionImportanteEditor } from "@/components/operativo/HubInformacionImportanteEditor";
import { HubParametrosOperativosEditor } from "@/components/operativo/HubParametrosOperativosEditor";

export default async function FichaHubPage({ params }: { params: Promise<{ hubId: string }> }) {
  const { hubId } = await params;
  const hub = await getHubOr404(hubId);
  const activos = hub.servicios.map((servicio) => servicio.vinculoActivo).filter(Boolean);
  const postulantes = hub.servicios.flatMap((servicio) => servicio.postulantes);
  const paisajistas = activos.filter((vinculo) => /paisaj/i.test(`${vinculo?.oferta_nombre} ${vinculo?.responsable} ${vinculo?.observaciones}`));
  const viveros = activos.filter((vinculo) => /viver/i.test(`${vinculo?.oferta_nombre} ${vinculo?.responsable} ${vinculo?.observaciones}`));

  return (
    <main className="min-h-screen bg-[#f6f7f2] px-4 py-6 text-[#1f2a1d]">
      <div className="mx-auto grid max-w-6xl gap-5">
        <HubNav hub={hub} active="ficha" />
        <section className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#7a8a6d]">Ficha del Hub</p><h2 className="mt-1 text-2xl font-black">{hub.nombre}</h2></div>
            <div className="flex flex-wrap gap-2"><button className="rounded-2xl bg-[#1f2a1d] px-4 py-3 text-sm font-black text-white">Editar ficha</button><button className="rounded-2xl border border-[#cfd8c6] bg-[#f8faf5] px-4 py-3 text-sm font-black">Agregar integrante</button></div>
          </div>
          <dl className="mt-6 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl bg-[#f8faf5] p-4"><dt className="font-black text-[#66745c]">Nombre del Hub</dt><dd className="mt-1 font-black">{hub.nombre}</dd></div>
            <div className="rounded-2xl bg-[#f8faf5] p-4"><dt className="font-black text-[#66745c]">Ciudad / zona</dt><dd className="mt-1 font-black">{hub.zona}</dd></div>
            <div className="rounded-2xl bg-[#f8faf5] p-4"><dt className="font-black text-[#66745c]">Vecinos</dt><dd className="mt-1 font-black">{hub.clientesActivos}</dd></div>
            <div className="rounded-2xl bg-[#f8faf5] p-4"><dt className="font-black text-[#66745c]">Capacidad operativa referencial</dt><dd className="mt-1 font-black">{Math.max(1, Math.ceil(hub.clientesActivos / 12))} persona estable</dd></div>
            <div className="rounded-2xl bg-[#f8faf5] p-4"><dt className="font-black text-[#66745c]">Estabilidad operativa</dt><dd className="mt-1 font-black">{hub.clientesActivos ? "Operativa" : "Sin datos reales"}</dd></div>
            <div className="rounded-2xl bg-[#f8faf5] p-4"><dt className="font-black text-[#66745c]">Servicios activos</dt><dd className="mt-1 font-black">{hub.servicios.filter((servicio) => servicio.activo).length}</dd></div>
            <div className="rounded-2xl bg-[#f8faf5] p-4"><dt className="font-black text-[#66745c]">Abastecimiento de demanda</dt><dd className="mt-1 font-black">{activos.length} activos</dd></div>
            <div className="rounded-2xl bg-[#f8faf5] p-4"><dt className="font-black text-[#66745c]">Paisajistas</dt><dd className="mt-1 font-black">{paisajistas.length}</dd></div>
            <div className="rounded-2xl bg-[#f8faf5] p-4"><dt className="font-black text-[#66745c]">Viveros</dt><dd className="mt-1 font-black">{viveros.length}</dd></div>
            <div className="rounded-2xl bg-[#f8faf5] p-4"><dt className="font-black text-[#66745c]">Postulantes</dt><dd className="mt-1 font-black">{postulantes.length}</dd></div>
          </dl>
        </section>
        <HubParametrosOperativosEditor hub={hub} />
        <HubInformacionImportanteEditor hubSlug={hub.slug} informacion={hub.informacionImportante} />

        <section className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Integrantes y perfiles</h2>
          <div className="mt-4 grid gap-3">
            {[...activos, ...postulantes].map((integrante) => integrante && <article key={integrante.id} className="flex flex-col gap-3 rounded-2xl bg-[#f8faf5] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black">{integrante.oferta_nombre}</p><p className="text-sm font-bold text-[#66745c]">{integrante.estado} · {integrante.responsable}</p></div><div className="flex gap-2"><button className="rounded-xl border px-3 py-2 text-xs font-black">Remover</button><button className="rounded-xl border px-3 py-2 text-xs font-black">Ver perfil</button></div></article>)}
          </div>
        </section>
      </div>
    </main>
  );
}
