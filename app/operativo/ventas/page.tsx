import Link from "next/link";
import { createGroupedSalesProposalAction, updateSalesProposalPricingAction, updateSalesProposalStatusAction } from "../hubs/[hubId]/ventas/actions";
import { formatCurrency, getSalesDashboardData, summarizeSalesProposal } from "@/lib/sales/proposals";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const defaultScales = [
  [1, 5, 45000],
  [6, 10, 42000],
  [11, 30, 39000],
  [31, 999, 37000],
];

export default async function VentasPage() {
  const { hubs, clientes, proposals } = await getSalesDashboardData();
  return <main className="min-h-screen bg-[#fff8ed] px-4 py-6 text-[#2b1705]">
    <section className="mx-auto grid max-w-6xl gap-5">
      <header className="rounded-[2rem] border border-[#f3d2a5] bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#B45309]">Rama Ventas</p>
        <h1 className="mt-2 text-3xl font-black">Propuestas comerciales agrupadas</h1>
        <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-[#7c5a34]">HUBYA no vende casa por casa. HUBYA mide y organiza demanda agrupada. Mientras más participa el Hub, mejor precio consigue el grupo.</p>
      </header>

      <form action={createGroupedSalesProposalAction} className="grid gap-5 rounded-[2rem] border border-[#f3d2a5] bg-white p-6 shadow-sm">
        <div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#B45309]">1. Producto</p><h2 className="mt-1 text-2xl font-black">Crear propuesta comercial</h2></div>
        <div className="grid gap-3 md:grid-cols-2">
          <input name="title" defaultValue="Propuesta HUBYA — huevos a domicilio" placeholder="Título de propuesta" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
          <input name="productName" defaultValue="Media caja de huevos" placeholder="Producto" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
          <input name="format" defaultValue="Media caja" placeholder="Formato" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
          <input name="deliveryDay" defaultValue="Miércoles" placeholder="Día de entrega" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
          <input name="deliveryMode" defaultValue="Envío a domicilio" placeholder="Modalidad de entrega" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
          <input name="countdownHours" type="number" min="1" defaultValue="5" placeholder="Horas abierta (ej: 5)" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
          <input name="paymentLink" defaultValue="https://www.mercadopago.com.ar/link-de-pago-demo-hubya" placeholder="Link de pago único" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold md:col-span-2" />
          <textarea name="description" defaultValue="Esta semana estamos organizando reparto de huevos a domicilio." placeholder="Descripción breve" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold md:col-span-2" />
          <textarea name="notes" defaultValue="Por ahora el link de pago se genera con un precio único. Cuando cierre la propuesta, HUBYA revisará cuántos participantes tuvo el Hub. Si por la cantidad de participantes corresponde un precio menor al pagado, la diferencia quedará acreditada en tu cuenta o podrá bonificarse con mercadería equivalente." placeholder="Observaciones" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold md:col-span-2" />
        </div>

        <div className="grid gap-3 rounded-3xl bg-[#fff8ed] p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#B45309]">2. Escala editable</p>
          {defaultScales.map(([min, max, price], index) => <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_1fr]">
            <label className="text-xs font-black uppercase text-[#7c5a34]">Desde<input name={`scale${index}Min`} type="number" defaultValue={min} className="mt-1 w-full rounded-xl border border-[#f3d2a5] px-3 py-2 text-base text-[#2b1705]" /></label>
            <label className="text-xs font-black uppercase text-[#7c5a34]">Hasta<input name={`scale${index}Max`} type="number" defaultValue={max} className="mt-1 w-full rounded-xl border border-[#f3d2a5] px-3 py-2 text-base text-[#2b1705]" /></label>
            <label className="text-xs font-black uppercase text-[#7c5a34]">Precio<input name={`scale${index}Price`} type="number" defaultValue={price} className="mt-1 w-full rounded-xl border border-[#f3d2a5] px-3 py-2 text-base text-[#2b1705]" /></label>
          </div>)}
          <p className="text-xs font-bold text-[#7c5a34]">Para quitar un rango, dejá su precio vacío. Para “más de 30”, usá 31 hasta 999.</p>
        </div>

        <div className="grid gap-3">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#B45309]">3. Hubs destinatarios</p>
          <div className="grid gap-2 md:grid-cols-2">
            {hubs.map((hub) => <label key={hub.id} className="flex gap-3 rounded-2xl border border-[#f3d2a5] p-4 font-bold"><input name="targetHubIds" value={hub.id} type="checkbox" className="mt-1" /><span><b>{hub.nombre}</b><br/><span className="text-sm text-[#7c5a34]">{hub.rama} · {hub.zona} · {hub.clientesActivos} usuarios · {hub.estado}</span></span></label>)}
          </div>
        </div>
        <button className="rounded-2xl bg-[#B45309] px-5 py-3 font-black text-white">Generar links públicos de propuesta</button>
      </form>

      <section className="grid gap-4">
        {proposals.map((proposal) => {
          const summary = summarizeSalesProposal(proposal, proposal.responses, clientes);
          const paidLinkPrice = proposal.priceScales[0]?.price || proposal.price;
          const difference = Math.max(0, paidLinkPrice - summary.finalPrice);
          const link = `${baseUrl}/propuestas/${proposal.publicLink}`;
          return <article key={proposal.id} className="rounded-[2rem] border border-[#f3d2a5] bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#B45309]">{proposal.status} · {proposal.hub?.nombre}</p>
            <h2 className="mt-2 text-2xl font-black">{proposal.productName}</h2>
            <p className="mt-2 font-bold text-[#7c5a34]">Entrega: {proposal.deliveryDay} · Link de pago: {proposal.paymentLink || "pendiente"}</p><p className="mt-1 font-bold text-[#7c5a34]">Cierre: {new Date(proposal.responseDeadline).toLocaleString("es-AR")} · Cuenta regresiva inicial: {proposal.countdownHours} horas</p>
            <div className="mt-4 grid gap-2 md:grid-cols-4">
              {[["Usuarios del Hub", proposal.hub?.clientesActivos || 0], ["Aceptaron", summary.acceptedCount], ["No aceptaron", summary.rejectedCount], ["Pendientes", summary.pendingCount], ["Participantes para calcular precio", summary.pricingParticipantsCount], ["Precio del link de pago", formatCurrency(paidLinkPrice)], ["Precio final por escala", formatCurrency(summary.finalPrice)], ["Total a compensar", formatCurrency(difference * summary.acceptedCount)]].map(([label, value]) => <div key={label} className="rounded-2xl bg-[#fff8ed] p-4"><p className="text-xs font-black uppercase text-[#B45309]">{label}</p><p className="text-xl font-black">{value}</p></div>)}
            </div>
            <form action={updateSalesProposalPricingAction} className="mt-4 grid gap-3 rounded-2xl border border-[#f3d2a5] p-4 md:grid-cols-4">
              <input type="hidden" name="proposalId" value={proposal.id} />
              <label className="text-xs font-black uppercase text-[#7c5a34]">Aceptaron<input readOnly value={summary.acceptedParticipantsCount} className="mt-1 w-full rounded-xl border border-[#f3d2a5] px-3 py-2 text-base" /></label>
              <label className="text-xs font-black uppercase text-[#7c5a34]">Participantes usados para precio<input name="pricingParticipantsCount" type="number" defaultValue={summary.pricingParticipantsCount} className="mt-1 w-full rounded-xl border border-[#f3d2a5] px-3 py-2 text-base" /></label>
              <label className="text-xs font-black uppercase text-[#7c5a34]">Modo<select name="pricingMode" defaultValue={summary.pricingMode} className="mt-1 w-full rounded-xl border border-[#f3d2a5] px-3 py-2 text-base"><option value="automatic">Automático</option><option value="manual">Manual</option></select></label>
              <button className="rounded-xl bg-[#B45309] px-4 py-3 text-sm font-black text-white">Editar participantes para precio</button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2 text-sm font-black"><a href={link} className="rounded-xl bg-[#B45309] px-4 py-3 text-white">Copiar link del Hub</a><details className="rounded-xl border border-[#f3d2a5] px-4 py-3"><summary>Ver aceptados</summary><div className="mt-2 grid gap-1 font-bold text-[#7c5a34]">{summary.accepted.map((item) => <p key={item.id}>{item.customerName} · {item.phone} · {item.address}</p>)}</div></details><details className="rounded-xl border border-[#f3d2a5] px-4 py-3"><summary>Ver pendientes</summary><div className="mt-2 grid gap-1 font-bold text-[#7c5a34]">{summary.pending.map((item) => <p key={item.id}>{item.nombre} · {item.whatsapp}</p>)}</div></details><form action={updateSalesProposalStatusAction}><input type="hidden" name="proposalId" value={proposal.id} /><button name="status" value="Cerrada" className="rounded-xl border border-[#f3d2a5] px-4 py-3">Cerrar propuesta para este Hub</button></form><form action={updateSalesProposalStatusAction}><input type="hidden" name="proposalId" value={proposal.id} /><button name="status" value="Entregada" className="rounded-xl border border-[#f3d2a5] px-4 py-3">Marcar entrega organizada</button></form></div>
          </article>;
        })}
      </section>
      <Link href="/operativo" className="justify-self-start rounded-2xl border border-[#f3d2a5] bg-white px-4 py-3 text-sm font-black">← Volver</Link>
    </section>
  </main>;
}
