"use client";

import { useEffect, useMemo, useState } from "react";

const CONSULTAS_HUB_STORAGE_KEY = "hubya-consultas-hub";

function slugOpcionConsulta(opcion: string) {
  return opcion.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

type EstadoConsultaHub = "borrador" | "activa" | "cerrada";
type ClienteConsultaHub = { id: number; nombre: string; telefono: string; email: string; token?: string };
type RespuestaConsultaHub = { clienteId: number; opcion: string; respondidoEn: string };
type ConsultaHub = {
  id: string;
  hub: string;
  titulo: string;
  pregunta: string;
  opciones: string[];
  clientesDestinatarios: ClienteConsultaHub[];
  respuestas: RespuestaConsultaHub[];
  fechaCreacion: string;
  estado: EstadoConsultaHub;
};

type ConsultaPublicaPageProps = { params: Promise<{ token: string }> };

function leerConsultas() {
  if (typeof window === "undefined") return [] as ConsultaHub[];
  try {
    return JSON.parse(window.localStorage.getItem(CONSULTAS_HUB_STORAGE_KEY) || "[]") as ConsultaHub[];
  } catch {
    return [] as ConsultaHub[];
  }
}

export default function ConsultaPublicaPage({ params }: ConsultaPublicaPageProps) {
  const [token, setToken] = useState("");
  const [consultas, setConsultas] = useState<ConsultaHub[]>([]);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState("");
  const [respuestaEnviada, setRespuestaEnviada] = useState(false);

  useEffect(() => {
    params.then((valor) => setToken(valor.token));
    setConsultas(leerConsultas());
  }, [params]);

  const contexto = useMemo(() => {
    for (const consulta of consultas) {
      const cliente = consulta.clientesDestinatarios.find((destinatario) => destinatario.token === token);
      if (cliente) return { consulta, cliente };
    }
    return null;
  }, [consultas, token]);

  const respuestaExistente = contexto?.consulta.respuestas.find((respuesta) => respuesta.clienteId === contexto.cliente.id);

  useEffect(() => {
    if (!contexto || respuestaExistente || respuestaEnviada || typeof window === "undefined") return;
    const respuestaUrl = new URLSearchParams(window.location.search).get("respuesta");
    if (!respuestaUrl) return;
    const opcion = contexto.consulta.opciones.find((item) => slugOpcionConsulta(item) === respuestaUrl);
    if (opcion) setOpcionSeleccionada(opcion);
  }, [contexto, respuestaEnviada, respuestaExistente]);

  function enviarRespuesta() {
    if (!contexto || !opcionSeleccionada) return;
    const actualizadas = consultas.map((consulta) => {
      if (consulta.id !== contexto.consulta.id) return consulta;
      const respuestas = consulta.respuestas.filter((respuesta) => respuesta.clienteId !== contexto.cliente.id);
      return { ...consulta, respuestas: [...respuestas, { clienteId: contexto.cliente.id, opcion: opcionSeleccionada, respondidoEn: new Date().toISOString() }] };
    });
    window.localStorage.setItem(CONSULTAS_HUB_STORAGE_KEY, JSON.stringify(actualizadas));
    setConsultas(actualizadas);
    setRespuestaEnviada(true);
  }

  useEffect(() => {
    if (contexto && opcionSeleccionada && !respuestaExistente && !respuestaEnviada) enviarRespuesta();
  }, [contexto, opcionSeleccionada, respuestaEnviada, respuestaExistente]);

  if (!contexto) {
    return <main className="flex min-h-screen items-center justify-center bg-[#eef2e8] p-4 text-[#182018]"><section className="max-w-lg rounded-2xl border border-[#cfd8c6] bg-white p-6 text-center shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#66745c]">HUBYA</p><h1 className="mt-2 text-2xl font-black">Consulta no encontrada</h1><p className="mt-2 text-sm font-semibold text-[#66745c]">El link no existe en este navegador o todavía no fue generado.</p></section></main>;
  }

  if (respuestaEnviada || respuestaExistente) {
    return <main className="flex min-h-screen items-center justify-center bg-[#eef2e8] p-4 text-[#182018]"><section className="max-w-lg rounded-2xl border border-[#b7d6ba] bg-white p-6 text-center shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#66745c]">{contexto.consulta.hub}</p><h1 className="mt-2 text-2xl font-black">Gracias. Tu respuesta fue registrada.</h1><p className="mt-2 text-sm font-semibold text-[#66745c]">HUBYA ya recibió tu respuesta para esta consulta.</p></section></main>;
  }

  return (
    <main className="min-h-screen bg-[#eef2e8] px-4 py-8 text-[#182018]">
      <section className="mx-auto max-w-2xl rounded-2xl border border-[#cfd8c6] bg-white p-5 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#66745c]">Consulta del Hub</p>
        <h1 className="mt-2 text-2xl font-black">{contexto.consulta.hub}</h1>
        <p className="mt-4 rounded-xl border border-[#d8dfd1] bg-[#f8faf5] p-4 text-lg font-black">{contexto.consulta.pregunta}</p>
        <div className="mt-5 grid gap-3">
          {contexto.consulta.opciones.map((opcion) => <button key={opcion} onClick={() => setOpcionSeleccionada(opcion)} className={`rounded-xl border p-4 text-left text-lg font-black transition ${opcionSeleccionada === opcion ? "border-[#1f2a1d] bg-[#1f2a1d] text-white" : "border-[#cfd8c6] bg-white hover:bg-[#eef2e8]"}`}>{opcion}</button>)}
        </div>
        <button onClick={enviarRespuesta} disabled={!opcionSeleccionada || contexto.consulta.estado !== "activa"} className="mt-5 h-11 w-full rounded-xl bg-[#1f2a1d] px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">Enviar respuesta</button>
        <p className="mt-3 text-xs font-semibold text-[#66745c]">Privacidad: este link es individual. No muestra nombres ni respuestas de otros clientes.</p>
      </section>
    </main>
  );
}
