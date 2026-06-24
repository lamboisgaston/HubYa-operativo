import Link from "next/link";
import { getContactos, getHubsOperativos } from "@/lib/data/hubs";
import { ContactosMesaTrabajo } from "@/components/operativo/ContactosMesaTrabajo";
import { CrearHubForm } from "@/components/operativo/CrearHubForm";
import { HubyaLogo } from "@/components/HubyaLogo";
import { HubCard } from "@/components/HubCard";

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
            {hubs.map((hub) => <HubCard key={hub.id} hub={hub} operativo />)}
          </div>
        </section>

        <div id="base-general">
          <ContactosMesaTrabajo hubs={hubs} contactos={contactos} />
        </div>
      </section>
    </main>
  );
}
