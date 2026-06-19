import { getClientesByHubId } from "@/lib/data/hubs";
import { TarifaClienteSelect } from "@/components/operativo/TarifaClienteSelect";
import { HubNav } from "../HubNav";
import { getHubOr404 } from "../utils";


export default async function ContactosHubPage({ params }: { params: Promise<{ hubId: string }> }) {
  const { hubId } = await params;
  const hub = await getHubOr404(hubId);
  const clientes = await getClientesByHubId(hub.id);

  return (
    <main className="min-h-screen bg-[#f6f7f2] px-4 py-6 text-[#1f2a1d]">
      <div className="mx-auto grid max-w-7xl gap-5">
        <HubNav hub={hub} active="contactos" />
        <section className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#7a8a6d]">Contactos del Hub</p>
              <h2 className="mt-1 text-2xl font-black">Contactos</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-2xl bg-[#1f2a1d] px-4 py-3 text-sm font-black text-white">Agregar contacto</button>
              <button className="rounded-2xl border border-[#cfd8c6] bg-[#f8faf5] px-4 py-3 text-sm font-black">Importar contactos</button>
            </div>
          </div>
          <label className="mt-5 grid gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#66745c]">Buscador
            <input placeholder="Buscar por nombre, email, WhatsApp o tipo" className="h-12 rounded-2xl border border-[#cfd8c6] bg-[#f8faf5] px-4 text-sm font-semibold normal-case outline-none" />
          </label>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-[#d8dfd1]">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-[#f1f4ec] text-left text-xs uppercase text-[#66745c]"><tr><th className="border p-3">Nombre</th><th className="border p-3">Email</th><th className="border p-3">WhatsApp</th><th className="border p-3">Tipo</th><th className="border p-3">Tarifa del cliente</th><th className="border p-3">Hub asignado</th><th className="border p-3">Editar</th><th className="border p-3">Eliminar</th></tr></thead>
              <tbody>{clientes.length === 0 ? <tr><td colSpan={8} className="border p-6 text-center font-bold text-[#66745c]">Sin contactos cargados para este Hub.</td></tr> : clientes.map((cliente) => <tr key={cliente.id}><td className="border p-3 font-black">{cliente.nombre}</td><td className="border p-3">{cliente.email || "—"}</td><td className="border p-3">{cliente.whatsapp || "—"}</td><td className="border p-3">Vecino</td><td className="border p-3"><TarifaClienteSelect contactoId={cliente.id} tarifaInicial={cliente.tarifaCliente} /></td><td className="border p-3">{hub.nombre}</td><td className="border p-3"><button className="font-black text-[#1f2a1d]">Editar</button></td><td className="border p-3"><button className="font-black text-[#743c3c]">Eliminar</button></td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
