"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { DecisionSolicitudHub, SolicitudHub } from "@/lib/data/solicitudes";

function etiquetaEstado(solicitud: SolicitudHub) {
  if (solicitud.estado === "pendiente") return "Pendiente";
  const decision = solicitud.estado === "aprobada" ? "Aprobada" : "Rechazada";
  return `${decision} — mail ${solicitud.mailEnviado ? "enviado" : "no enviado"}`;
}

export default function SolicitudesIngresoPage() {
  const [items, setItems] = useState<SolicitudHub[]>([]);
  const [msg, setMsg] = useState("");
  const [mensajesRechazo, setMensajesRechazo] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch("/api/solicitudes-hub", { cache: "no-store" });
    setItems(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function responder(solicitudId: string, decision: DecisionSolicitudHub) {
    setMsg("Procesando...");
    const res = await fetch("/api/solicitudes-hub/responder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ solicitudId, decision, mensajeOpcional: decision === "rechazada" ? mensajesRechazo[solicitudId] : "" }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setMsg(data.error || "No se pudo actualizar la solicitud.");
      return;
    }
    const estado = decision === "aprobada" ? "Aprobada" : "Rechazada";
    setMsg(data.mailEnviado ? `${estado} — mail enviado` : (data.advertencia || `${estado} — mail no enviado`));
    await load();
  }

  return <main className="min-h-screen bg-[#f6f8f3] p-6 text-[#1f2a1d]"><div className="mx-auto max-w-7xl"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#66745c]">HubYa Operativo</p><h1 className="text-2xl font-black">Solicitudes de ingreso</h1><p className="text-sm font-semibold text-[#66745c]">Altas recibidas desde la web pública. Aprobá o rechazá y se enviará el mail administrativo automáticamente.</p></div><Link href="/operativo" className="rounded-lg border border-[#cfd8c6] bg-white px-4 py-2 text-xs font-black">Volver al panel</Link></div>{msg && <p className="mb-3 rounded-lg border border-[#b7d6ba] bg-[#f2fff4] p-3 text-xs font-black">{msg}</p>}<div className="overflow-x-auto rounded-xl border border-[#d8dfd1] bg-white"><table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr>{["Nombre","WhatsApp","Email","Hub solicitado","Mensaje","Fecha","Estado","Mensaje administrativo opcional","Acciones"].map((h) => <th key={h} className="border p-2">{h}</th>)}</tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={9} className="border p-6 text-center font-bold text-[#66745c]">Todavía no hay solicitudes públicas.</td></tr> : items.map((s) => <tr key={s.id}><td className="border p-2 font-black">{s.nombre} {s.apellido}</td><td className="border p-2">{s.whatsapp}</td><td className="border p-2">{s.email || "Sin email"}</td><td className="border p-2">{s.hubSolicitadoNombre}</td><td className="border p-2">{s.mensaje || s.servicio}</td><td className="border p-2">{new Date(s.fecha).toLocaleString("es-AR")}</td><td className="border p-2 font-black"><span>{etiquetaEstado(s)}</span>{s.errorMail && <p className="mt-1 text-[10px] font-semibold text-[#743c3c]">{s.errorMail}</p>}</td><td className="border p-2"><textarea disabled={s.estado !== "pendiente"} value={mensajesRechazo[s.id] ?? s.mensajeAdministrativo ?? ""} onChange={(e) => setMensajesRechazo((actual) => ({ ...actual, [s.id]: e.target.value }))} placeholder="Mensaje administrativo opcional" className="min-h-20 w-60 rounded-lg border border-[#cfd8c6] p-2 text-xs disabled:bg-[#f6f8f3]" /></td><td className="border p-2"><div className="flex gap-1"><button disabled={s.estado !== "pendiente"} onClick={() => responder(s.id, "aprobada")} className="rounded bg-[#1f2a1d] px-2 py-1 font-black text-white disabled:opacity-40">Aprobar</button><button disabled={s.estado !== "pendiente"} onClick={() => responder(s.id, "rechazada")} className="rounded border border-[#d6b7b7] bg-[#fff7f7] px-2 py-1 font-black text-[#743c3c] disabled:opacity-40">Rechazar</button></div></td></tr>)}</tbody></table></div></div></main>;
}
