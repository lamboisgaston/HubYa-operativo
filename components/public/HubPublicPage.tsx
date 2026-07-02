import type { EquipoOperativoPublico, HubPublico, IntegranteEquipoOperativoPublico } from "@/lib/data/hubs";
import { JoinHubForm } from "./JoinHubForm";
import { HubServiciosList } from "./HubServiciosList";
import { getHubCategoryConfig } from "@/lib/hubs/getHubCategoryConfig";

function formatoMoneda(valor: number | undefined) { return Number(valor || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }); }
function estadoLegible(estado: string) { return estado.charAt(0).toUpperCase() + estado.slice(1); }
function esEquipoPublico(equipo: HubPublico["equipoOperativo"]): equipo is EquipoOperativoPublico { return typeof equipo === "object" && equipo !== null && "cantidad" in equipo; }
function obtenerEquipo(hub: HubPublico) {
  const equipo = esEquipoPublico(hub.equipoOperativo) ? hub.equipoOperativo : { cantidad: Number(hub.hubOperativo?.length || 0), integrantes: hub.hubOperativo?.map((integrante) => ({ nombre: integrante.nombre, rol: integrante.rol, activo: integrante.activo })) || [] };
  return { cantidad: Number(equipo.cantidad || equipo.integrantes.length || 0), integrantes: equipo.integrantes || [] };
}
function obtenerUltimaActividad(hub: HubPublico) {
  const valor = hub.metricasOperativas?.ultimaActividad || hub.ultimaActividad;
  if (!valor) return "Sin dato";
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(valor)) return valor;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? valor : fecha.toLocaleDateString("es-AR");
}
function obtenerServicioPrincipal(categoriaSlug: string) {
  if (categoriaSlug === "mantenimiento-espacios-verdes") return { titulo: "Mantenimiento de espacios verdes", descripcion: "Corte, limpieza, mantenimiento y seguimiento de jardines en hogares de la zona." };
  return { titulo: "Servicios del hub", descripcion: "Servicios operativos recurrentes coordinados dentro del hub." };
}

function ResponsableCard({ hub, equipo, trabajosTerminados }: { hub: HubPublico; equipo: ReturnType<typeof obtenerEquipo>; trabajosTerminados: number }) {
  const responsable = hub.responsableHub;
  const tieneResponsable = Boolean(responsable?.nombre);
  return <article className="relative overflow-hidden rounded-[2.5rem] bg-[#0B1726] p-6 text-white shadow-2xl shadow-slate-950/30 sm:p-8">
    <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#9BE15D]/20 blur-3xl" />
    <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#1E8F4D]/25 blur-3xl" />
    <div className="relative">
      <div className="flex items-center gap-4">
        <div className="grid h-20 w-20 place-items-center rounded-full border border-white/20 bg-white text-2xl font-black text-[#1E8F4D] shadow-xl">{responsable?.iniciales || "HB"}</div>
        <div><h2 className="text-3xl font-black">{tieneResponsable ? responsable?.nombre : "Responsable operativo pendiente de asignación"}</h2><p className="mt-1 text-sm font-black uppercase tracking-[0.18em] text-emerald-200">{responsable?.rol || "Hub operativo en organización"}</p></div>
      </div>
      <p className="mt-6 text-xl font-black text-white">{responsable?.descripcion || "La atención del hub queda lista para asignar un responsable y equipo operativo."}</p>
      <p className="mt-3 leading-7 text-slate-200">Zona operativa: {hub.zona}</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-4"><p className="text-4xl font-black">{equipo.cantidad}</p><p className="mt-1 text-sm font-bold text-slate-200">personas en el equipo operativo</p></div>
        <div className="rounded-3xl border border-emerald-200/20 bg-emerald-400/15 p-4"><p className="text-4xl font-black text-emerald-100">{trabajosTerminados}</p><p className="mt-1 text-sm font-bold text-slate-200">trabajos terminados en el hub</p></div>
      </div>
    </div>
  </article>;
}

function IntegranteItem({ integrante }: { integrante: IntegranteEquipoOperativoPublico }) {
  return <div className="rounded-2xl bg-[#F8FAF7] p-4"><p className="font-black text-[#0B1726]">{integrante.nombre}</p><p className="text-sm font-bold text-[#53685C]">{integrante.rol || "Integrante operativo"}{integrante.activo === undefined ? "" : integrante.activo ? " · activo" : " · inactivo"}</p></div>;
}

