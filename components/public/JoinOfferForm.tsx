"use client";

import { useState } from "react";
import { EQUIPOS_ACTIVOS_STORAGE_KEY, SOLICITUDES_OFERTA_STORAGE_KEY, createSolicitudOferta, equiposActivosIniciales, type EquipoActivo, type SolicitudOferta } from "@/lib/data/equiposActivos";

function leerEquipos(): EquipoActivo[] {
  if (typeof window === "undefined") return equiposActivosIniciales;
  try { return JSON.parse(window.localStorage.getItem(EQUIPOS_ACTIVOS_STORAGE_KEY) || "null") || equiposActivosIniciales; } catch { return equiposActivosIniciales; }
}

export function JoinOfferForm() {
  const [estado, setEstado] = useState("");
  const [equipos, setEquipos] = useState<EquipoActivo[]>(equiposActivosIniciales);

  function cargarEquipos() { setEquipos(leerEquipos()); }

  function submit(formData: FormData) {
    const datos = Object.fromEntries(formData) as Record<string, string>;
    const solicitud = createSolicitudOferta({ nombre: datos.nombre || "", whatsapp: datos.whatsapp || "", email: datos.email || "", zona: datos.zona || "", experiencia: datos.experiencia || "", rubroInteres: datos.rubroInteres || "", mensaje: datos.mensaje || "", equipoInteres: datos.equipoInteres || "Equipo en formación" });
    const actuales = JSON.parse(window.localStorage.getItem(SOLICITUDES_OFERTA_STORAGE_KEY) || "[]") as SolicitudOferta[];
    window.localStorage.setItem(SOLICITUDES_OFERTA_STORAGE_KEY, JSON.stringify([solicitud, ...actuales]));
    setEstado("Solicitud de ingreso al equipo recibida. El panel operativo la verá como Solicitud de oferta.");
  }

  return <form action={submit} onFocus={cargarEquipos} className="grid gap-3 rounded-2xl border border-[#06b6d4]/25 bg-[#06b6d4]/10 p-5 text-left">
    <h2 className="text-2xl font-black text-white">Quiero formar parte de un equipo activo</h2>
    <p className="text-sm font-semibold text-[#9ca3af]">OFERTA · Solicitudes de ingreso al equipo para integrantes operativos.</p>
    <div className="grid gap-3 md:grid-cols-2">
      {[ ["nombre", "Nombre *"], ["whatsapp", "WhatsApp *"], ["email", "Email *"], ["zona", "Zona *"], ["experiencia", "Experiencia"], ["rubroInteres", "Rubro de interés *"] ].map(([name, label]) => <label key={name} className="grid gap-1 text-xs font-bold uppercase tracking-wide text-[#9ca3af]">{label}<input required={["nombre", "whatsapp", "email", "zona", "rubroInteres"].includes(name)} name={name} type={name === "email" ? "email" : "text"} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm normal-case text-white outline-none focus:border-[#06b6d4]" /></label>)}
    </div>
    <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-[#9ca3af]">Equipo de interés<select name="equipoInteres" className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm normal-case text-white outline-none focus:border-[#06b6d4]">{equipos.map((equipo) => <option key={equipo.id} value={equipo.nombre}>{equipo.nombre}</option>)}<option value="Equipo en formación">Equipo en formación</option></select></label>
    <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-[#9ca3af]">Mensaje<textarea name="mensaje" className="min-h-24 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm normal-case text-white outline-none focus:border-[#06b6d4]" /></label>
    <button className="rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#4f46e5] px-5 py-3 text-sm font-black text-white">Enviar solicitud de oferta</button>
    {estado && <p className="text-sm font-bold text-[#06b6d4]">{estado}</p>}
  </form>;
}
