import { notFound } from "next/navigation";
import { formatCurrency, getSalesProposalByToken, respondSalesProposalAction } from "@/lib/sales/proposals";

export default async function PublicSalesProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getSalesProposalByToken(token);
  if (!data) notFound();
  const { proposal, hub } = data;

  return (
    <main className="min-h-screen bg-[#fff8ed] px-4 py-8 text-[#2b1705]">
      <section className="mx-auto grid max-w-2xl gap-5">
        <header className="rounded-[2rem] border border-[#f3d2a5] bg-white p-6 text-center shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#B45309]">Propuesta del {hub?.nombre || "Hub Huevos"}</p>
          <h1 className="mt-3 text-3xl font-black">{proposal.title}</h1>
          <p className="mt-3 text-lg font-black">{proposal.format} · {formatCurrency(proposal.price)}</p>
          <p className="mt-2 font-bold text-[#7c5a34]">{proposal.deliveryMode} el {proposal.deliveryDay}</p>
          {proposal.responseDeadline && <p className="mt-2 text-sm font-bold text-[#7c5a34]">Fecha límite para responder: {proposal.responseDeadline}</p>}
          {proposal.notes && <p className="mt-4 rounded-2xl bg-[#fff8ed] p-4 text-sm font-semibold">{proposal.notes}</p>}
        </header>

        <section className="rounded-[2rem] border border-[#f3d2a5] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">¿Querés aceptar esta propuesta?</h2>
          <div className="mt-5 grid gap-4">
            <form action={respondSalesProposalAction} className="grid gap-3 rounded-3xl bg-[#fff8ed] p-5">
              <input type="hidden" name="proposalId" value={proposal.id} />
              <input type="hidden" name="responseStatus" value="Aceptó" />
              <h3 className="text-xl font-black">Acepto</h3>
              <input name="customerName" required placeholder="Nombre" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
              <input name="phone" required placeholder="Teléfono" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
              <input name="address" required placeholder="Dirección" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
              <input name="quantity" type="number" min="1" defaultValue="1" placeholder="Cantidad" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
              <textarea name="notes" placeholder="Observaciones" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
              <button className="rounded-2xl bg-[#B45309] px-5 py-3 font-black text-white">Confirmar aceptación</button>
            </form>
            <form action={respondSalesProposalAction} className="rounded-3xl border border-[#f3d2a5] p-5">
              <input type="hidden" name="proposalId" value={proposal.id} />
              <input type="hidden" name="responseStatus" value="No aceptó" />
              <input name="customerName" placeholder="Nombre (opcional)" className="mb-3 w-full rounded-2xl border border-[#f3d2a5] px-4 py-3 font-bold" />
              <button className="w-full rounded-2xl border border-[#B45309] px-5 py-3 font-black text-[#B45309]">No acepto</button>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}