export function HubPublicPage({ hub }: { hub: HubPublico }) {
  const categoria = getHubCategoryConfig(hub.categoriaId);
  const parametrosJardinerosYa = categoria.slug === "mantenimiento-espacios-verdes" && hub.moduloOperativo === "jardinerosya" && hub.parametrosOperativos?.jardinerosYa?.mostrarEnWebPublica ? hub.parametrosOperativos.jardinerosYa : null;
  const equipo = obtenerEquipo(hub);
  const responsable = hub.responsableHub;
  const tieneResponsable = Boolean(responsable?.nombre);
  const trabajosTerminados = Number(hub.metricasOperativas?.trabajosTerminados ?? hub.trabajosRealizados ?? 0);
  const clientesActivos = Number(hub.metricasOperativas?.clientesActivos ?? hub.clientesActivos ?? 0);
  const servicioPrincipal = obtenerServicioPrincipal(categoria.slug);
  return <>
    <section className="mx-auto max-w-6xl px-6 pb-12 pt-32">
      <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-stretch">
        <div className="rounded-[2.5rem] border border-[#CFE7DA] bg-white p-6 shadow-2xl shadow-emerald-950/10 sm:p-8">
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#1E8F4D] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-white">{estadoLegible(hub.estado)}</span><span className="rounded-full border border-[#BFE8CF] bg-[#EAF7EF] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#1E8F4D]">{categoria.nombre}</span></div>
          <p className="mt-8 text-sm font-black uppercase tracking-[0.24em] text-[#53685C]">Hub operativo real</p>
          <h1 className="mt-3 text-5xl font-black leading-[0.95] text-[#0B1726] sm:text-6xl">{hub.nombre}</h1>
          <p className="mt-5 max-w-2xl text-2xl font-black leading-tight text-[#1E8F4D]">{tieneResponsable ? `Atendido por ${responsable?.nombre} y su equipo operativo` : "Hub operativo en organización"}</p>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#375243]">{tieneResponsable ? `${responsable?.nombre} coordina este hub y, junto con su equipo, atiende servicios de ${categoria.nombre.toLowerCase()} en la zona ${hub.zona}.` : `Este hub permite organizar demanda recurrente en la zona ${hub.zona}, manteniendo privacidad y coordinación operativa.`}</p>
          <div className="mt-8 rounded-3xl border border-[#DDE7E2] bg-[#F8FAF7] p-5"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#53685C]">Privacidad operativa</p><p className="mt-2 text-base font-bold leading-7 text-[#375243]">El hub permite coordinar trabajos sin exponer datos privados de los integrantes.</p></div>
        </div>
        <ResponsableCard hub={hub} equipo={equipo} trabajosTerminados={trabajosTerminados} />
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-[2rem] border border-[#9BE15D] bg-[#EAF7EF] p-6 shadow-xl shadow-emerald-950/10 md:col-span-2"><p className="text-7xl font-black tracking-tight text-[#1E8F4D]">{trabajosTerminados}</p><p className="mt-2 text-xl font-black text-[#0B1726]">trabajos terminados</p><p className="mt-2 text-sm font-bold text-[#53685C]">Experiencia registrada para este hub.</p></div>
        <div className="rounded-[2rem] border border-[#DDE7E2] bg-white p-6"><p className="text-4xl font-black text-[#0B1726]">{equipo.cantidad}</p><p className="mt-2 text-sm font-black uppercase tracking-[0.14em] text-[#53685C]">personas en el equipo</p></div>
        <div className="rounded-[2rem] border border-[#DDE7E2] bg-white p-6"><p className="text-4xl font-black text-[#0B1726]">{clientesActivos}</p><p className="mt-2 text-sm font-black uppercase tracking-[0.14em] text-[#53685C]">clientes activos</p></div>
        <div className="rounded-[2rem] border border-[#DDE7E2] bg-white p-6 md:col-span-4"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#53685C]">Zona operativa</p><p className="mt-2 text-3xl font-black text-[#0B1726]">{hub.zona}</p></div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-[2rem] border border-[#DDE7E2] bg-white p-6"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#1E8F4D]">Quién atiende este hub</p><h2 className="mt-3 text-3xl font-black text-[#0B1726]">{tieneResponsable ? `${responsable?.nombre} y equipo operativo activo` : "Equipo operativo pendiente de carga"}</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-[#F8FAF7] p-4"><p className="font-black text-[#0B1726]">{responsable?.nombre || "Responsable principal pendiente"}</p><p className="text-sm font-bold text-[#53685C]">{responsable?.rol || "Rol pendiente de carga"}</p></div><div className="rounded-2xl bg-[#F8FAF7] p-4"><p className="font-black text-[#0B1726]">{equipo.cantidad > 0 ? "Equipo operativo activo" : "Equipo operativo pendiente"}</p><p className="text-sm font-bold text-[#53685C]">{equipo.cantidad} integrantes</p></div>{equipo.integrantes.length > 0 ? equipo.integrantes.map((integrante, index) => <IntegranteItem key={`${integrante.nombre}-${index}`} integrante={integrante} />) : <p className="rounded-2xl bg-[#F8FAF7] p-4 text-sm font-bold text-[#53685C] sm:col-span-2">Equipo operativo pendiente de carga</p>}</div></div>
        <div className="rounded-[2rem] border border-[#DDE7E2] bg-white p-6"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#1E8F4D]">Servicios del hub</p><h2 className="mt-3 text-3xl font-black text-[#0B1726]">{servicioPrincipal.titulo}</h2><p className="mt-4 leading-7 text-[#375243]">{servicioPrincipal.descripcion}</p></div>
      </section>

      {hub.informacionImportante?.mostrarEnWebPublica && hub.informacionImportante.texto && <section className="mt-8 rounded-3xl border border-[#BFE8CF] bg-[#EAF7EF] p-6 text-[#0B1726] shadow-2xl shadow-emerald-950/10"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#1E8F4D]">Información importante</p><h2 className="mt-2 text-2xl font-black">{hub.informacionImportante.titulo || "Información importante del Hub"}</h2><p className="mt-3 whitespace-pre-wrap text-base leading-7 text-[#375243]">{hub.informacionImportante.texto}</p></section>}
      {parametrosJardinerosYa && <section className="mt-8 rounded-3xl border border-[#DDE7E2] bg-[#FFF4CC] p-6 text-[#0B1726] shadow-2xl shadow-lime-950/10">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1E8F4D]">Parámetros JardinerosYa del Hub</p>
        <h2 className="mt-2 text-2xl font-black">Parámetros de referencia para el servicio</h2>
        <p className="mt-3 text-base leading-7 text-[#375243]">
          Estos valores sirven como referencia para ordenar el cobro del servicio: hora de trabajo, manejo de personal, maquinaria y traslado/bono de finalización.
        </p>

        <dl className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[#DDE7E2] bg-white p-4">
            <dt className="text-xs font-black uppercase text-[#53685C]">Precio de la hora de trabajo</dt>
            <dd className="mt-1 text-lg font-black text-[#0B1726]">{formatoMoneda(parametrosJardinerosYa.valorHoraTrabajo)}</dd>
          </div>
          <div className="rounded-2xl border border-[#DDE7E2] bg-white p-4">
            <dt className="text-xs font-black uppercase text-[#53685C]">Precio de la hora máquina bordeadora</dt>
            <dd className="mt-1 text-lg font-black text-[#0B1726]">{formatoMoneda(parametrosJardinerosYa.valorHoraBordeadora)}</dd>
          </div>
          <div className="rounded-2xl border border-[#DDE7E2] bg-white p-4">
            <dt className="text-xs font-black uppercase text-[#53685C]">Precio de la hora máquina de empuje</dt>
            <dd className="mt-1 text-lg font-black text-[#0B1726]">{formatoMoneda(parametrosJardinerosYa.valorHoraMaquinaEmpuje)}</dd>
          </div>
        </dl>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#DDE7E2] bg-white p-4">
            <h3 className="text-sm font-black text-[#0B1726]">Comisión por manejo de personal</h3>
            <p className="mt-1 text-xs font-bold text-[#53685C]">A mayor cantidad de personas coordinadas, mayor comisión por manejo de personal.</p>
            <div className="mt-3 grid gap-2">
              {(parametrosJardinerosYa.escalasComisionManejoPersonal || []).map((escala, index) => (
                <div key={`comision-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-[#F8FAF7] px-3 py-2 text-sm font-bold">
                  <span>{escala.desde} a {escala.hasta} ayudantes/personas</span>
                  <strong>{escala.porcentaje}%</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#DDE7E2] bg-white p-4">
            <h3 className="text-sm font-black text-[#0B1726]">Traslado / bono de finalización</h3>
            <p className="mt-1 text-xs font-bold text-[#53685C]">A mayor cantidad de casas atendidas, menor debería ser el costo de traslado por casa.</p>
            <div className="mt-3 grid gap-2">
              {(parametrosJardinerosYa.escalasTrasladoBonoFinalizacion || []).map((escala, index) => (
                <div key={`traslado-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-[#F8FAF7] px-3 py-2 text-sm font-bold">
                  <span>{escala.desde} a {escala.hasta} casas</span>
                  <strong>{formatoMoneda(escala.valor)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>}
      <section className="mt-8 rounded-[2rem] border border-[#DDE7E2] bg-white p-6"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#53685C]">Datos generales del hub</p><dl className="mt-5 grid gap-4 md:grid-cols-4">{[["Estado", estadoLegible(hub.estado)], ["Categoría", categoria.nombre], ["Responsable", responsable?.nombre || "Pendiente"], ["Última actividad", obtenerUltimaActividad(hub)]].map(([k, v]) => <div key={k} className="rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] p-4"><dt className="text-xs font-black uppercase text-[#53685C]">{k}</dt><dd className="mt-1 text-lg font-black text-[#0B1726]">{v}</dd></div>)}</dl></section>
      <HubServiciosList servicios={hub.servicios} />
    </section>
    <section id="sumarme" className="mx-auto max-w-3xl px-6 pb-20"><JoinHubForm hubId={hub.id} hubNombre={hub.nombre} /></section>
  </>;
}
