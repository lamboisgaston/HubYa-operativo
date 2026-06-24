"use client";

import { useState } from "react";

export const SOLICITUDES_NUEVO_HUB_STORAGE_KEY = "hubya-solicitudes-nuevo-hub";
export type SolicitudNuevoHub = {
  id: string;
  tipoHub: "demanda" | "oferta";
  nombreHub: string;
  zona: string;
  rubro: string;
  responsable: string;
  whatsapp: string;
  email: string;
  descripcion: string;
  estado: "pendiente" | "aprobada" | "rechazada";
  fecha: string;
};

export function crearSolicitudNuevoHub(input: Omit<SolicitudNuevoHub, "id" | "estado" | "fecha">): SolicitudNuevoHub {
  return { id: `solicitud-nuevo-hub-${Date.now()}`, estado: "pendiente", fecha: new Date().toISOString(), ...input };
}

export function RequestHubForm() {
  const [estado, setEstado] = useState("");

  function submit(formData: FormData) {
    const datos = Object.fromEntries(formData) as Record<string, string>;
    const solicitud = crearSolicitudNuevoHub({
      tipoHub: datos.tipoHub === "oferta" ? "oferta" : "demanda",
      nombreHub: datos.nombreHub || "",
      zona: datos.zona || "",
      rubro: datos.rubro || "",
      responsable: datos.responsable || "",
      whatsapp: datos.whatsapp || "",
      email: datos.email || "",
      descripcion: datos.descripcion || "",
    });
    const actuales = JSON.parse(window.localStorage.getItem(SOLICITUDES_NUEVO_HUB_STORAGE_KEY) || "[]") as SolicitudNuevoHub[];
    window.localStorage.setItem(SOLICITUDES_NUEVO_HUB_STORAGE_KEY, JSON.stringify([solicitud, ...actuales]));
    setEstado(`Solicitud recibida como Hub de ${solicitud.tipoHub === "demanda" ? "demanda" : "oferta / equipo activo"}.`);
  }

  return <form action={submit} className="grid gap-3 rounded-2xl border border-[#DDE7E2] bg-[#FFF4CC] p-5 text-left">
    <h2 className="text-2xl font-black text-[#0B1726]">Solicitar creación de un nuevo Hub</h2>
    <p className="text-sm font-semibold text-[#53685C]">Elegí si querés agrupar clientes de una zona/proceso o armar un equipo activo para ejecutar una oferta operativa.</p>
    <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-[#53685C]">Tipo de Hub<select name="tipoHub" className="rounded-xl border border-[#DDE7E2] bg-[#F8FAF7] px-3 py-2 text-sm normal-case text-[#0B1726] outline-none focus:border-[#1E8F4D]"><option value="demanda">Hub de demanda · clientes</option><option value="oferta">Hub de oferta / Equipo activo</option></select></label>
    <div className="grid gap-3 md:grid-cols-2">
      {[ ["nombreHub", "Nombre del Hub *"], ["zona", "Zona / alcance *"], ["rubro", "Rubro o proceso *"], ["responsable", "Responsable *"], ["whatsapp", "WhatsApp *"], ["email", "Email"] ].map(([name, label]) => <label key={name} className="grid gap-1 text-xs font-bold uppercase tracking-wide text-[#53685C]">{label}<input required={name !== "email"} name={name} type={name === "email" ? "email" : "text"} className="rounded-xl border border-[#DDE7E2] bg-[#F8FAF7] px-3 py-2 text-sm normal-case text-[#0B1726] outline-none focus:border-[#1E8F4D]" /></label>)}
    </div>
    <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-[#53685C]">Descripción<textarea required name="descripcion" className="min-h-24 rounded-xl border border-[#DDE7E2] bg-[#F8FAF7] px-3 py-2 text-sm normal-case text-[#0B1726] outline-none focus:border-[#1E8F4D]" /></label>
    <button className="rounded-xl bg-gradient-to-r from-[#1E8F4D] to-[#22C7E8] px-5 py-3 text-sm font-black text-white">Enviar solicitud de nuevo Hub</button>
    {estado && <p className="text-sm font-bold text-[#1E8F4D]">{estado}</p>}
  </form>;
}
