import Link from "next/link";
import { getClientesByHubId } from "@/lib/data/hubs";
import { getHubOr404 } from "../utils";
import { createSalesProposalAction, formatCurrency, getSalesProposalsByHub, summarizeSalesProposal, updateSalesProposalStatusAction } from "@/lib/sales/proposals";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default async function VentasHubPage({ params }: { params: Promise<{ hubId: string }> }) {
  const { hubId } = await params;
  const hub = await getHubOr404(hubId);
  const [proposals, clientes] = await Promise.all([getSalesProposalsByHub(hub.id), getClientesByHubId(hub.id)]);

  return (
    <main className="min-h-screen bg-[#fff8ed] px-4 py-6 text-[#2b1705]">
      <section className="mx-auto grid max-w-6xl gap-5">
        <header className="rounded-[2rem] border border-[#f3d2a5] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#B45309]">Rama Ventas → {hub.nombre}</p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black">Hub de Huevos por propuestas comerciales</h1>
              <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-[#7c5a34]">Este espacio no usa reportes de mantenimiento verde ni lógica sanitaria. Trabaja con productos, propuestas, aceptación/rechazo, entregas, cobros y links compartibles.</p>
            </div>
            <Link href={`/operativo?rama=ventas`} className="rounded-2xl border border-[#f3d2a5] bg-[#fff8ed] px-4 py-3 text-center text-sm font-black">Volver a Ventas</Link>
          </div>
        </header>

        <section className="rounded-[2rem] border border-[#f3d2a5] bg-white p-6 shadow-sm" id="crear">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#B45309]">Crear propuesta</p>
          <h2 className="mt-2 text-2xl font-black">Nueva propuesta para compartir</h2>
          <form action={createSalesProposalAction} className="mt-5 grid gap-3 md:grid-cols-2">
            <input type="hidden" name="hubId" value={hub.id} />
            <input name="title" placeholder="Título: Media caja de huevos" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
            <input name="productName" defaultValue="Huevos" placeholder="Producto" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
            <input name="format" defaultValue="Media caja" placeholder="Formato" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
            <input name="price" defaultValue="45000" placeholder="Precio" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
            <input name="deliveryDay" defaultValue="Miércoles" placeholder="Día de entrega" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
            <input name="deliveryMode" defaultValue="Envío a domicilio" placeholder="Modalidad de envío" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
            <input name="responseDeadline" type="date" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
            <textarea name="notes" placeholder="Observaciones" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold md:col-span-2" />
            <button className="rounded-2xl bg-[#B45309] px-5 py-3 font-black text-white md:col-span-2">Generar link de propuesta</button>
          </form>
        </section>

        <section className="grid gap-4">
          {proposals.length === 0 ? <p className="rounded-[2rem] border border-dashed border-[#f3d2a5] bg-white p-6 font-bold text-[#7c5a34]">Todavía no hay propuestas comerciales para este Hub.</p> : proposals.map((proposal) => {
            const summary = summarizeSalesProposal(proposal, proposal.responses, clientes);
            const link = `${baseUrl}/propuestas/${proposal.publicLink}`;
            return <article key={proposal.id} className="rounded-[2rem] border border-[#f3d2a5] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#B45309]">Estado: {proposal.status}</p>
                  <h2 className="mt-2 text-2xl font-black">{proposal.title}</h2>
                  <p className="mt-2 font-bold text-[#7c5a34]">{proposal.format} · {formatCurrency(proposal.price)} · Entrega: {proposal.deliveryDay} · {proposal.deliveryMode}</p>
                  <p className="mt-2 break-all rounded-2xl bg-[#fff8ed] p-3 text-sm font-black">Link: {link}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[["Aceptaron", summary.acceptedCount], ["No aceptaron", summary.rejectedCount], ["Pendientes", summary.pendingCount], ["Total vendido", `${summary.totalQuantity} ${proposal.format}`], ["Total a cobrar", formatCurrency(summary.totalToCollect)]].map(([label, value]) => <div key={label} className="rounded-2xl bg-[#fff8ed] p-4"><p className="text-xs font-black uppercase text-[#B45309]">{label}</p><p className="text-xl font-black">{value}</p></div>)}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-sm font-black">
                <a href={link} className="rounded-xl bg-[#B45309] px-4 py-3 text-white">Abrir / copiar link</a>
                <form action={updateSalesProposalStatusAction}><input type="hidden" name="proposalId" value={proposal.id} /><button name="status" value="Cerrada" className="rounded-xl border border-[#f3d2a5] px-4 py-3">Cerrar propuesta</button></form>
                <form action={updateSalesProposalStatusAction}><input type="hidden" name="proposalId" value={proposal.id} /><button name="status" value="Entregada" className="rounded-xl border border-[#f3d2a5] px-4 py-3">Marcar entregado</button></form>
                <span className="rounded-xl border border-[#f3d2a5] px-4 py-3">Ver aceptados</span><span className="rounded-xl border border-[#f3d2a5] px-4 py-3">Ver rechazados</span><span className="rounded-xl border border-[#f3d2a5] px-4 py-3">Generar hoja de reparto</span>
              </div>
            </article>;
          })}
        </section>
      </section>
    </main>
  );
}
