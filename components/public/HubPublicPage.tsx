import type { HubPublico } from "@/lib/data/hubs";
import { JoinHubForm } from "./JoinHubForm";
import { HubServiciosList } from "./HubServiciosList";
import { HubCategoryBadge } from "@/components/hubs/HubCategoryBadge";
import { getHubCategoryConfig } from "@/lib/hubs/getHubCategoryConfig";

function formatoMoneda(valor: number | undefined) { return Number(valor || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }); }

const datosElTipal = {
  nombre: "Hub El Tipal",
  estado: "Activo",
  categoria: "Mantenimiento de espacios verdes",
  zona: "El Tipal",
  responsable: "Hernán Llanes",
  rol: "Responsable del hub",
  rolDetalle: "Coordinador operativo de espacios verdes",
  equipoOperativo: 4,
  clientesActivos: 9,
  trabajosTerminados: 1245,
  ultimaActividad: "30/6/2026",
  servicio: "Mantenimiento de espacios verdes",
  servicioDescripcion: "Corte, limpieza, mantenimiento y seguimiento de jardines en hogares de la zona.",
};

function HubElTipalPublicPage({ hub }: { hub: HubPublico }) {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-32">
        <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-stretch">
          <div className="rounded-[2.5rem] border border-[#CFE7DA] bg-white p-6 shadow-2xl shadow-emerald-950/10 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#1E8F4D] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-white">{datosElTipal.estado}</span>
              <span className="rounded-full border border-[#BFE8CF] bg-[#EAF7EF] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#1E8F4D]">Espacios verdes</span>
            </div>
            <p className="mt-8 text-sm font-black uppercase tracking-[0.24em] text-[#53685C]">Hub operativo real</p>
            <h1 className="mt-3 text-5xl font-black leading-[0.95] text-[#0B1726] sm:text-6xl">{datosElTipal.nombre}</h1>
            <p className="mt-5 max-w-2xl text-2xl font-black leading-tight text-[#1E8F4D]">Atendido por Hernán Llanes y su equipo operativo</p>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#375243]">Hernán Llanes coordina este hub y, junto con su equipo, atiende servicios de mantenimiento de espacios verdes en las casas de la zona El Tipal.</p>
            <div className="mt-8 rounded-3xl border border-[#DDE7E2] bg-[#F8FAF7] p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#53685C]">Privacidad operativa</p>
              <p className="mt-2 text-base font-bold leading-7 text-[#375243]">El hub permite coordinar trabajos sin exponer datos privados de los integrantes.</p>
            </div>
          </div>

          <article className="relative overflow-hidden rounded-[2.5rem] bg-[#0B1726] p-6 text-white shadow-2xl shadow-slate-950/30 sm:p-8">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#9BE15D]/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#1E8F4D]/25 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 place-items-center rounded-full border border-white/20 bg-white text-2xl font-black text-[#1E8F4D] shadow-xl">HL</div>
                <div>
                  <h2 className="text-3xl font-black">{datosElTipal.responsable}</h2>
                  <p className="mt-1 text-sm font-black uppercase tracking-[0.18em] text-emerald-200">{datosElTipal.rol}</p>
                </div>
              </div>
              <p className="mt-6 text-xl font-black text-white">Coordinador operativo de espacios verdes</p>
              <p className="mt-3 leading-7 text-slate-200">Responsable de coordinar la atención operativa de las casas vinculadas al hub.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-4"><p className="text-4xl font-black">4</p><p className="mt-1 text-sm font-bold text-slate-200">Atiende el hub con un equipo de 4 personas</p></div>
                <div className="rounded-3xl border border-emerald-200/20 bg-emerald-400/15 p-4"><p className="text-4xl font-black text-emerald-100">1245</p><p className="mt-1 text-sm font-bold text-slate-200">trabajos terminados en el hub</p></div>
              </div>
            </div>
          </article>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-[2rem] border border-[#9BE15D] bg-[#EAF7EF] p-6 shadow-xl shadow-emerald-950/10 md:col-span-2"><p className="text-7xl font-black tracking-tight text-[#1E8F4D]">1245</p><p className="mt-2 text-xl font-black text-[#0B1726]">trabajos terminados</p><p className="mt-2 text-sm font-bold text-[#53685C]">Experiencia real registrada en el hub.</p></div>
          <div className="rounded-[2rem] border border-[#DDE7E2] bg-white p-6"><p className="text-4xl font-black text-[#0B1726]">4</p><p className="mt-2 text-sm font-black uppercase tracking-[0.14em] text-[#53685C]">personas en el equipo</p></div>
          <div className="rounded-[2rem] border border-[#DDE7E2] bg-white p-6"><p className="text-4xl font-black text-[#0B1726]">9</p><p className="mt-2 text-sm font-black uppercase tracking-[0.14em] text-[#53685C]">clientes activos</p></div>
          <div className="rounded-[2rem] border border-[#DDE7E2] bg-white p-6 md:col-span-4"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#53685C]">Zona operativa</p><p className="mt-2 text-3xl font-black text-[#0B1726]">El Tipal</p></div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[2rem] border border-[#DDE7E2] bg-white p-6"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#1E8F4D]">Quién atiende este hub</p><h2 className="mt-3 text-3xl font-black text-[#0B1726]">Hernán Llanes y equipo operativo activo</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-[#F8FAF7] p-4"><p className="font-black text-[#0B1726]">Hernán Llanes</p><p className="text-sm font-bold text-[#53685C]">Responsable del hub</p></div><div className="rounded-2xl bg-[#F8FAF7] p-4"><p className="font-black text-[#0B1726]">Equipo operativo activo</p><p className="text-sm font-bold text-[#53685C]">4 integrantes</p></div></div><p className="mt-5 leading-7 text-[#375243]">Las casas vinculadas a este hub son atendidas por Hernán Llanes y su equipo, con coordinación operativa y seguimiento de los trabajos realizados.</p></div>
          <div className="rounded-[2rem] border border-[#DDE7E2] bg-white p-6"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#1E8F4D]">Servicio principal</p><h2 className="mt-3 text-3xl font-black text-[#0B1726]">{datosElTipal.servicio}</h2><p className="mt-4 leading-7 text-[#375243]">{datosElTipal.servicioDescripcion}</p></div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-[#DDE7E2] bg-white p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#53685C]">Datos generales del hub</p>
          <dl className="mt-5 grid gap-4 md:grid-cols-4">
            {[ ["Estado", datosElTipal.estado], ["Categoría", datosElTipal.categoria], ["Responsable", datosElTipal.responsable], ["Última actividad", datosElTipal.ultimaActividad] ].map(([k, v]) => <div key={k} className="rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] p-4"><dt className="text-xs font-black uppercase text-[#53685C]">{k}</dt><dd className="mt-1 text-lg font-black text-[#0B1726]">{v}</dd></div>)}
          </dl>
        </section>
      </section>
      <section id="sumarme" className="mx-auto max-w-3xl px-6 pb-20"><JoinHubForm hubId={hub.id} hubNombre={hub.nombre} /></section>
    </>
  );
}

