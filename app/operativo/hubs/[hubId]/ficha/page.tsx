import type React from "react";
import { HubNav } from "../HubNav";
import { getHubOr404 } from "../utils";

function ActionButtons() { return <div className="flex flex-wrap gap-2"><button className="rounded-xl border px-3 py-2 text-xs font-black">Ver perfil</button><button className="rounded-xl border px-3 py-2 text-xs font-black">Editar</button><button className="rounded-xl border px-3 py-2 text-xs font-black">Remover</button><button className="rounded-xl bg-[#1f2a1d] px-3 py-2 text-xs font-black text-white">Notificar</button></div>; }
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-[1.5rem] border border-[#d8dfd1] bg-white p-5 shadow-sm"><h2 className="text-xl font-black">{title}</h2><div className="mt-4">{children}</div></section>; }
export default async function FichaHubPage({ params }: { params: Promise<{ hubId: string }> }) {
  const { hubId } = await params; const hub = await getHubOr404(hubId);
  const activos = hub.servicios.map((s) => s.vinculoActivo).filter(Boolean);
  const postulantes = hub.servicios.flatMap((s) => s.postulantes.map((p) => ({ ...p, servicio: s.nombre_servicio })));
  return <main className="min-h-screen bg-[#f6f7f2] px-4 py-6 text-[#1f2a1d]"><div className="mx-auto grid max-w-7xl gap-5"><HubNav hub={hub} active="ficha" />
    <div className="grid gap-5 lg:grid-cols-2">
      <Section title="Datos generales"><dl className="grid gap-3 text-sm"><div><dt className="font-black text-[#66745c]">Nombre</dt><dd>{hub.nombre}</dd></div><div><dt className="font-black text-[#66745c]">Ciudad / zona</dt><dd>{hub.zona}</dd></div><div><dt className="font-black text-[#66745c]">Rama</dt><dd>{hub.rama}</dd></div><div><dt className="font-black text-[#66745c]">Descripción pública</dt><dd>{hub.descripcionPublica}</dd></div></dl></Section>
      <Section title="Vecinos / clientes"><p className="text-3xl font-black">{hub.clientesActivos}</p><p className="text-sm font-bold text-[#66745c]">Clientes activos en la ficha única.</p><div className="mt-4"><ActionButtons /></div></Section>
      <Section title="Capacidad operativa"><p className="font-bold">Equipo operativo: {hub.equipoOperativo}</p><p className="mt-2 text-sm text-[#66745c]">Estabilidad referencial: ≈ {Math.max(1, Math.ceil(hub.clientesActivos / 12))} persona estable.</p><div className="mt-4"><ActionButtons /></div></Section>
      <Section title="Servicios / vínculos"><div className="space-y-4">{hub.servicios.map((servicio) => <article key={servicio.id} className="rounded-2xl bg-[#f8faf5] p-4"><h3 className="font-black">{servicio.nombre_servicio}</h3><p className="text-sm text-[#66745c]">Activo: {servicio.vinculoActivo?.oferta_nombre || "Sin asignar"}</p><div className="mt-3"><ActionButtons /></div></article>)}</div></Section>
      <Section title="Abastecimiento actual"><div className="space-y-3">{activos.map((v) => v && <div key={v.id} className="rounded-2xl bg-[#f8faf5] p-4"><p className="font-black">{v.oferta_nombre}</p><p className="text-sm text-[#66745c]">{v.responsable}</p><ActionButtons /></div>)}</div></Section>
      <Section title="Postulantes"><div className="space-y-3">{postulantes.map((p) => <div key={p.id} className="rounded-2xl bg-[#f8faf5] p-4"><p className="font-black">{p.oferta_nombre}</p><p className="text-sm text-[#66745c]">{p.servicio}</p><ActionButtons /></div>) || "Sin postulantes"}</div></Section>
      {['Viveros asociados','Paisajistas asociados','Perfiles','Notificaciones'].map((title) => <Section key={title} title={title}><p className="text-sm font-bold text-[#66745c]">Módulo conectado a la ficha única del Hub.</p><div className="mt-4"><ActionButtons /></div></Section>)}
    </div></div></main>;
}
