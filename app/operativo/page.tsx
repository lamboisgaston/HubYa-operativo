import Link from "next/link";
import { getHubsOperativos } from "@/lib/data/hubs";

export default async function OperativoPage() {
  const hubs = await getHubsOperativos();

  return (
    <main className="min-h-screen bg-[#f6f7f2] px-4 py-6 text-[#1f2a1d] sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#7a8a6d]">HubYa Operativo</p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black sm:text-4xl">Mis Hubs</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold text-[#5f6f55]">
                Una sola fuente de verdad: la web pública y el operativo leen la misma ficha de Hub, clientes,
                servicios y reportes disponibles en la base real.
              </p>
            </div>
            <Link href="/operativo/contactos" className="rounded-2xl border border-[#cfd8c6] bg-[#f8faf5] px-5 py-3 text-center text-sm font-black text-[#1f2a1d]">
              Contactos generales
            </Link>
          </div>
        </header>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {hubs.map((hub) => {
            const serviciosActivos = hub.serviciosActivos;
            const resolutorPrincipal = serviciosActivos.find((servicio) => servicio.vinculoActivo)?.vinculoActivo?.oferta_nombre || hub.equipoOperativo || "Sin asignar";
            return (
              <article key={hub.id} className="flex min-h-[390px] flex-col rounded-[2rem] border border-[#d8dfd1] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black uppercase leading-tight">{hub.nombre}</h2>
                    <p className="mt-1 text-sm font-bold text-[#6b7a60]">{hub.zona}</p>
                  </div>
                  <span className="rounded-full bg-[#eaf2df] px-3 py-1 text-[11px] font-black uppercase text-[#486136]">{hub.estado}</span>
                </div>

                <dl className="mt-5 grid gap-3 rounded-2xl bg-[#f8faf5] p-4 text-sm">
                  <div className="flex justify-between gap-3"><dt className="font-black text-[#66745c]">Vecinos</dt><dd className="font-black">{hub.cantidadClientes}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="font-black text-[#66745c]">Borradores</dt><dd className="font-black">{hub.cantidadReportesBorrador}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="font-black text-[#66745c]">Reportes guardados</dt><dd className="font-black">{hub.cantidadReportesGuardados}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="font-black text-[#66745c]">Estabilidad</dt><dd className="font-black text-right">{hub.estabilidadOperativa}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="font-black text-[#66745c]">Abastece</dt><dd className="font-black text-right">{resolutorPrincipal}</dd></div>
                </dl>

                <div className="mt-5 flex-1">
                  <h3 className="text-xs font-black uppercase tracking-[0.18em] text-[#7a8a6d]">Servicios activos</h3>
                  <ul className="mt-2 space-y-2 text-sm font-bold text-[#31402c]">
                    {serviciosActivos.length ? serviciosActivos.map((servicio) => <li key={servicio.id}>• {servicio.nombre_servicio}</li>) : <li>• Sin servicios cargados</li>}
                  </ul>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Link href={`/operativo/hubs/${hub.slug}/ficha`} className="rounded-2xl bg-[#1f2a1d] px-4 py-3 text-center text-sm font-black text-white">Entrar al Hub</Link>
                  <Link href={`/hubs/${hub.slug}`} className="rounded-2xl border border-[#cfd8c6] bg-white px-4 py-3 text-center text-sm font-black text-[#1f2a1d]">Ver web pública</Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
