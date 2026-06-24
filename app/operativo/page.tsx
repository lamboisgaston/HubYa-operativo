import Link from "next/link";
import { getContactos, getHubsOperativos } from "@/lib/data/hubs";
import { ContactosMesaTrabajo } from "@/components/operativo/ContactosMesaTrabajo";
import { CrearHubForm } from "@/components/operativo/CrearHubForm";
import { HubyaLogo } from "@/components/HubyaLogo";

export default async function OperativoPage() {
  const [hubs, contactos] = await Promise.all([getHubsOperativos(), getContactos()]);

  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-6 text-[#0B1726] sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-[2rem] border border-[#DDE7E2] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4"><HubyaLogo className="h-14 w-auto" /><h1 className="text-3xl font-black sm:text-4xl">Operativo</h1></div>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-[#53685C]">Elegí un Hub, elegí personas, enviá una comunicación y mirá qué respondió cada una.</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <Link href="/operativo" className="rounded-2xl bg-[#1E8F4D] px-4 py-3 text-center text-sm font-black text-white">Hubs</Link>
            <Link href="#base-general" className="rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] px-4 py-3 text-center text-sm font-black text-[#0B1726]">Agregar usuario</Link>
            <Link href="#crear-hub" className="rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] px-4 py-3 text-center text-sm font-black text-[#0B1726]">Crear Hub</Link>
            <Link href="/operativo/comunicaciones" className="rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] px-4 py-3 text-center text-sm font-black text-[#0B1726]">Comunicaciones</Link>
            <Link href="/operativo/centro-respuestas" className="rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] px-4 py-3 text-center text-sm font-black text-[#0B1726]">Centro de respuestas</Link>
          </div>
        </header>

        <div id="crear-hub"><CrearHubForm /></div>

        <section className="grid gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1E8F4D]">Mis Hubs</p>
            <h2 className="mt-1 text-2xl font-black">Tarjetas de Hubs</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {hubs.map((hub) => (
              <article key={hub.id} className="rounded-[2rem] border border-[#DDE7E2] bg-white p-6 shadow-sm">
              <h3 className="text-2xl font-black uppercase leading-tight">{hub.nombre}</h3>
              <p className="mt-1 text-sm font-bold text-[#53685C]">{hub.zona}</p>
              <dl className="mt-5 grid gap-3 rounded-2xl bg-[#F8FAF7] p-4 text-sm">
                <div className="flex justify-between gap-3"><dt className="font-black text-[#53685C]">Usuarios del Hub</dt><dd className="font-black">{hub.cantidadClientes}</dd></div>
                <div className="flex justify-between gap-3"><dt className="font-black text-[#53685C]">Borradores</dt><dd className="font-black">{hub.cantidadReportesBorrador}</dd></div>
                <div className="flex justify-between gap-3"><dt className="font-black text-[#53685C]">Reportes guardados</dt><dd className="font-black">{hub.cantidadReportesGuardados}</dd></div>
                <div className="flex justify-between gap-3"><dt className="font-black text-[#53685C]">Servicios activos</dt><dd className="font-black">{hub.serviciosActivos.length}</dd></div>
              </dl>
              <div className="mt-6 grid gap-2">
                <Link href={`/operativo/hubs/${hub.slug}`} className="rounded-2xl bg-[#1E8F4D] px-4 py-3 text-center text-sm font-black text-white">Entrar al Hub</Link>
                <Link href={`/hubs/${hub.slug}`} target="_blank" className="rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] px-4 py-3 text-center text-sm font-black text-[#0B1726]">Ver web del Hub</Link>
                <Link href={`/operativo/hubs/${hub.slug}/ficha`} className="rounded-2xl border border-[#DDE7E2] px-4 py-3 text-center text-sm font-black text-[#0B1726]">Editar ficha</Link>
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
