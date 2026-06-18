"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Cliente, Hub } from "@/lib/data/hubs";
import type { MensajeOperativo, RespuestaOperativa } from "@/lib/data/mensajes";

const opcionesIniciales = ["Confirmo participación.", "Necesito más información.", "Quiero que me contacten.", "No me interesa por ahora."];
const estados = ["nueva", "leída", "pendiente", "respondida", "archivada"];
const mailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
const fecha = (valor?: string) => valor ? new Date(valor).toLocaleString("es-AR") : "—";
const hubNombre = (hubs: Hub[], id: string) => hubs.find((hub) => hub.id === id)?.nombre || "Hub sin asignar";
const contactoNombre = (contactos: Cliente[], id: string) => contactos.find((c) => c.id === id)?.nombre || "Contacto sin nombre";
const asuntoMensaje = (mensajes: MensajeOperativo[], id?: string) => mensajes.find((m) => m.id === id)?.asunto || "Respuesta sin envío asociado";
const tipoMensaje = (m: MensajeOperativo) => (m.opcionesRespuesta?.length ? "Encuesta" : "Mensaje simple");

function conteos(mensaje: MensajeOperativo) {
  const ds = mensaje.destinatarios || [];
  return {
    total: ds.length,
    sinEmail: ds.filter((d) => !mailOk(d.email)).length,
    enviados: ds.filter((d) => ["enviado", "enviado a proveedor", "sin respuesta", "respondido", "entregado"].includes(d.estado)).length,
    errores: ds.filter((d) => d.estado === "error").length,
    respondidos: ds.filter((d) => d.estado === "respondido").length,
  };
}

