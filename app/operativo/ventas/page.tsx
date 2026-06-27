import Link from "next/link";
import { OfertaGrupalHubyaWizard } from "@/components/operativo/OfertaGrupalHubyaWizard";
import { createGroupedSalesProposalAction, updateSalesProposalPricingAction, updateSalesProposalStatusAction } from "../hubs/[hubId]/ventas/actions";
import { formatCurrency, getSalesDashboardData, summarizeSalesProposal } from "@/lib/sales/proposals";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function remainingTime(deadline: string) {
  const diff = Math.max(0, new Date(deadline).getTime() - Date.now());
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

export default async function VentasPage() {
  const { hubs, clientes, proposals } = await getSalesDashboardData();
  return <main className="min-h-screen bg-[#fff8ed] px-4 py-6 text-[#2b1705]">
    <section className="mx-auto grid max-w-4xl gap-5">
      <header className="rounded-[2rem] border border-[#f3d2a5] bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#B45309]">Rama Ventas / Huevos</p>
        <h1 className="mt-2 text-3xl font-black">Oferta grupal HUBYA</h1>
        <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-[#7c5a34]">Metodología simple: crear oferta → cargar escala → elegir Hubs → enviar → juntar respuestas → cerrar.</p>
      </header>

      <OfertaGrupalHubyaWizard hubs={hubs} action={createGroupedSalesProposalAction} />

      <section className="grid gap-4">
        <div className="rounded-[2rem] border border-[#f3d2a5] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#B45309]">Paso 5 — Recolectar respuestas</p>
          <h2 className="mt-1 text-2xl font-black">Ver respuestas</h2>
          <p className="mt-2 text-sm font-bold text-[#7c5a34]">Solo se muestran aceptación, rechazo, pendientes y tiempo restante.</p>
        </div>
        {proposals.map((proposal) => {
          const summary = summarizeSalesProposal(proposal, proposal.responses, clientes);
          const paidLinkPrice = proposal.priceScales[0]?.price || proposal.price;
          const difference = Math.max(0, paidLinkPrice - summary.finalPrice);
          const link = `${baseUrl}/propuestas/${proposal.publicLink}`;
          return <article key={proposal.id} className="rounded-[2rem] border border-[#f3d2a5] bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#B45309]">{proposal.status}</p>
            <h3 className="mt-2 text-2xl font-black">{proposal.hub?.nombre || "Hub"}</h3>
            <div className="mt-4 grid gap-3 rounded-3xl bg-[#fff8ed] p-5 text-lg font-black">
              <p>Aceptaron: {summary.acceptedCount}</p>
              <p>No aceptaron: {summary.rejectedCount}</p>
              <p>Pendientes: {summary.pendingCount}</p>
              <p>Tiempo restante: {remainingTime(proposal.responseDeadline)}</p>
              <p className="break-all text-sm text-[#7c5a34]">Link de pago: {proposal.paymentLink || "pendiente"}</p>
              <a href={link} className="text-sm text-[#B45309] underline">Link público de la oferta</a>
            </div>
            <form action={updateSalesProposalStatusAction} className="mt-4"><input type="hidden" name="proposalId" value={proposal.id} /><button name="status" value="Cerrada" className="rounded-2xl bg-[#B45309] px-5 py-3 font-black text-white">Cerrar oferta</button></form>

            <section className="mt-5 rounded-3xl border border-[#f3d2a5] p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#B45309]">Paso 6 — Cierre</p>
              <h4 className="mt-1 text-xl font-black">Confirmar cierre</h4>
              <form action={updateSalesProposalPricingAction} className="mt-4 grid gap-3 md:grid-cols-2">
                <input type="hidden" name="proposalId" value={proposal.id} />
                <input type="hidden" name="pricingMode" value="manual" />
                <p className="font-black">Participantes reales:<br /><span className="text-2xl">{summary.acceptedParticipantsCount}</span></p>
                <label className="font-black">Participantes para calcular precio<input name="pricingParticipantsCount" type="number" defaultValue={summary.pricingParticipantsCount} className="mt-1 w-full rounded-xl border border-[#f3d2a5] px-3 py-2" /></label>
                <p className="font-black">Precio aplicado:<br />{formatCurrency(summary.finalPrice)}</p>
                <p className="font-black">Precio del link de pago:<br />{formatCurrency(paidLinkPrice)}</p>
                <p className="font-black">Diferencia:<br />{formatCurrency(difference)}</p>
                <fieldset className="grid gap-2 font-black"><legend>Resolución:</legend><label><input name="pricingOverrideReason" type="radio" value="Saldo a favor" /> Saldo a favor</label><label><input name="pricingOverrideReason" type="radio" value="Bonificación con mercadería" /> Bonificación con mercadería</label></fieldset>
                <button className="rounded-2xl bg-[#B45309] px-5 py-3 font-black text-white md:col-span-2">Confirmar cierre</button>
              </form>
            </section>
          </article>;
        })}
      </section>
      <Link href="/operativo" className="justify-self-start rounded-2xl border border-[#f3d2a5] bg-white px-4 py-3 text-sm font-black">← Volver</Link>
    </section>
  </main>;
}
