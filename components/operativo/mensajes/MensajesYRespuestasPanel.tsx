import { actualizarRespuestaAction, cargarRespuestaAction, crearMensajeAction } from "@/app/operativo/mensajes/actions";
import type { Cliente, Hub } from "@/lib/data/hubs";
import type { MensajeOperativo, RespuestaOperativa } from "@/lib/data/mensajes";

function fecha(valor: string) {
  return valor ? new Date(valor).toLocaleString("es-AR") : "—";
}

function contactoNombre(contactos: Cliente[], id: string) {
  return contactos.find((contacto) => contacto.id === id)?.nombre || "Contacto sin nombre";
}

function hubNombre(hubs: Hub[], id: string) {
  return hubs.find((hub) => hub.id === id)?.nombre || "Hub sin asignar";
}

function mensajeAsunto(mensajes: MensajeOperativo[], id?: string) {
  return mensajes.find((mensaje) => mensaje.id === id)?.asunto || "Respuesta sin mensaje asociado";
}

export function MensajesYRespuestasPanel({ hubs, contactos, mensajes, respuestas, hubActual }: { hubs: Hub[]; contactos: Cliente[]; mensajes: MensajeOperativo[]; respuestas: RespuestaOperativa[]; hubActual?: Hub }) {
  const contactosVisibles = hubActual ? contactos.filter((contacto) => contacto.hubId === hubActual.id) : contactos;
  const respuestasNuevas = respuestas.filter((respuesta) => respuesta.estado === "nueva").length;

  return (
    <section className="grid gap-5">
      <header className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#7a8a6d]">Mensajes y respuestas</p>
        <h1 className="mt-1 text-3xl font-black">Hunya conversa, escucha y ordena</h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold text-[#66745c]">Hunya conversa con la demanda agrupada, escucha sus respuestas y transforma esa información en organización operativa.</p>
        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-5">
          <div className="rounded-2xl bg-[#f8faf5] p-4"><p className="font-black text-[#66745c]">Enviados</p><p className="text-2xl font-black">{mensajes.length}</p></div>
          <div className="rounded-2xl bg-[#f8faf5] p-4"><p className="font-black text-[#66745c]">Respuestas</p><p className="text-2xl font-black">{respuestas.length}</p></div>
          <div className="rounded-2xl bg-[#fffdf2] p-4"><p className="font-black text-[#66745c]">Nuevas</p><p className="text-2xl font-black">{respuestasNuevas}</p></div>
          <div className="rounded-2xl bg-[#f8faf5] p-4"><p className="font-black text-[#66745c]">Sin respuesta</p><p className="text-2xl font-black">{mensajes.filter((m) => m.destinatarios.some((d) => d.estado === "enviado" || d.estado === "sin respuesta")).length}</p></div>
          <div className="rounded-2xl bg-[#f8faf5] p-4"><p className="font-black text-[#66745c]">Archivadas</p><p className="text-2xl font-black">{respuestas.filter((r) => r.estado === "archivada").length}</p></div>
        </div>
      </header>

      <form action={crearMensajeAction} className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">Enviar mensaje</h2>
        <p className="mt-1 text-sm font-semibold text-[#66745c]">Comunicación que sale desde Hunya. Queda guardada con identificador único, destinatarios y estados individuales.</p>
        {hubActual && <input type="hidden" name="alcance" value="hubs" />}
        {hubActual && <input type="hidden" name="hubIds" value={hubActual.id} />}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input name="asunto" required placeholder="Asunto" className="h-12 rounded-2xl border border-[#cfd8c6] px-4 text-sm font-bold" />
          <select name="canal" className="h-12 rounded-2xl border border-[#cfd8c6] px-4 text-sm font-bold"><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="manual">Manual</option><option value="sistema">Sistema</option></select>
          {!hubActual && <select name="alcance" className="h-12 rounded-2xl border border-[#cfd8c6] px-4 text-sm font-bold"><option value="seleccion">Hubs/usuarios seleccionados</option><option value="todos">Todos los Hubs</option></select>}
        </div>
        <textarea name="mensaje" required placeholder="Mensaje enviado" className="mt-3 min-h-28 w-full rounded-2xl border border-[#cfd8c6] p-4 text-sm font-semibold" />
        <textarea name="notaInterna" placeholder="Nota interna (no se envía al usuario)" className="mt-3 min-h-20 w-full rounded-2xl border border-[#cfd8c6] bg-[#f8faf5] p-4 text-sm font-semibold" />
        {!hubActual && <div className="mt-4 grid gap-4 lg:grid-cols-2"><div><h3 className="font-black">Hubs incluidos</h3><div className="mt-2 flex flex-wrap gap-2">{hubs.map((hub) => <label key={hub.id} className="rounded-xl border border-[#cfd8c6] bg-[#f8faf5] px-3 py-2 text-xs font-bold"><input className="mr-2" type="checkbox" name="hubIds" value={hub.id} />{hub.nombre}</label>)}</div></div><div><h3 className="font-black">Usuarios/contactos individuales</h3><div className="mt-2 max-h-48 overflow-auto rounded-2xl border border-[#d8dfd1] p-2">{contactos.map((contacto) => <label key={contacto.id} className="block rounded-xl px-2 py-1 text-xs font-bold"><input className="mr-2" type="checkbox" name="clienteIds" value={contacto.id} />{contacto.nombre} · {hubNombre(hubs, contacto.hubId)}</label>)}</div></div></div>}
        <button className="mt-4 rounded-2xl bg-[#1f2a1d] px-5 py-3 text-sm font-black text-white">Guardar y preparar envío</button>
      </form>

      <form action={cargarRespuestaAction} className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">Cargar respuesta manual</h2>
        <p className="mt-1 text-sm font-semibold text-[#66745c]">Para copiar respuestas recibidas por WhatsApp o Gmail sin perder trazabilidad.</p>
        {hubActual && <input type="hidden" name="hubSlug" value={hubActual.slug} />}
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <select name="clienteId" required className="h-12 rounded-2xl border border-[#cfd8c6] px-3 text-sm font-bold"><option value="">Usuario/contacto</option>{contactosVisibles.map((contacto) => <option key={contacto.id} value={contacto.id}>{contacto.nombre}</option>)}</select>
          <select name="hubId" required defaultValue={hubActual?.id || ""} className="h-12 rounded-2xl border border-[#cfd8c6] px-3 text-sm font-bold"><option value="">Hub</option>{hubs.map((hub) => <option key={hub.id} value={hub.id}>{hub.nombre}</option>)}</select>
          <select name="mensajeId" className="h-12 rounded-2xl border border-[#cfd8c6] px-3 text-sm font-bold"><option value="">Mensaje relacionado</option>{mensajes.map((mensaje) => <option key={mensaje.id} value={mensaje.id}>{mensaje.asunto}</option>)}</select>
          <input name="fecha" type="datetime-local" className="h-12 rounded-2xl border border-[#cfd8c6] px-3 text-sm font-bold" />
        </div>
        <textarea name="texto" required placeholder="Texto de la respuesta recibida" className="mt-3 min-h-24 w-full rounded-2xl border border-[#cfd8c6] p-4 text-sm font-semibold" />
        <textarea name="notaInterna" placeholder="Nota interna" className="mt-3 min-h-16 w-full rounded-2xl border border-[#cfd8c6] bg-[#f8faf5] p-4 text-sm font-semibold" />
        <button className="mt-4 rounded-2xl bg-[#1f2a1d] px-5 py-3 text-sm font-black text-white">Cargar respuesta manual</button>
      </form>

      <section id="respuestas" className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">Respuestas recibidas</h2>
        <div className="mt-4 grid gap-3">{respuestas.length === 0 ? <p className="rounded-2xl bg-[#f8faf5] p-5 text-sm font-bold text-[#66745c]">Todavía no hay respuestas recibidas.</p> : respuestas.map((respuesta) => <article key={respuesta.id} className="rounded-2xl border border-[#d8dfd1] p-4"><div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between"><div><h3 className="font-black">{contactoNombre(contactos, respuesta.clienteId)} · {hubNombre(hubs, respuesta.hubId)}</h3><p className="text-xs font-bold text-[#66745c]">{fecha(respuesta.fecha)} · Original: {mensajeAsunto(mensajes, respuesta.mensajeId)}</p><p className="mt-2 text-sm font-semibold">{respuesta.texto}</p>{respuesta.notaInterna && <p className="mt-2 rounded-xl bg-[#fffdf2] p-2 text-xs font-bold">Nota interna: {respuesta.notaInterna}</p>}</div><span className="rounded-full bg-[#eef2e8] px-3 py-1 text-xs font-black uppercase">{respuesta.estado}</span></div><form action={actualizarRespuestaAction} className="mt-3 grid gap-2 md:grid-cols-[160px_1fr_1fr_auto]"><input type="hidden" name="respuestaId" value={respuesta.id} />{hubActual && <input type="hidden" name="hubSlug" value={hubActual.slug} />}<select name="estado" defaultValue={respuesta.estado} className="h-10 rounded-xl border border-[#cfd8c6] px-2 text-xs font-bold"><option>nueva</option><option>leída</option><option>respondida</option><option>pendiente</option><option>archivada</option></select><input name="notaInterna" placeholder="Agregar nota interna" className="h-10 rounded-xl border border-[#cfd8c6] px-3 text-xs font-bold" /><input name="respuestaOperador" placeholder="Responder al contacto / preparar respuesta" className="h-10 rounded-xl border border-[#cfd8c6] px-3 text-xs font-bold" /><button className="rounded-xl bg-[#1f2a1d] px-3 py-2 text-xs font-black text-white">Actualizar</button></form><div className="mt-2 flex flex-wrap gap-2 text-[11px] font-black text-[#66745c]"><span>Acciones: ver respuesta</span><span>marcar como leída</span><span>responder</span><span>asignar a un Hub</span><span>convertir en tarea</span><span>archivar</span><span>eliminar</span><span>agregar nota interna</span></div>{respuesta.respuestasDelOperador.length > 0 && <div className="mt-2 rounded-xl bg-[#f8faf5] p-2 text-xs font-semibold">Última respuesta preparada: {respuesta.respuestasDelOperador[0].texto}</div>}</article>)}</div>
      </section>

      <section className="rounded-[2rem] border border-[#d8dfd1] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">Mensajes enviados</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[#d8dfd1]"><table className="w-full border-collapse text-sm"><thead className="bg-[#f1f4ec] text-left text-xs uppercase text-[#66745c]"><tr><th className="border p-3">Fecha</th><th className="border p-3">Asunto</th><th className="border p-3">Canal</th><th className="border p-3">Destinatarios</th><th className="border p-3">Estado</th><th className="border p-3">Respuestas</th></tr></thead><tbody>{mensajes.length === 0 ? <tr><td colSpan={6} className="border p-6 text-center font-bold text-[#66745c]">Sin historial de mensajes enviados.</td></tr> : mensajes.map((mensaje) => <tr key={mensaje.id}><td className="border p-3">{fecha(mensaje.fecha)}</td><td className="border p-3 font-black">{mensaje.asunto}<p className="text-[11px] font-semibold text-[#66745c]">ID: {mensaje.id}</p></td><td className="border p-3">{mensaje.canal}</td><td className="border p-3">{mensaje.cantidadDestinatarios}</td><td className="border p-3 font-black">{mensaje.estado}</td><td className="border p-3">{mensaje.respuestasAsociadas.length}</td></tr>)}</tbody></table></div>
      </section>
    </section>
  );
}
