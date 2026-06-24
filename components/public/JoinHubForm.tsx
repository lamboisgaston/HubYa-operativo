"use client";
import { useState } from "react";

export function JoinHubForm({ hubId, hubNombre, compacto = false }: { hubId: string; hubNombre: string; compacto?: boolean }) {
  const [estado, setEstado] = useState("");

  async function submit(formData: FormData) {
    setEstado("Enviando...");
    const res = await fetch("/api/solicitudes-hub", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData)),
      headers: { "Content-Type": "application/json" },
    });
    setEstado(res.ok ? "Tu solicitud fue recibida dentro de este Hub." : "No se pudo enviar la solicitud.");
  }

  return (
    <form action={submit} className={`grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] ${compacto ? "p-4" : "p-5"}`}>
      <input type="hidden" name="hubSolicitadoId" value={hubId} />
      <input type="hidden" name="hubSolicitadoNombre" value={hubNombre} />
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#06b6d4]">Alta asociada automáticamente</p>
        <h2 className={`${compacto ? "text-xl" : "text-2xl"} mt-1 font-black text-white`}>Sumarme a {hubNombre}</h2>
        <p className="mt-1 text-xs text-[#9ca3af]">No hace falta elegir Hub: esta solicitud queda vinculada a {hubNombre}.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {[
          ["nombre", "Nombre *"],
          ["whatsapp", "Teléfono *"],
          ["email", "Email *"],
          ["direccion", "Dirección *"],
          ["servicio", "Servicio de interés *"],
        ].map(([name, label]) => (
          <label key={name} className="grid gap-1 text-xs font-bold uppercase tracking-wide text-[#9ca3af]">
            {label}
            <input required name={name} type={name === "email" ? "email" : "text"} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm normal-case text-white outline-none focus:border-[#4f46e5]" />
          </label>
        ))}
      </div>
      <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-[#9ca3af]">
        Observaciones
        <textarea name="mensaje" className="min-h-24 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm normal-case text-white outline-none focus:border-[#4f46e5]" />
      </label>
      <button className="rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#06b6d4] px-5 py-3 text-sm font-black text-white">Enviar solicitud</button>
      {estado && <p className="text-sm font-bold text-[#06b6d4]">{estado}</p>}
    </form>
  );
}