export function HubPublicPage({ hub }: { hub: HubPublico }) {
  const categoria = getHubCategoryConfig(hub.categoriaId);
  const parametrosJardinerosYa = categoria.slug === "mantenimiento-espacios-verdes" && hub.moduloOperativo === "jardinerosya" && hub.parametrosOperativos?.jardinerosYa?.mostrarEnWebPublica ? hub.parametrosOperativos.jardinerosYa : null;
  if (hub.slug === "el-tipal") return <HubElTipalPublicPage hub={hub} />;
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-32">
        <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black uppercase tracking-[0.25em] text-[#1E8F4D]">{hub.estado}</p><HubCategoryBadge category={hub.categoriaId} /></div>
        <h1 className="mt-3 text-5xl font-black text-[#0B1726]">{hub.nombre}</h1>
        <p className="mt-4 max-w-2xl text-lg text-[#53685C]">{hub.descripcionPublica}</p>
        <dl className="mt-8 grid gap-4 md:grid-cols-3">
          {[["Zona", hub.zona], ["Clientes activos", hub.clientesActivos], ["Categoría", categoria.nombre], ["Equipo operativo", hub.equipoOperativo], ["Trabajos registrados", hub.trabajosRealizados ?? "Sin dato"], ["Última actividad", hub.ultimaActividad ? new Date(hub.ultimaActividad).toLocaleDateString("es-AR") : "Sin dato"]].map(([k, v]) => <div key={k} className="rounded-2xl border border-[#DDE7E2] bg-white p-4"><dt className="text-xs font-black uppercase text-[#53685C]">{k}</dt><dd className="mt-1 text-xl font-black text-[#0B1726]">{v}</dd></div>)}
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
            <h2 className="mt-2 text-2xl font-black">{categoria.textos.parametrosTitulo}</h2>
            <p className="mt-3 text-base leading-7 text-[#375243]">{categoria.textos.parametrosDescripcion}</p>
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
