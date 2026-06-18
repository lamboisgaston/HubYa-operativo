import type { HubPublico } from "@/lib/data/hubs";
import { JoinHubForm } from "./JoinHubForm";
import { HubServiciosList } from "./HubServiciosList";

function formatoMoneda(valor: number | undefined) { return Number(valor || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }); }

export function HubPublicPage({ hub }: { hub: HubPublico }) {
  const parametrosJardinerosYa = hub.moduloOperativo === "jardinerosya" && hub.parametrosOperativos?.jardinerosYa?.mostrarEnWebPublica ? hub.parametrosOperativos.jardinerosYa : null;
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-32">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#06b6d4]">{hub.estado}</p>
        <h1 className="mt-3 text-5xl font-black text-white">{hub.nombre}</h1>
        <p className="mt-4 max-w-2xl text-lg text-[#9ca3af]">{hub.descripcionPublica}</p>
        <dl className="mt-8 grid gap-4 md:grid-cols-3">
          {[["Zona", hub.zona], ["Clientes activos", hub.clientesActivos], ["Rama", hub.rama], ["Equipo operativo", hub.equipoOperativo], ["Trabajos registrados", hub.trabajosRealizados ?? "Sin dato"], ["Última actividad", hub.ultimaActividad ? new Date(hub.ultimaActividad).toLocaleDateString("es-AR") : "Sin dato"]].map(([k, v]) => <div key={k} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><dt className="text-xs font-black uppercase text-[#6b7280]">{k}</dt><dd className="mt-1 text-xl font-black text-white">{v}</dd></div>)}
        </dl>
        {hub.informacionImportante?.mostrarEnWebPublica && hub.informacionImportante.texto && (
          <section className="mt-8 rounded-3xl border border-emerald-300/25 bg-emerald-50/10 p-6 text-white shadow-2xl shadow-emerald-950/10">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Información importante</p>
            <h2 className="mt-2 text-2xl font-black">{hub.informacionImportante.titulo || "Información importante del Hub"}</h2>
            <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-emerald-50/85">{hub.informacionImportante.texto}</p>
          </section>
        )}
        {parametrosJardinerosYa && (
          <section className="mt-8 rounded-3xl border border-lime-300/25 bg-lime-50/10 p-6 text-white shadow-2xl shadow-lime-950/10">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-200">Parámetros de trabajo del Hub</p>
            <h2 className="mt-2 text-2xl font-black">JardinerosYa como algoritmo operativo</h2>
            <p className="mt-3 text-base leading-7 text-lime-50/85">Este Hub utiliza JardinerosYa como módulo operativo para organizar el mantenimiento de espacios verdes. Los valores de referencia permiten ordenar horas de trabajo, traslado, maquinaria e insumos básicos.</p>
            <p className="mt-3 text-sm font-bold text-lime-50/75">El Hub agrupa la demanda; JardinerosYa ordena el algoritmo operativo del mantenimiento de espacios verdes.</p>
            <dl className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Valor hora de trabajo", formatoMoneda(parametrosJardinerosYa.valorHoraTrabajo)],
                ["Comisión responsable de cuadrilla", `${parametrosJardinerosYa.comisionResponsableCuadrillaPorcentaje}%`],
                ["Traslado", formatoMoneda(parametrosJardinerosYa.traslado)],
                ["Nafta", formatoMoneda(parametrosJardinerosYa.nafta)],
                ["Aceite", formatoMoneda(parametrosJardinerosYa.aceite)],
                ["Hora cortadora de césped", formatoMoneda(parametrosJardinerosYa.valorHoraCortadoraCesped)],
                ["Hora bordeadora", formatoMoneda(parametrosJardinerosYa.valorHoraBordeadora)],
                ["Hora máquina de empuje", formatoMoneda(parametrosJardinerosYa.valorHoraMaquinaEmpuje)],
              ].map(([k, v]) => <div key={k} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><dt className="text-xs font-black uppercase text-lime-100/70">{k}</dt><dd className="mt-1 text-lg font-black text-white">{v}</dd></div>)}
            </dl>
          </section>
        )}
        <HubServiciosList servicios={hub.servicios} />
      </section>
      <section id="sumarme" className="mx-auto max-w-3xl px-6 pb-20"><JoinHubForm hubId={hub.id} hubNombre={hub.nombre} /></section>
    </>
  );
}
