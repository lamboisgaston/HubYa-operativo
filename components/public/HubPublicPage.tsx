import type { HubPublico } from "@/lib/data/hubs";
import { JoinHubForm } from "./JoinHubForm";
import { HubServiciosList } from "./HubServiciosList";

function formatoMoneda(valor: number | undefined) { return Number(valor || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }); }

export function HubPublicPage({ hub }: { hub: HubPublico }) {
  const parametrosJardinerosYa = hub.moduloOperativo === "jardinerosya" && hub.parametrosOperativos?.jardinerosYa?.mostrarEnWebPublica ? hub.parametrosOperativos.jardinerosYa : null;
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-32">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#1E8F4D]">{hub.estado}</p>
        <h1 className="mt-3 text-5xl font-black text-[#0B1726]">{hub.nombre}</h1>
        <p className="mt-4 max-w-2xl text-lg text-[#53685C]">{hub.descripcionPublica}</p>
        <dl className="mt-8 grid gap-4 md:grid-cols-3">
          {[["Zona", hub.zona], ["Clientes activos", hub.clientesActivos], ["Rama", hub.rama], ["Equipo operativo", hub.equipoOperativo], ["Trabajos registrados", hub.trabajosRealizados ?? "Sin dato"], ["Última actividad", hub.ultimaActividad ? new Date(hub.ultimaActividad).toLocaleDateString("es-AR") : "Sin dato"]].map(([k, v]) => <div key={k} className="rounded-2xl border border-[#DDE7E2] bg-white p-4"><dt className="text-xs font-black uppercase text-[#53685C]">{k}</dt><dd className="mt-1 text-xl font-black text-[#0B1726]">{v}</dd></div>)}
        </dl>
        {hub.informacionImportante?.mostrarEnWebPublica && hub.informacionImportante.texto && (
          <section className="mt-8 rounded-3xl border border-[#BFE8CF] bg-[#EAF7EF] p-6 text-[#0B1726] shadow-2xl shadow-emerald-950/10">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1E8F4D]">Información importante</p>
            <h2 className="mt-2 text-2xl font-black">{hub.informacionImportante.titulo || "Información importante del Hub"}</h2>
            <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-[#375243]">{hub.informacionImportante.texto}</p>
          </section>
        )}
        {parametrosJardinerosYa && (
          <section className="mt-8 rounded-3xl border border-[#DDE7E2] bg-[#FFF4CC] p-6 text-[#0B1726] shadow-2xl shadow-lime-950/10">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1E8F4D]">Parámetros de trabajo del Hub</p>
            <h2 className="mt-2 text-2xl font-black">JardinerosYa como algoritmo operativo</h2>
            <p className="mt-3 text-base leading-7 text-[#375243]">Este Hub utiliza JardinerosYa como módulo operativo para organizar el mantenimiento de espacios verdes. Los valores de referencia permiten ordenar horas de trabajo, traslado, maquinaria e insumos básicos.</p>
            <p className="mt-3 text-sm font-bold text-[#53685C]">El Hub agrupa la demanda; JardinerosYa ordena el algoritmo operativo del mantenimiento de espacios verdes.</p>
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
              ].map(([k, v]) => <div key={k} className="rounded-2xl border border-[#DDE7E2] bg-white p-4"><dt className="text-xs font-black uppercase text-[#53685C]">{k}</dt><dd className="mt-1 text-lg font-black text-[#0B1726]">{v}</dd></div>)}
            </dl>
          </section>
        )}
        <HubServiciosList servicios={hub.servicios} />
      </section>
      <section id="sumarme" className="mx-auto max-w-3xl px-6 pb-20"><JoinHubForm hubId={hub.id} hubNombre={hub.nombre} /></section>
    </>
  );
}
