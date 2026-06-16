import Link from "next/link";
import { getContactos, getHubsOperativos } from "@/lib/data/hubs";
import { ContactosMesaTrabajo } from "@/components/operativo/ContactosMesaTrabajo";

export default async function OperativoPage() {
  const [hubs, contactos] = await Promise.all([getHubsOperativos(), getContactos()]);

  return (
    <main className="min-h-screen bg-[#f6f7f2] px-4 py-6 text-[#1f2a1d] sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#7a8a6d]">HubYa Operativo</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Elegí un Hub</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-[#5f6f55]">Primero elegís el Hub. Después elegís una sola herramienta: ficha, reportes, contactos o vínculos.</p>
        </header>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {hubs.map((hub) => (
            <article key={hub.id} className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black uppercase leading-tight">{hub.nombre}</h2>
              <dl className="mt-5 grid gap-3 rounded-2xl bg-[#f8faf5] p-4 text-sm">
                <div className="flex justify-between gap-3"><dt className="font-black text-[#66745c]">Vecinos</dt><dd className="font-black">{hub.cantidadClientes}</dd></div>
                <div className="flex justify-between gap-3"><dt className="font-black text-[#66745c]">Borradores</dt><dd className="font-black">{hub.cantidadReportesBorrador}</dd></div>
                <div className="flex justify-between gap-3"><dt className="font-black text-[#66745c]">Reportes guardados</dt><dd className="font-black">{hub.cantidadReportesGuardados}</dd></div>
              </dl>
              <Link href={`/operativo/hubs/${hub.slug}`} className="mt-6 block rounded-2xl bg-[#1f2a1d] px-4 py-3 text-center text-sm font-black text-white">Entrar al Hub</Link>
            </article>
          ))}
        </div>

        <ContactosMesaTrabajo hubs={hubs} contactos={contactos} />
      </section>
    </main>
  );
}