export function MensajesYRespuestasPanel({ hubs, contactos, mensajes, respuestas, hubActual }: { hubs: Hub[]; contactos: Cliente[]; mensajes: MensajeOperativo[]; respuestas: RespuestaOperativa[]; hubActual?: Hub }) {
  const router = useRouter();
  const contactosBase = hubActual ? contactos.filter((contacto) => contacto.hubId === hubActual.id) : contactos;
  const [estadoUi, setEstadoUi] = useState("");
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [alcanceTodos, setAlcanceTodos] = useState(false);
  const [hubIds, setHubIds] = useState<string[]>(hubActual ? [hubActual.id] : []);
  const [clienteIds, setClienteIds] = useState<string[]>([]);
  const [asunto, setAsunto] = useState("Información importante del Hub");
  const [titulo, setTitulo] = useState("Acerca de HubYa");
  const [mensaje, setMensaje] = useState("Hola {nombre}, te compartimos información importante sobre {hub}.");
  const [incluyeEncuesta, setIncluyeEncuesta] = useState(false);
  const [preguntaEncuesta, setPreguntaEncuesta] = useState("¿Cómo querés avanzar?");
  const [opciones, setOpciones] = useState(opcionesIniciales);
  const [detalleId, setDetalleId] = useState(mensajes[0]?.id || "");
  const [emailPrueba, setEmailPrueba] = useState("lamboisgaston@gmail.com");

  const hubsSeleccionados = useMemo(() => alcanceTodos ? hubs.map((h) => h.id) : hubIds, [alcanceTodos, hubIds, hubs]);
  const contactosDelAlcance = useMemo(() => contactosBase.filter((c) => hubsSeleccionados.includes(c.hubId)), [contactosBase, hubsSeleccionados]);
  const destinatariosSeleccionados = useMemo(() => contactosDelAlcance.filter((c) => clienteIds.includes(c.id)), [contactosDelAlcance, clienteIds]);
  const validos = destinatariosSeleccionados.filter((c) => mailOk(c.email));
  const sinEmail = destinatariosSeleccionados.filter((c) => !mailOk(c.email));
  const detalle = mensajes.find((m) => m.id === detalleId) || mensajes[0];
  const respuestasDeEncuesta = respuestas.filter((r) => r.mensajeId && mensajes.find((m) => m.id === r.mensajeId)?.opcionesRespuesta?.length);

  function toggle(valor: string, lista: string[], setter: (v: string[]) => void) { setter(lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor]); }
  function seleccionarTodosContactos() { setClienteIds(contactosDelAlcance.filter((c) => mailOk(c.email)).map((c) => c.id)); }
  function limpiarContactos() { setClienteIds([]); }
  function cambiarTodosHubs(checked: boolean) { setAlcanceTodos(checked); setHubIds(checked ? hubs.map((h) => h.id) : []); setClienteIds([]); }
  function cambiarHub(id: string) { setAlcanceTodos(false); setHubIds(hubIds.includes(id) ? hubIds.filter((x) => x !== id) : [...hubIds, id]); setClienteIds([]); }

  async function enviarMensaje(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validos.length === 0) { setEstadoUi("Seleccioná al menos un contacto con email válido."); return; }
    const opcionesRespuesta = incluyeEncuesta ? opciones.map((o) => o.trim()).filter(Boolean) : [];
    setEstadoUi("Generando envío y enviando a Resend...");
    const res = await fetch("/api/operativo/mensajes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ asunto, titulo, mensaje, canal: "email", alcance: "seleccion", hubIds: hubsSeleccionados, clienteIds: validos.map((c) => c.id), preguntaEncuesta: incluyeEncuesta ? preguntaEncuesta : "", opcionesRespuesta }) });
    const data = await res.json().catch(() => ({}));
    setEstadoUi(data.message || (res.ok ? "Envío generado." : "No se pudo generar el envío."));
    if (res.ok) { setMostrarNuevo(false); router.refresh(); }
  }

  async function enviarPrueba() {
    const opcionesRespuesta = incluyeEncuesta ? opciones.map((o) => o.trim()).filter(Boolean) : [];
    setEstadoUi("Enviando prueba...");
    const res = await fetch("/api/operativo/mensajes/prueba", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ asunto, titulo, mensaje, preguntaEncuesta: incluyeEncuesta ? preguntaEncuesta : "", opcionesRespuesta, emailPrueba }) });
    const data = await res.json().catch(() => ({}));
    setEstadoUi(`${data.message || "Resultado de prueba"} ProviderMessageId: ${data.providerMessageId || "—"}. Error: ${data.error || "—"}`);
  }

  async function cargarRespuesta(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const body = Object.fromEntries(new FormData(form)); const res = await fetch("/api/operativo/mensajes/respuestas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const data = await res.json().catch(() => ({})); setEstadoUi(data.message || "Respuesta cargada."); if (res.ok) { form.reset(); router.refresh(); } }
  async function actualizarRespuesta(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const body = Object.fromEntries(new FormData(event.currentTarget)); const res = await fetch("/api/operativo/mensajes/respuestas", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const data = await res.json().catch(() => ({})); setEstadoUi(data.message || "Respuesta actualizada."); if (res.ok) router.refresh(); }

  return <section className="grid gap-5">
    <header className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#7a8a6d]">Operativo</p><h1 className="mt-1 text-3xl font-black">Mensajes y encuestas</h1>
      <p className="mt-2 max-w-3xl text-sm font-semibold text-[#66745c]">Enviar un mensaje en HubYa es elegir Hub, elegir personas, escribir y enviar. Si hace falta encuesta, se agrega; si no, queda como mensaje simple.</p>
      {estadoUi && <p className="mt-4 rounded-2xl border border-[#cfd8c6] bg-[#fffdf2] p-3 text-sm font-black">{estadoUi}</p>}
    </header>

    <section className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="text-2xl font-black">Nuevo mensaje</h2><p className="text-sm font-semibold text-[#66745c]">Una acción principal: crear mensaje y enviarlo.</p></div><button onClick={() => setMostrarNuevo((v) => !v)} className="rounded-2xl bg-[#1f2a1d] px-6 py-4 text-sm font-black text-white">Crear nuevo mensaje</button></div>
      {mostrarNuevo && <form onSubmit={enviarMensaje} className="mt-6 grid gap-5">
        <div className="rounded-3xl bg-[#f8faf5] p-5"><h3 className="text-lg font-black">Paso 1: Seleccionar alcance</h3><label className="mt-3 block rounded-2xl bg-white p-3 text-sm font-black"><input type="checkbox" className="mr-2" checked={alcanceTodos} onChange={(e) => cambiarTodosHubs(e.target.checked)} />Todos los Hubs</label><div className="mt-3 grid gap-2 md:grid-cols-3">{hubs.map((hub) => <label key={hub.id} className="rounded-2xl bg-white p-3 text-sm font-black"><input type="checkbox" className="mr-2" checked={hubsSeleccionados.includes(hub.id)} onChange={() => cambiarHub(hub.id)} disabled={Boolean(hubActual)} />{hub.nombre}</label>)}</div></div>
        <div className="rounded-3xl bg-[#f8faf5] p-5"><div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><h3 className="text-lg font-black">Paso 2: Seleccionar destinatarios</h3><p className="text-sm font-black text-[#66745c]">Seleccionados: {validos.length} de {contactosDelAlcance.filter((c) => mailOk(c.email)).length} contactos con email válido</p></div><div className="flex gap-2"><button type="button" onClick={seleccionarTodosContactos} className="rounded-xl border px-3 py-2 text-xs font-black">Todos con email válido</button><button type="button" onClick={limpiarContactos} className="rounded-xl border px-3 py-2 text-xs font-black">Limpiar</button></div></div><div className="mt-3 max-h-72 overflow-auto rounded-2xl border border-[#d8dfd1] bg-white p-2">{contactosDelAlcance.length === 0 ? <p className="p-3 text-sm font-bold text-[#66745c]">Elegí uno o más Hubs para ver contactos.</p> : contactosDelAlcance.map((c) => { const ok = mailOk(c.email); return <label key={c.id} className={`block rounded-xl p-2 text-sm font-bold ${ok ? "" : "text-[#8a6d6d]"}`}><input type="checkbox" className="mr-2" checked={clienteIds.includes(c.id)} onChange={() => toggle(c.id, clienteIds, setClienteIds)} disabled={!ok} />{c.nombre} · {hubNombre(hubs, c.hubId)} · {ok ? c.email : "Sin email cargado"}</label>; })}</div></div>
        <div className="rounded-3xl bg-[#f8faf5] p-5"><h3 className="text-lg font-black">Paso 3: Escribir mensaje</h3><div className="mt-3 grid gap-3 md:grid-cols-2"><input required value={asunto} onChange={(e) => setAsunto(e.target.value)} placeholder="Asunto" className="h-12 rounded-2xl border border-[#cfd8c6] px-4 text-sm font-bold" /><input required value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" className="h-12 rounded-2xl border border-[#cfd8c6] px-4 text-sm font-bold" /></div><textarea required value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Mensaje" className="mt-3 min-h-28 w-full rounded-2xl border border-[#cfd8c6] p-4 text-sm font-semibold" /><p className="mt-2 text-xs font-bold text-[#66745c]">Variables disponibles: {'{nombre}'}, {'{hub}'}, {'{fecha}'}.</p></div>
        <div className="rounded-3xl bg-[#f8faf5] p-5"><h3 className="text-lg font-black">Paso 4: ¿Incluye encuesta?</h3><div className="mt-3 flex flex-col gap-2 md:flex-row"><button type="button" onClick={() => setIncluyeEncuesta(false)} className={`rounded-2xl px-4 py-3 text-sm font-black ${!incluyeEncuesta ? "bg-[#1f2a1d] text-white" : "bg-white"}`}>No, solo mensaje</button><button type="button" onClick={() => setIncluyeEncuesta(true)} className={`rounded-2xl px-4 py-3 text-sm font-black ${incluyeEncuesta ? "bg-[#1f2a1d] text-white" : "bg-white"}`}>Sí, agregar encuesta</button></div>{incluyeEncuesta && <div className="mt-4 rounded-2xl bg-white p-4"><input value={preguntaEncuesta} onChange={(e) => setPreguntaEncuesta(e.target.value)} className="h-12 w-full rounded-xl border border-[#cfd8c6] px-3 text-sm font-bold" placeholder="Pregunta de encuesta" />{opciones.map((opcion, i) => <div key={i} className="mt-2 flex gap-2"><input value={opcion} onChange={(e) => setOpciones((actual) => actual.map((x, idx) => idx === i ? e.target.value : x))} className="h-10 flex-1 rounded-xl border border-[#cfd8c6] px-3 text-sm font-bold" /><button type="button" onClick={() => setOpciones((actual) => actual.filter((_, idx) => idx !== i))} className="rounded-xl border px-3 text-xs font-black">Eliminar</button></div>)}<button type="button" onClick={() => setOpciones((a) => [...a, ""])} className="mt-2 rounded-full bg-[#1f2a1d] px-3 py-1 text-xs font-black text-white">Agregar opción</button></div>}</div>
        <div className="rounded-3xl border border-[#d8dfd1] bg-white p-5"><h3 className="text-lg font-black">Vista previa</h3><p className="mt-2 text-sm font-bold">Hubs: {hubsSeleccionados.map((id) => hubNombre(hubs, id)).join(", ") || "—"}</p><p className="text-sm font-bold">Destinatarios: {validos.length} con email válido · Sin email: {sinEmail.length}</p><div className="mt-2 max-h-32 overflow-auto text-xs font-semibold">{destinatariosSeleccionados.map((c) => <p key={c.id}>{c.nombre} — {c.email || "Sin email cargado"} — {hubNombre(hubs, c.hubId)}</p>)}</div><p className="mt-3 text-sm font-black">Asunto: {asunto}</p><p className="text-sm font-black">Título: {titulo}</p><p className="text-sm font-semibold">{mensaje}</p><p className="mt-2 text-sm font-black">Tipo: {incluyeEncuesta ? "Mensaje con encuesta" : "Mensaje simple"}</p>{incluyeEncuesta && <ul className="mt-1 list-disc pl-5 text-sm font-semibold"><li>{preguntaEncuesta}</li>{opciones.filter(Boolean).map((o) => <li key={o}>{o}</li>)}</ul>}<div className="mt-4 flex flex-col gap-2 md:flex-row"><input value={emailPrueba} onChange={(e) => setEmailPrueba(e.target.value)} className="h-12 flex-1 rounded-2xl border border-[#cfd8c6] px-4 text-sm font-bold" /><button type="button" onClick={enviarPrueba} className="rounded-2xl border border-[#1f2a1d] px-5 py-3 text-sm font-black">Enviar prueba</button><button className="rounded-2xl bg-[#1f2a1d] px-5 py-3 text-sm font-black text-white">Confirmar y enviar</button></div></div>
      </form>}</section>

    <section className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">Envíos realizados</h2><div className="mt-4 grid gap-3">{mensajes.length === 0 ? <p className="rounded-2xl bg-[#f8faf5] p-5 text-sm font-bold text-[#66745c]">Sin envíos realizados.</p> : mensajes.map((m) => { const c = conteos(m); return <article key={m.id} className="rounded-2xl border border-[#d8dfd1] p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-bold text-[#66745c]">{fecha(m.fecha)}</p><h3 className="font-black">Asunto: {m.asunto}</h3><p className="text-sm font-semibold text-[#66745c]">{m.hubsIncluidos.map((id) => hubNombre(hubs, id)).join(", ") || "—"} · {c.total} destinatarios · Tipo: {tipoMensaje(m)} · Estado: {m.estado}</p><p className="text-sm font-black text-[#66745c]">{tipoMensaje(m) === "Encuesta" ? `${c.respondidos} respuestas recibidas` : `${c.enviados} enviados a proveedor`}</p></div><button type="button" onClick={() => setDetalleId(m.id)} className="rounded-xl bg-[#1f2a1d] px-4 py-2 text-xs font-black text-white">Ver detalle</button></div></article>; })}</div></section>

    {detalle && <section className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">Detalle del envío</h2>{(() => { const c = conteos(detalle); return <div className="mt-3 grid gap-2 text-sm md:grid-cols-6">{[["Destinatarios", c.total], ["Enviados a proveedor", c.enviados], ["Errores", c.errores], ["Sin email", c.sinEmail], ["Respondidos", c.respondidos], ["Sin respuesta", Math.max(0, c.enviados - c.respondidos)]].map(([k, v]) => <span key={k} className="rounded-xl bg-[#f8faf5] p-3 font-black">{k}: {v}</span>)}</div>; })()}<div className="mt-4 overflow-x-auto rounded-2xl border border-[#d8dfd1]"><table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left uppercase text-[#66745c]"><tr>{["Contacto", "Email", "Hub", "Estado", "Resend", "Respuesta"].map((h) => <th key={h} className="border p-2">{h}</th>)}</tr></thead><tbody>{detalle.destinatarios.map((d) => <tr key={d.id}><td className="border p-2 font-black">{d.nombre}</td><td className="border p-2">{d.email || "Sin email cargado"}</td><td className="border p-2">{d.hubNombre}</td><td className="border p-2 font-black">{d.estado}</td><td className="border p-2">{d.providerMessageId || d.resendId || d.errorMessage || "—"}</td><td className="border p-2">{d.respuestaElegida || "—"}</td></tr>)}</tbody></table></div></section>}

    <section className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">Respuestas recibidas</h2><div className="mt-4 grid gap-3">{respuestasDeEncuesta.length === 0 ? <p className="rounded-2xl bg-[#f8faf5] p-5 text-sm font-bold text-[#66745c]">Todavía no hay respuestas de encuestas.</p> : respuestasDeEncuesta.map((r) => <article key={r.id} className="rounded-2xl border border-[#d8dfd1] p-4"><h3 className="font-black">{contactoNombre(contactos, r.clienteId)} · {hubNombre(hubs, r.hubId)}</h3><p className="text-xs font-bold text-[#66745c]">{fecha(r.fecha)} · Pregunta: {asuntoMensaje(mensajes, r.mensajeId)}</p><p className="mt-2 text-sm font-semibold">Respuesta elegida: {r.opcionTexto || r.texto} · Estado: {r.estado}</p><form onSubmit={actualizarRespuesta} className="mt-3 grid gap-2 md:grid-cols-[150px_1fr_1fr_auto]"><input type="hidden" name="respuestaId" value={r.id} /><select name="estado" defaultValue={r.estado} className="h-10 rounded-xl border border-[#cfd8c6] px-2 text-xs font-bold">{estados.map((e) => <option key={e}>{e}</option>)}</select><input name="notaInterna" placeholder="Nota interna" className="h-10 rounded-xl border border-[#cfd8c6] px-3 text-xs font-bold" /><input name="respuestaOperador" placeholder="Responder" className="h-10 rounded-xl border border-[#cfd8c6] px-3 text-xs font-bold" /><button className="rounded-xl bg-[#1f2a1d] px-3 py-2 text-xs font-black text-white">Guardar</button></form></article>)}</div><form onSubmit={cargarRespuesta} className="mt-5 rounded-2xl bg-[#f8faf5] p-4"><h3 className="font-black">Cargar respuesta manual</h3><div className="mt-3 grid gap-3 md:grid-cols-3"><select name="clienteId" required className="h-12 rounded-2xl border border-[#cfd8c6] px-3 text-sm font-bold"><option value="">Contacto</option>{contactosBase.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select><select name="hubId" required defaultValue={hubActual?.id || ""} className="h-12 rounded-2xl border border-[#cfd8c6] px-3 text-sm font-bold"><option value="">Hub</option>{hubs.map((h) => <option key={h.id} value={h.id}>{h.nombre}</option>)}</select><select name="mensajeId" className="h-12 rounded-2xl border border-[#cfd8c6] px-3 text-sm font-bold"><option value="">Envío relacionado</option>{mensajes.filter((m) => m.opcionesRespuesta?.length).map((m) => <option key={m.id} value={m.id}>{m.asunto}</option>)}</select></div><div className="mt-3 grid gap-3 md:grid-cols-3"><input name="opcionTexto" placeholder="Respuesta" className="h-12 rounded-2xl border border-[#cfd8c6] px-3 text-sm font-bold" /><input name="fecha" type="datetime-local" className="h-12 rounded-2xl border border-[#cfd8c6] px-3 text-sm font-bold" /><input name="notaInterna" placeholder="Nota interna" className="h-12 rounded-2xl border border-[#cfd8c6] px-3 text-sm font-bold" /></div><input type="hidden" name="canal" value="manual" /><input type="hidden" name="estado" value="nueva" /><textarea name="texto" required placeholder="Detalle de la respuesta recibida por WhatsApp, Gmail o llamada" className="mt-3 min-h-20 w-full rounded-2xl border border-[#cfd8c6] p-4 text-sm font-semibold" /><button className="mt-3 rounded-2xl bg-[#1f2a1d] px-5 py-3 text-sm font-black text-white">Cargar respuesta manual</button></form></section>
  </section>;
}
