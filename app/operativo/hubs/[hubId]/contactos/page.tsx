import { getContactos, getHubsOperativos } from "@/lib/data/hubs";
import { ContactosMesaTrabajo } from "@/components/operativo/ContactosMesaTrabajo";
import { HubNav } from "../HubNav";
import { getHubOr404 } from "../utils";

export default async function ContactosHubPage({ params }: { params: Promise<{ hubId: string }> }) {
  const { hubId } = await params;
  const hub = await getHubOr404(hubId);
  const [hubs, contactos] = await Promise.all([getHubsOperativos(), getContactos()]);
  const contactosHub = contactos.filter((contacto) => contacto.hubId === hub.id);

  return (
    <main className="min-h-screen bg-[#f6f7f2] px-4 py-6 text-[#1f2a1d]">
      <div className="mx-auto grid max-w-7xl gap-5">
        <HubNav hub={hub} active="contactos" />
        <ContactosMesaTrabajo hubs={hubs} contactos={contactosHub} hubFijoId={hub.id} />
      </div>
    </main>
  );
}
