import { HubNav } from "../HubNav";
import { getHubOr404 } from "../utils";

export default async function ReportePage({ params }: { params: Promise<{ hubId: string }> }) {
  const { hubId } = await params; const hub = await getHubOr404(hubId);
  return <main className="min-h-screen bg-[#f6f7f2] px-4 py-6 text-[#1f2a1d]"><div className="mx-auto grid max-w-7xl gap-5"><HubNav hub={hub} active="reporte" />
    <section className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">Carga diaria / reporte</h2><p className="mt-2 text-sm font-bold text-[#66745c]">Esta pantalla solo sirve para cargar la jornada diaria y generar el reporte. No mezcla la ficha pública del Hub.</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl bg-[#f8faf5] p-4"><h3 className="font-black">Clientes del Hub</h3><p className="mt-2 text-sm">{hub.clientesActivos} clientes activos para cargar horas, importes y tareas.</p></div><div className="rounded-2xl bg-[#f8faf5] p-4"><h3 className="font-black">Distribución</h3><p className="mt-2 text-sm">Servicios activos: {hub.servicios.length}. Gastos e importes se cargan acá.</p></div></div>
      <form className="mt-6 grid gap-3 lg:grid-cols-4"><input className="rounded-xl border px-3 py-3" placeholder="Horas trabajadas" /><input className="rounded-xl border px-3 py-3" placeholder="Importes" /><input className="rounded-xl border px-3 py-3" placeholder="Gastos" /><button className="rounded-xl bg-[#1f2a1d] px-4 py-3 font-black text-white">Generar vista previa</button></form>
      <div className="mt-6 rounded-2xl border border-dashed border-[#cfd8c6] p-5"><h3 className="font-black">Vista previa del reporte</h3><p className="mt-2 text-sm text-[#66745c]">Resumen de jornada listo para revisar antes de enviar.</p><button className="mt-4 rounded-xl bg-[#1f2a1d] px-4 py-3 font-black text-white">Enviar reporte</button></div>
    </section></div></main>;
}
