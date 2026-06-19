"use client";

import { useState } from "react";
import type { TarifaClienteHub } from "@/lib/data/hubs";

const tarifasCliente: Array<{ value: TarifaClienteHub; label: string }> = [
  { value: "tarifa_1", label: "Tarifa 1" },
  { value: "tarifa_2", label: "Tarifa 2" },
  { value: "tarifa_3", label: "Tarifa 3" },
  { value: "sin_tarifa", label: "Sin tarifa asignada" },
];

export function TarifaClienteSelect({ contactoId, tarifaInicial }: { contactoId: string; tarifaInicial: TarifaClienteHub }) {
  const [tarifa, setTarifa] = useState<TarifaClienteHub>(tarifaInicial);
  const [estado, setEstado] = useState<"idle" | "guardando" | "guardado" | "error">("idle");

  async function guardarTarifa(tarifaCliente: TarifaClienteHub) {
    const anterior = tarifa;
    setTarifa(tarifaCliente);
    setEstado("guardando");
    try {
      const respuesta = await fetch(`/api/contactos/${encodeURIComponent(contactoId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tarifaCliente }),
      });
      if (!respuesta.ok) throw new Error("No se pudo guardar la tarifa.");
      setEstado("guardado");
    } catch {
      setTarifa(anterior);
      setEstado("error");
    }
  }

  return (
    <div className="grid gap-1">
      <select value={tarifa} onChange={(e) => guardarTarifa(e.target.value as TarifaClienteHub)} className="min-w-40 rounded-xl border border-[#cfd8c6] bg-white px-3 py-2 text-xs font-black text-[#1f2a1d]">
        {tarifasCliente.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
      <span className={`text-[10px] font-black ${estado === "error" ? "text-[#743c3c]" : "text-[#66745c]"}`}>
        {estado === "guardando" ? "Guardando tarifa…" : estado === "guardado" ? "Tarifa guardada" : estado === "error" ? "Error al guardar" : "Categoría tarifaria del cliente"}
      </span>
    </div>
  );
}
