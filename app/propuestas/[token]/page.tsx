import { notFound } from "next/navigation";
import { formatCurrency, getSalesProposalByToken } from "@/lib/sales/proposals";
import { respondSalesProposalAction } from "./actions";

function escalaTexto(min: number, max: number | null) {
  if (max === null) return `+${min - 1} participantes`;
  return `${min} a ${max} participantes`;
}

export default async function PublicSalesProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getSalesProposalByToken(token);
  if (!data) notFound();
  const { proposal, hub } = data;

  return (
    <main className="min-h-screen bg-[#fff8ed] px-4 py-8 text-[#2b1705]">
      <section className="mx-auto grid max-w-xl gap-5">
        <header className="rounded-[2rem] border border-[#f3d2a5] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#B45309]">Propuesta HUBYA</p>
          <h1 className="mt-3 text-3xl font-black">{proposal.title || "Huevos a domicilio — Entrega miércoles"}</h1>
          <p className="mt-3 text-lg font-black">Tu Hub tiene {hub?.clientesActivos || 0} usuarios.</p>
        </header>

        <section className="rounded-[2rem] border border-[#f3d2a5] bg-white p-6 shadow-sm">
          <dl className="grid gap-4 text-base font-bold">
            <div>
              <dt className="text-xs font-black uppercase tracking-[0.16em] text-[#B45309]">Producto</dt>
              <dd className="mt-1 text-2xl font-black">{proposal.productName || proposal.format}</dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase tracking-[0.16em] text-[#B45309]">Precio inicial de pago</dt>
              <dd className="mt-1 text-2xl font-black">{formatCurrency(proposal.price)}</dd>
            </div>
            <div>
              <dt className="text-xs font-black uppercase tracking-[0.16em] text-[#B45309]">Entrega</dt>
              <dd className="mt-1">{proposal.deliveryMode} — {proposal.deliveryDay}</dd>
            </div>
          </dl>

          <a href="#aceptar" className="mt-6 block rounded-2xl bg-[#B45309] px-5 py-3 text-center font-black text-white">Pagar propuesta</a>

          <div className="mt-6 rounded-3xl bg-[#fff8ed] p-5">
            <h2 className="text-lg font-black">Escala de precio grupal</h2>
            <div className="mt-4 grid gap-2">
              {proposal.priceScales.map((scale) => (
                <div key={`${scale.minParticipants}-${scale.maxParticipants ?? "plus"}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 font-black">
                  <span>{escalaTexto(scale.minParticipants, scale.maxParticipants)}</span>
                  <span>{formatCurrency(scale.price)}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-5 rounded-2xl border border-[#f3d2a5] p-4 text-sm font-bold leading-6 text-[#7c5a34]">
            {proposal.notes || "Si el Hub alcanza una escala mejor, la diferencia queda acreditada o se bonifica con mercadería."}
          </p>
        </section>

        <section id="aceptar" className="rounded-[2rem] border border-[#f3d2a5] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">Respuesta</h2>
          <div className="mt-5 grid gap-4">
            <form action={respondSalesProposalAction} className="grid gap-3 rounded-3xl bg-[#fff8ed] p-5">
              <input type="hidden" name="proposalId" value={proposal.id} />
              <input type="hidden" name="responseStatus" value="Aceptó" />
              <input name="customerName" required placeholder="Nombre" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
              <input name="phone" required placeholder="Teléfono" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
              <input name="address" required placeholder="Dirección" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
              <input name="quantity" type="number" min="1" defaultValue="1" placeholder="Cantidad" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
              <textarea name="notes" placeholder="Observaciones" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
              <button className="rounded-2xl bg-[#B45309] px-5 py-3 font-black text-white">Acepto participar</button>
            </form>
            <form action={respondSalesProposalAction} className="rounded-3xl border border-[#f3d2a5] p-5">
              <input type="hidden" name="proposalId" value={proposal.id} />
              <input type="hidden" name="responseStatus" value="No aceptó" />
              <input name="customerName" placeholder="Nombre (opcional)" className="mb-3 w-full rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
              <button className="w-full rounded-2xl border border-[#B45309] px-5 py-3 font-black text-[#B45309]">No participo</button>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}
