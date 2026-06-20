import Link from "next/link";
import { getContactos, getHubsOperativos } from "@/lib/data/hubs";
import { ContactosMesaTrabajo } from "@/components/operativo/ContactosMesaTrabajo";
import { CrearHubForm } from "@/components/operativo/CrearHubForm";

export default async function OperativoPage() {
  const [hubs, contactos] = await Promise.all([getHubsOperativos(), getContactos()]);

  return (
    <main className="min-h-screen bg-[#f6f7f2] px-4 py-6 text-[#1f2a1d] sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black sm:text-4xl">HUBYA Operativo</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-[#5f6f55]">Elegí un Hub o administrá la red operativa.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/operativo/mensajes" className="rounded-2xl bg-[#1f2a1d] px-4 py-3 text-center text-sm font-black text-white">Enviar mensaje</Link>
            <Link href="/operativo/mensajes#respuestas" className="rounded-2xl border border-[#cfd8c6] bg-[#f8faf5] px-4 py-3 text-center text-sm font-black text-[#1f2a1d]">Respuestas recibidas</Link>
          </div>
        </header>

        <CrearHubForm />

        <section className="grid gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#7a8a6d]">Mis Hubs</p>
            <h2 className="mt-1 text-2xl font-black">Tarjetas de Hubs</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {hubs.map((hub) => (
              <article key={hub.id} className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm">
              <h3 className="text-2xl font-black uppercase leading-tight">{hub.nombre}</h3>
              <p className="mt-1 text-sm font-bold text-[#66745c]">{hub.zona}</p>
              <dl className="mt-5 grid gap-3 rounded-2xl bg-[#f8faf5] p-4 text-sm">
                <div className="flex justify-between gap-3"><dt className="font-black text-[#66745c]">Vecinos reales</dt><dd className="font-black">{hub.cantidadClientes}</dd></div>
                <div className="flex justify-between gap-3"><dt className="font-black text-[#66745c]">Borradores</dt><dd className="font-black">{hub.cantidadReportesBorrador}</dd></div>
                <div className="flex justify-between gap-3"><dt className="font-black text-[#66745c]">Reportes guardados</dt><dd className="font-black">{hub.cantidadReportesGuardados}</dd></div>
                <div className="flex justify-between gap-3"><dt className="font-black text-[#66745c]">Servicios activos</dt><dd className="font-black">{hub.serviciosActivos.length}</dd></div>
              </dl>
              <div className="mt-6 grid gap-2">
                <Link href={`/operativo/hubs/${hub.slug}`} className="rounded-2xl bg-[#1f2a1d] px-4 py-3 text-center text-sm font-black text-white">Entrar al Hub</Link>
                <Link href={`/hubs/${hub.slug}`} target="_blank" className="rounded-2xl border border-[#cfd8c6] bg-[#f8faf5] px-4 py-3 text-center text-sm font-black text-[#1f2a1d]">Ver web del Hub</Link>
                <Link href={`/operativo/hubs/${hub.slug}/ficha`} className="rounded-2xl border border-[#cfd8c6] px-4 py-3 text-center text-sm font-black text-[#1f2a1d]">Editar ficha</Link>
              </div>
              </article>
            ))}
          </div>
        </section>

        <div id="base-general">
          <ContactosMesaTrabajo hubs={hubs} contactos={contactos} />
        </div>
      </section>
    </main>
  );
}
