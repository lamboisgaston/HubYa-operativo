"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HubPublico, ModuloOperativoHub, ParametrosJardinerosYaHub } from "@/lib/data/hubs";

const parametrosVacios: ParametrosJardinerosYaHub = { valorHoraTrabajo: 0, comisionResponsableCuadrillaPorcentaje: 0, traslado: 0, aceite: 0, nafta: 0, valorHoraCortadoraCesped: 0, valorHoraBordeadora: 0, valorHoraMaquinaEmpuje: 0, mostrarEnWebPublica: false };

function normalizarParametrosJardinerosYa(input?: Partial<ParametrosJardinerosYaHub>): ParametrosJardinerosYaHub { return { ...parametrosVacios, ...input, mostrarEnWebPublica: Boolean(input?.mostrarEnWebPublica) }; }

const modulos: Array<{ valor: ModuloOperativoHub; etiqueta: string }> = [
  { valor: "jardinerosya", etiqueta: "JardinerosYa" },
  { valor: "fumigadoresya", etiqueta: "FumigadoresYa" },
  { valor: "comerciarya", etiqueta: "ComerciarYa" },
  { valor: "pileterosya", etiqueta: "PileterosYa" },
  { valor: "otro", etiqueta: "Otro" },
];

const campos: Array<{ clave: keyof Omit<ParametrosJardinerosYaHub, "mostrarEnWebPublica">; etiqueta: string; ayuda?: string }> = [
  { clave: "valorHoraTrabajo", etiqueta: "Valor hora de trabajo" },
  { clave: "comisionResponsableCuadrillaPorcentaje", etiqueta: "Comisión responsable de cuadrilla (%)", ayuda: "Porcentaje destinado al responsable que coordina o maneja la cuadrilla." },
  { clave: "traslado", etiqueta: "Valor de traslado" },
  { clave: "aceite", etiqueta: "Costo de aceite" },
  { clave: "nafta", etiqueta: "Costo de nafta" },
  { clave: "valorHoraCortadoraCesped", etiqueta: "Valor hora cortadora de césped" },
  { clave: "valorHoraBordeadora", etiqueta: "Valor hora bordeadora" },
  { clave: "valorHoraMaquinaEmpuje", etiqueta: "Valor hora máquina de empuje" },
];

export function HubParametrosOperativosEditor({ hub }: { hub: HubPublico }) {
  const router = useRouter();
  const [moduloOperativo, setModuloOperativo] = useState<ModuloOperativoHub>(hub.moduloOperativo || "otro");
  const [parametros, setParametros] = useState(() => normalizarParametrosJardinerosYa(hub.parametrosOperativos?.jardinerosYa));
  const [nivelEstabilidad, setNivelEstabilidad] = useState(() => Math.min(10, Math.max(1, Math.round(Number(hub.nivelEstabilidad || 8)))));
  const [estado, setEstado] = useState("");

  async function guardar() {
    setEstado("Guardando parámetros operativos...");
    const respuesta = await fetch(`/api/hubs/${hub.slug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moduloOperativo, nivelEstabilidad, parametrosOperativos: { jardinerosYa: parametros } }) });
    if (respuesta.ok) {
      setEstado("Parámetros operativos del Hub guardados correctamente.");
      router.refresh();
      return;
    }
    setEstado("No se pudieron guardar los parámetros operativos.");
  }

  return <section className="rounded-[2rem] border border-[#bfd3b8] bg-[#fbfdf8] p-6 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#5d7032]">Parámetros operativos del Hub</p><h2 className="mt-1 text-2xl font-black">Parámetros operativos del Hub</h2><p className="mt-2 max-w-3xl text-sm font-semibold text-[#66745c]">Configurá las reglas económicas y operativas que usa este Hub para calcular reportes y organizar servicios.</p></div><button onClick={guardar} className="rounded-2xl bg-[#1f2a1d] px-4 py-3 text-sm font-black text-white">Guardar parámetros</button></div>
    <div className="mt-5 grid gap-3 md:grid-cols-2"><label className="grid gap-1 text-xs font-black uppercase text-[#66745c]">Módulo operativo del Hub<select value={moduloOperativo} onChange={(e) => setModuloOperativo(e.target.value as ModuloOperativoHub)} className="h-11 rounded-xl border border-[#cfd8c6] bg-white px-3 text-sm font-semibold normal-case outline-none">{modulos.map((modulo) => <option key={modulo.valor} value={modulo.valor}>{modulo.etiqueta}</option>)}</select></label><label className="grid gap-1 text-xs font-black uppercase text-[#66745c]">Nivel de estabilidad del Hub<input type="number" min="1" max="10" value={nivelEstabilidad} onChange={(e) => setNivelEstabilidad(Math.min(10, Math.max(1, Math.round(Number(e.target.value || 1)))))} className="h-11 rounded-xl border border-[#cfd8c6] bg-white px-3 text-sm font-semibold normal-case outline-none" /><span className="text-[11px] font-semibold normal-case text-[#66745c]">Valor manual de 1 a 10 visible en ficha, vista previa y mail.</span></label></div>
    {moduloOperativo === "jardinerosya" && <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{campos.map((campo) => <label key={campo.clave} className="grid gap-1 rounded-2xl border border-[#d8dfd1] bg-white p-3 text-xs font-black uppercase text-[#66745c]">{campo.etiqueta}<input type="number" min="0" value={parametros[campo.clave]} onChange={(e) => setParametros((actual) => ({ ...actual, [campo.clave]: Number(e.target.value || 0) }))} className="h-10 rounded-xl border border-[#cfd8c6] px-3 text-sm font-semibold normal-case outline-none" />{campo.ayuda && <span className="text-[11px] font-semibold normal-case text-[#66745c]">{campo.ayuda}</span>}</label>)}<label className="flex items-center gap-2 rounded-2xl border border-[#d8dfd1] bg-white p-3 text-sm font-black"><input type="checkbox" checked={parametros.mostrarEnWebPublica} onChange={(e) => setParametros((actual) => ({ ...actual, mostrarEnWebPublica: e.target.checked }))} /> Mostrar parámetros operativos en web pública</label></div>}
    <p className="mt-4 rounded-xl border border-[#d8dfd1] bg-white p-3 text-sm font-bold text-[#4f5f47]">JardinerosYa funciona como algoritmo operativo para Hubs de espacios verdes. La ficha del Hub define las reglas base del servicio.</p>
    {estado && <p className="mt-3 rounded-xl border border-[#cfe0c8] bg-[#eef7ea] px-3 py-2 text-sm font-black text-[#2f6d32]">{estado}</p>}
  </section>;
}
