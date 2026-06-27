import Link from "next/link";
import { getClientesByHubId } from "@/lib/data/hubs";
import { getHubOr404 } from "../utils";
import { formatCurrency, getSalesProposalsByHub, summarizeSalesProposal } from "@/lib/sales/proposals";
import { createSalesProposalAction, updateSalesProposalStatusAction } from "./actions";

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
              <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-[#7c5a34]">Este Hub funciona por propuestas comerciales al Hub: producto, escala de precio, participación, datos de entrega y links compartibles. No mezcla reportes de mantenimiento verde ni control de plagas.</p>
            </div>
            <Link href="/operativo?rama=ventas" className="rounded-2xl border border-[#f3d2a5] bg-[#fff8ed] px-4 py-3 text-center text-sm font-black">Volver a Ventas</Link>
          </div>
        </header>

        <section className="rounded-[2rem] border border-[#f3d2a5] bg-white p-6 shadow-sm" id="crear">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#B45309]">Crear propuesta</p>
          <h2 className="mt-2 text-2xl font-black">Nueva propuesta para compartir</h2>
          <form action={createSalesProposalAction} className="mt-5 grid gap-3 md:grid-cols-2">
            <input type="hidden" name="hubId" value={hub.id} />
            <input name="title" defaultValue="Huevos a domicilio — Entrega miércoles" placeholder="Título: Media caja de huevos" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
            <input name="productName" defaultValue="Media caja de huevos" placeholder="Producto" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
            <input name="format" defaultValue="Media caja" placeholder="Formato" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
            <input name="price" defaultValue="45000" placeholder="Precio base / respaldo" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
            <input name="deliveryDay" defaultValue="Miércoles" placeholder="Día de entrega" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
            <input name="deliveryMode" defaultValue="Entrega a domicilio" placeholder="Modalidad de envío" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
            <input name="paymentLink" defaultValue="https://www.mercadopago.com.ar/link-de-pago-demo-hubya" placeholder="Link de pago editable" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
            <input name="countdownHours" type="number" min="1" defaultValue="5" placeholder="Horas abierta (ej: 5)" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
            <div className="grid gap-2 rounded-2xl border border-[#f3d2a5] bg-[#fff8ed] p-4 md:col-span-2">
              <p className="text-sm font-black text-[#B45309]">Escala de precios por participantes</p>
              <div className="grid gap-2 md:grid-cols-4">
                <label className="grid gap-1 text-xs font-black uppercase text-[#7c5a34]">1 a 5<input type="hidden" name="scale0Min" value="1" /><input type="hidden" name="scale0Max" value="5" /><input name="scale0Price" defaultValue="45000" className="rounded-xl border border-[#f3d2a5] px-3 py-2 text-base text-[#2b1705]" /></label>
                <label className="grid gap-1 text-xs font-black uppercase text-[#7c5a34]">6 a 10<input type="hidden" name="scale1Min" value="6" /><input type="hidden" name="scale1Max" value="10" /><input name="scale1Price" defaultValue="42000" className="rounded-xl border border-[#f3d2a5] px-3 py-2 text-base text-[#2b1705]" /></label>
                <label className="grid gap-1 text-xs font-black uppercase text-[#7c5a34]">11 a 30<input type="hidden" name="scale2Min" value="11" /><input type="hidden" name="scale2Max" value="30" /><input name="scale2Price" defaultValue="39000" className="rounded-xl border border-[#f3d2a5] px-3 py-2 text-base text-[#2b1705]" /></label>
                <label className="grid gap-1 text-xs font-black uppercase text-[#7c5a34]">+30<input type="hidden" name="scale3Min" value="31" /><input type="hidden" name="scale3Max" value="" /><input name="scale3Price" defaultValue="37000" className="rounded-xl border border-[#f3d2a5] px-3 py-2 text-base text-[#2b1705]" /></label>
              </div>
            </div>
            <textarea name="notes" defaultValue="Si el Hub alcanza una escala mejor, la diferencia a favor se informa en ficha física junto con la mercadería." placeholder="Observaciones" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold md:col-span-2" />
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
                  <p className="mt-2 font-bold text-[#7c5a34]">{proposal.productName} · {proposal.format} · {formatCurrency(proposal.price)} · Entrega: {proposal.deliveryDay} · {proposal.deliveryMode}</p>
                  <p className="mt-1 font-bold text-[#7c5a34]">Cierre: {new Date(proposal.responseDeadline).toLocaleString("es-AR")} · Cuenta regresiva inicial: {proposal.countdownHours} horas</p>
                  <p className="mt-2 break-all rounded-2xl bg-[#fff8ed] p-3 text-sm font-black">Link compartible: {link}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[["Participan", summary.acceptedCount], ["No participan", summary.rejectedCount], ["Pendientes", summary.pendingCount], ["Participantes para precio", summary.pricingParticipantsCount], ["Precio final por escala", formatCurrency(summary.finalPrice)], ["Total vendido", `${summary.totalQuantity} ${proposal.format}`], ["Total final estimado", formatCurrency(summary.totalToCollect)]].map(([label, value]) => <div key={label} className="rounded-2xl bg-[#fff8ed] p-4"><p className="text-xs font-black uppercase text-[#B45309]">{label}</p><p className="text-xl font-black">{value}</p></div>)}
                </div>
              </div>
              
              <section className="mt-4 grid gap-2 rounded-2xl border border-[#f3d2a5] bg-[#fff8ed] p-4 text-sm font-bold text-[#7c5a34]">
                <p className="font-black text-[#B45309]">Cierre de precio por escala</p>
                <p>HUBYA calcula automáticamente el precio final con participantes reales al cerrar la oferta. El pago se controla por fuera en Mercado Pago.</p>
              </section>
              <div className="mt-4 flex flex-wrap gap-2 text-sm font-black">
                <a href={link} className="rounded-xl bg-[#B45309] px-4 py-3 text-white">Abrir / copiar link</a>
                <form action={updateSalesProposalStatusAction}><input type="hidden" name="proposalId" value={proposal.id} /><button name="status" value="Cerrada" className="rounded-xl border border-[#f3d2a5] px-4 py-3">Cerrar propuesta</button></form>
                <form action={updateSalesProposalStatusAction}><input type="hidden" name="proposalId" value={proposal.id} /><button name="status" value="Confirmada" className="rounded-xl border border-[#f3d2a5] px-4 py-3">Confirmar pedidos</button></form>
                <form action={updateSalesProposalStatusAction}><input type="hidden" name="proposalId" value={proposal.id} /><button name="status" value="Entregada" className="rounded-xl border border-[#f3d2a5] px-4 py-3">Marcar entregado</button></form>
              </div>
              <div className="mt-5 grid gap-3 lg:grid-cols-3">
                <details className="rounded-2xl border border-[#f3d2a5] p-4" open><summary className="cursor-pointer font-black">Ver participantes</summary><div className="mt-3 grid gap-2 text-sm font-bold text-[#7c5a34]">{summary.accepted.length === 0 ? <p>Sin participaciones todavía.</p> : summary.accepted.map((item) => <p key={item.id}>{item.customerName} · {item.quantity} · {formatCurrency(item.quantity * summary.finalPrice)} · {item.address || "Sin dirección"}</p>)}</div></details>
                <details className="rounded-2xl border border-[#f3d2a5] p-4"><summary className="cursor-pointer font-black">Ver no participantes</summary><div className="mt-3 grid gap-2 text-sm font-bold text-[#7c5a34]">{summary.rejected.length === 0 ? <p>Sin respuestas negativas todavía.</p> : summary.rejected.map((item) => <p key={item.id}>{item.customerName}</p>)}</div></details>
                <details className="rounded-2xl border border-[#f3d2a5] p-4"><summary className="cursor-pointer font-black">Ver pendientes</summary><div className="mt-3 grid gap-2 text-sm font-bold text-[#7c5a34]">{summary.pending.length === 0 ? <p>No quedan integrantes pendientes.</p> : summary.pending.map((item) => <p key={item.id}>{item.nombre} · {item.whatsapp || "Sin teléfono"}</p>)}</div></details>
              </div>
              <details className="mt-3 rounded-2xl bg-[#fff8ed] p-4"><summary className="cursor-pointer text-sm font-black">Generar hoja de reparto</summary><div className="mt-3 grid gap-2 text-sm font-bold text-[#7c5a34]">{summary.accepted.length === 0 ? <p>Cuando haya aceptados, acá queda la hoja simple de reparto.</p> : summary.accepted.map((item, index) => <p key={item.id}>{index + 1}. {item.customerName} — {item.address || "Dirección pendiente"} — {item.quantity} {proposal.format} — Precio final {formatCurrency(item.quantity * summary.finalPrice)}</p>)}</div></details>
            </article>;
          })}
        </section>
      </section>
    </main>
  );
}
