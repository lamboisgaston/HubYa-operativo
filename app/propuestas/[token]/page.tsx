import { notFound } from "next/navigation";
import { formatCurrency, getSalesProposalByToken } from "@/lib/sales/proposals";
import { respondSalesProposalAction } from "./actions";
import { SalesProposalCountdown } from "@/components/SalesProposalCountdown";

function escalaTexto(min: number, max: number | null) {
  if (max === null || max >= 999) return `Más de ${min - 1} participantes`;
  return `${min} a ${max} participantes`;
}

export default async function PublicSalesProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getSalesProposalByToken(token);
  if (!data) notFound();
  const { proposal } = data;
  const isClosed = proposal.status === "Cerrada";

  return (
    <main className="min-h-screen bg-[#fff8ed] px-4 py-8 text-[#2b1705]">
      <section className="mx-auto grid max-w-xl gap-5">
        <header className="rounded-[2rem] border border-[#f3d2a5] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#B45309]">Propuesta HUBYA</p>
          <h1 className="mt-3 text-3xl font-black">Tu Hub fue invitado a participar de esta oferta grupal.</h1>
        </header>

        <section className="rounded-[2rem] border border-[#f3d2a5] bg-white p-6 shadow-sm">
          <dl className="grid gap-5 font-bold">
            <div><dt className="text-xs font-black uppercase tracking-[0.16em] text-[#B45309]">Producto</dt><dd className="mt-1 text-2xl font-black">{proposal.format} de {proposal.productName.toLowerCase()}</dd></div>
            <div><dt className="text-xs font-black uppercase tracking-[0.16em] text-[#B45309]">Entrega</dt><dd className="mt-1 text-xl font-black">{proposal.deliveryDay}</dd></div>
            <div><dt className="text-xs font-black uppercase tracking-[0.16em] text-[#B45309]">La oferta cierra en</dt><dd className="mt-1 text-3xl font-black"><SalesProposalCountdown deadline={proposal.responseDeadline} status={proposal.status} /></dd></div>
          </dl>
        </section>

        <section className="rounded-[2rem] border border-[#f3d2a5] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Escala de precios</h2>
          <div className="mt-4 grid gap-2">
            {proposal.priceScales.map((scale) => (
              <div key={`${scale.minParticipants}-${scale.maxParticipants ?? "plus"}`} className="flex items-center justify-between gap-3 rounded-2xl bg-[#fff8ed] px-4 py-3 font-black">
                <span>{escalaTexto(scale.minParticipants, scale.maxParticipants)}</span>
                <span>{formatCurrency(scale.price)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#f3d2a5] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#B45309]">Link de pago</p>
          <a href={proposal.paymentLink || "#"} className="mt-3 inline-flex rounded-2xl bg-[#B45309] px-6 py-3 font-black text-white">Pagar con Mercado Pago</a>
          <p className="mt-5 rounded-2xl bg-[#fff8ed] p-4 text-sm font-bold leading-6 text-[#7c5a34]">Mercado Pago cobra por fuera. Al cerrar la oferta, HUBYA calcula el precio final por escala. Si corresponde diferencia a favor, se informa en ficha física junto con la mercadería.</p>
        </section>

        <section className="grid gap-3 rounded-[2rem] border border-[#f3d2a5] bg-white p-6 shadow-sm">
          <form action={respondSalesProposalAction} className="grid gap-3">
            <input type="hidden" name="proposalId" value={proposal.id} />
            <input type="hidden" name="responseStatus" value="Participa" />
            <input name="customerName" required placeholder="Nombre" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
            <input name="phone" required placeholder="Teléfono" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
            <input name="address" required placeholder="Dirección" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
            <input name="quantity" type="number" min="1" defaultValue="1" placeholder="Cantidad" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
            <label className="grid gap-1 text-sm font-black text-[#7c5a34]">Horario preferido de entrega
              <select name="preferredDeliveryTime" required className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold text-[#2b1705]">
                <option value="">Elegir horario</option>
                <option value="Mañana">Mañana</option>
                <option value="Mediodía">Mediodía</option>
                <option value="Tarde">Tarde</option>
                <option value="Otro horario">Otro horario</option>
              </select>
            </label>
            <fieldset className="grid gap-2 rounded-2xl border border-[#f3d2a5] p-4 font-bold">
              <legend className="px-1 text-sm font-black text-[#B45309]">¿Vas a estar para recibir el pedido?</legend>
              <label className="flex gap-2"><input name="deliveryAvailability" type="radio" value="Sí, voy a estar" required /> Sí, voy a estar</label>
              <label className="flex gap-2"><input name="deliveryAvailability" type="radio" value="No voy a estar" /> No voy a estar</label>
            </fieldset>
            <label className="grid gap-1 text-sm font-black text-[#7c5a34]">Si no vas a estar, ¿qué hacemos?
              <select name="deliveryPreference" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold text-[#2b1705]">
                <option value="">No aplica</option>
                <option value="Dejar en portería / guardia">Dejar en portería / guardia</option>
                <option value="Dejar con vecino">Dejar con vecino</option>
                <option value="Coordinar observación">Coordinar observación</option>
                <option value="Otra indicación">Otra indicación</option>
              </select>
            </label>
            <textarea name="deliveryNotes" placeholder="Observación de entrega" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
            <button disabled={isClosed} className="rounded-2xl bg-[#B45309] px-5 py-3 font-black text-white disabled:opacity-50">Participo</button>
          </form>
          <form action={respondSalesProposalAction}>
            <input type="hidden" name="proposalId" value={proposal.id} />
            <input type="hidden" name="responseStatus" value="No participa" />
            <button disabled={isClosed} className="w-full rounded-2xl border border-[#B45309] px-5 py-3 font-black text-[#B45309] disabled:opacity-50">No participo</button>
          </form>
        </section>
      </section>
    </main>
  );
}
