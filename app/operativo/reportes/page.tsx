import Link from "next/link";
import { getHubsOperativos } from "@/lib/data/hubs";

export default async function ReportesGeneralesPage() {
  const hubs = await getHubsOperativos();

  return (
    <main className="min-h-screen bg-[#f6f7f2] px-4 py-6 text-[#1f2a1d] sm:px-6 lg:px-8">
      <section className="mx-auto grid max-w-6xl gap-5">
        <header className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#7a8a6d]">Reportes generales</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Reportes por Hub</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-[#5f6f55]">Acceso rápido a borradores, reportes guardados y generación de reportes sin salir de la red operativa.</p>
          <Link href="/operativo" className="mt-5 inline-flex rounded-2xl border border-[#cfd8c6] px-4 py-3 text-sm font-black">Volver a HubYa Operativo</Link>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {hubs.map((hub) => (
            <article key={hub.id} className="rounded-[2rem] border border-[#d8dfd1] bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black uppercase leading-tight">{hub.nombre}</h2>
              <p className="mt-1 text-sm font-bold text-[#66745c]">{hub.zona}</p>
              <dl className="mt-4 grid gap-2 rounded-2xl bg-[#f8faf5] p-4 text-sm">
                <div className="flex justify-between gap-3"><dt className="font-black text-[#66745c]">Borradores</dt><dd className="font-black">{hub.cantidadReportesBorrador}</dd></div>
                <div className="flex justify-between gap-3"><dt className="font-black text-[#66745c]">Reportes guardados</dt><dd className="font-black">{hub.cantidadReportesGuardados}</dd></div>
              </dl>
              <div className="mt-5 grid gap-2">
                <Link href={`/operativo/hubs/${hub.slug}/reportes`} className="rounded-2xl bg-[#1f2a1d] px-4 py-3 text-center text-sm font-black text-white">Abrir reportes</Link>
                <Link href={`/operativo/hubs/${hub.slug}/reporte`} className="rounded-2xl border border-[#cfd8c6] bg-[#f8faf5] px-4 py-3 text-center text-sm font-black text-[#1f2a1d]">Crear reporte</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
