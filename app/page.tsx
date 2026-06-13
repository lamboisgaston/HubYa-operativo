"use client";

import { useCallback, useMemo, useRef, useState } from "react";

type CampoNumerico = number | "";

type FilaClienteIngreso = {
  id: number;
  origen: string;
  nombre: string;
  email: string;
  importe: CampoNumerico;
  trabajoRealizado: string;
  trabajoPendiente: string;
};

type FilaGasto = { id: number; concepto: string; importe: CampoNumerico };
type FilaActor = { id: number; nombre: string; activo: boolean; participacion: CampoNumerico; ajusteManual: CampoNumerico };

type ResumenHubManual = {
  tiempoEfectivo: string;
  estadoOperativo: string;
  observacionGeneral: string;
};

type HubDisponible = (typeof HUBS_DISPONIBLES)[number];
type DatosHub = {
  clientesIngresos: FilaClienteIngreso[];
  gastos: FilaGasto[];
  actores: FilaActor[];
  resumen: ResumenHubManual;
  clienteActivoId: number;
};
type DatosPorHub = Record<HubDisponible, DatosHub>;

type JornadaOperativa = {
  hub: HubDisponible;
  fecha: string;
  datosPorHub: DatosPorHub;
};

const LOCAL_STORAGE_KEY = "hubya-jornada-operativa-actual";

const HUBS_DISPONIBLES = [
  "Hub Tipal",
  "Hub Punto",
  "Hub Praderas",
  "Hub Valle Escondido",
  "Hub Chacras de Santa María",
  "Hub La Aguada",
  "Hub Prado",
  "Hub La Reserva",
] as const;

const trabajoRealizadoInicial = "Mantenimiento integral de espacios verdes, corte, bordes y limpieza general.";
const trabajoPendienteInicial = "Validación final con cada cliente y próximos repasos programados.";
const observacionGeneralInicial = "Resumen cargado manualmente. Sin cálculos automáticos obligatorios.";

const clientesBasePorHub: Record<HubDisponible, string[]> = {
  "Hub Tipal": ["Carolina Yovi", "Gabriela Aguiar", "Fleming"],
  "Hub Punto": [],
  "Hub Praderas": ["Milagros Carrizo", "Florencia Siufi", "Celeste Recamán", "Verónica Burgos", "Andrés Jaraba", "Javier Astudillo", "María del Mar"],
  "Hub Valle Escondido": [],
  "Hub Chacras de Santa María": [],
  "Hub La Aguada": [],
  "Hub Prado": ["Javier Astudillo", "Mariana Espeche", "Marisa Belmar", "Facundo Quintana", "Guido Alonso"],
  "Hub La Reserva": [],
};

function crearId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function normalizarNumero(valor: string): CampoNumerico {
  return valor === "" ? "" : Number(valor);
}

function formatoMoneda(valor: CampoNumerico | undefined) {
  return Number(valor || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function formatoPlano(valor: CampoNumerico | undefined) {
  return valor === "" || valor === undefined ? "" : formatoMoneda(valor);
}

function formatoFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  if (!anio || !mes || !dia) return fecha;
  return new Date(anio, mes - 1, dia).toLocaleDateString("es-AR");
}

function resumenInicial(): ResumenHubManual {
  return {
    tiempoEfectivo: "",
    estadoOperativo: "Operativo",
    observacionGeneral: observacionGeneralInicial,
  };
}

function clienteIngresoInicial(nombre: string, index = 0, baseId = 1000): FilaClienteIngreso {
  return {
    id: baseId + index,
    origen: "JardinerosYa",
    nombre,
    email: "",
    importe: 0,
    trabajoRealizado: trabajoRealizadoInicial,
    trabajoPendiente: trabajoPendienteInicial,
  };
}

function datosHubInicial(hub: HubDisponible): DatosHub {
  const hubIndex = HUBS_DISPONIBLES.indexOf(hub) + 1;
  const clientesIngresos = clientesBasePorHub[hub].map((nombre, index) => clienteIngresoInicial(nombre, index, hubIndex * 1000));
  return {
    clientesIngresos,
    gastos: ["Nafta", "Maquinaria", "JardinerosYa", "Tanza"].map((concepto, index) => ({ id: hubIndex * 10000 + index, concepto, importe: 0 })),
    actores: ["Hernán Llanes", "Armando Castillo", "Mauricio Vallejos"].map((nombre, index) => ({ id: hubIndex * 100000 + index, nombre, activo: true, participacion: 1, ajusteManual: 0 })),
    resumen: resumenInicial(),
    clienteActivoId: clientesIngresos[0]?.id || 0,
  };
}

const datosInicialesPorHub = Object.fromEntries(HUBS_DISPONIBLES.map((hub) => [hub, datosHubInicial(hub)])) as DatosPorHub;

const jornadaInicial: JornadaOperativa = {
  hub: "Hub Tipal",
  fecha: "2026-06-13",
  datosPorHub: datosInicialesPorHub,
};

function normalizarCliente(cliente: Partial<FilaClienteIngreso>): FilaClienteIngreso {
  return {
    id: cliente.id || crearId(),
    origen: cliente.origen || "JardinerosYa",
    nombre: cliente.nombre || "",
    email: cliente.email || "",
    importe: cliente.importe ?? 0,
    trabajoRealizado: cliente.trabajoRealizado || trabajoRealizadoInicial,
    trabajoPendiente: cliente.trabajoPendiente || trabajoPendienteInicial,
  };
}

function normalizarActor(actor: Partial<FilaActor> & { actor?: string; importe?: CampoNumerico }): FilaActor {
  return {
    id: actor.id || crearId(),
    nombre: actor.nombre || actor.actor || "",
    activo: actor.activo ?? true,
    participacion: actor.participacion ?? 1,
    ajusteManual: actor.ajusteManual ?? actor.importe ?? 0,
  };
}

function numero(valor: CampoNumerico | undefined) {
  return Number(valor || 0);
}

function normalizarDatosHub(datos: (Partial<DatosHub> & { distribucion?: (Partial<FilaActor> & { actor?: string; importe?: CampoNumerico })[] }) | undefined, hub: HubDisponible): DatosHub {
  const base = datosHubInicial(hub);
  const clientesIngresos = (datos?.clientesIngresos || base.clientesIngresos).map(normalizarCliente);
  return {
    clientesIngresos,
    gastos: (datos?.gastos || base.gastos).map((gasto) => ({ id: gasto.id || crearId(), concepto: gasto.concepto || "", importe: gasto.importe ?? 0 })),
    actores: (datos?.actores || datos?.distribucion || base.actores).map(normalizarActor),
    resumen: { ...resumenInicial(), ...datos?.resumen },
    clienteActivoId: clientesIngresos.some((cliente) => cliente.id === datos?.clienteActivoId) ? Number(datos?.clienteActivoId) : clientesIngresos[0]?.id || 0,
  };
}

function normalizarJornada(jornada: Partial<JornadaOperativa> & { clientesPorHub?: Record<string, unknown[]>; resumenesPorHub?: Record<string, Partial<ResumenHubManual>> }): JornadaOperativa {
  const hub = HUBS_DISPONIBLES.includes(jornada.hub as HubDisponible) ? (jornada.hub as HubDisponible) : jornadaInicial.hub;
  const datosPorHub = Object.fromEntries(HUBS_DISPONIBLES.map((hubDisponible) => [hubDisponible, normalizarDatosHub(jornada.datosPorHub?.[hubDisponible], hubDisponible)])) as DatosPorHub;
  return { hub, fecha: jornada.fecha || jornadaInicial.fecha, datosPorHub };
}

export default function Home() {
  const [jornada, setJornada] = useState<JornadaOperativa>(jornadaInicial);
  const [mensajeGuardado, setMensajeGuardado] = useState("Sin guardar en este navegador");
  const reporteVisualRef = useRef<HTMLElement>(null);

  const datosHub = jornada.datosPorHub[jornada.hub];
  const clienteActivo = datosHub.clientesIngresos.find((cliente) => cliente.id === datosHub.clienteActivoId) || datosHub.clientesIngresos[0];
  const fechaFormateada = formatoFecha(jornada.fecha);
  const totalFacturadoHub = datosHub.clientesIngresos.reduce((total, cliente) => total + numero(cliente.importe), 0);
  const totalGastos = datosHub.gastos.reduce((total, gasto) => total + numero(gasto.importe), 0);
  const totalADistribuir = totalFacturadoHub - totalGastos;
  const actoresActivos = datosHub.actores.filter((actor) => actor.activo);
  const cantidadActoresActivos = actoresActivos.length;
  const totalParticipacion = actoresActivos.reduce((total, actor) => total + numero(actor.participacion), 0);
  const distribucionCalculada = datosHub.actores.map((actor) => {
    const importeDistribuido = actor.activo && totalParticipacion > 0 ? totalADistribuir * numero(actor.participacion) / totalParticipacion : 0;
    const importeFinal = importeDistribuido + numero(actor.ajusteManual);
    return { ...actor, importeDistribuido, importeFinal };
  });
  const totalDistribuido = distribucionCalculada.reduce((total, actor) => total + actor.importeFinal, 0);

  function actualizarJornada(cambios: Partial<JornadaOperativa>) {
    setJornada((actual) => ({ ...actual, ...cambios }));
  }

  function actualizarDatosHub(cambios: Partial<DatosHub>) {
    setJornada((actual) => ({ ...actual, datosPorHub: { ...actual.datosPorHub, [actual.hub]: { ...actual.datosPorHub[actual.hub], ...cambios } } }));
  }

  function actualizarResumen(cambios: Partial<ResumenHubManual>) {
    actualizarDatosHub({ resumen: { ...datosHub.resumen, ...cambios } });
  }

  function actualizarCliente(id: number, cambios: Partial<FilaClienteIngreso>) {
    actualizarDatosHub({ clientesIngresos: datosHub.clientesIngresos.map((cliente) => cliente.id === id ? { ...cliente, ...cambios } : cliente) });
  }

  function actualizarGasto(id: number, cambios: Partial<FilaGasto>) {
    actualizarDatosHub({ gastos: datosHub.gastos.map((gasto) => gasto.id === id ? { ...gasto, ...cambios } : gasto) });
  }

  function actualizarActor(id: number, cambios: Partial<FilaActor>) {
    actualizarDatosHub({ actores: datosHub.actores.map((actor) => actor.id === id ? { ...actor, ...cambios } : actor) });
  }

  const nombrePrivado = useCallback((cliente: FilaClienteIngreso, index: number) => cliente.id === clienteActivo?.id ? cliente.nombre : `Cliente ${index + 1}`, [clienteActivo?.id]);

  const emailPrivado = useMemo(() => [
    `Hola ${clienteActivo?.nombre || ""}, te compartimos el reporte correspondiente a la jornada del ${jornada.hub} del día ${fechaFormateada}.`,
    "",
    "Lo principal está resumido al inicio del comprobante. El detalle queda disponible como respaldo de transparencia operativa.",
  ].join("\n"), [clienteActivo?.nombre, fechaFormateada, jornada.hub]);

  async function descargarImagenReporte() {
    const nodo = reporteVisualRef.current;
    if (!nodo) return;
    const ancho = Math.ceil(nodo.scrollWidth);
    const alto = Math.ceil(nodo.scrollHeight);
    const estilos = Array.from(document.styleSheets).map((hoja) => {
      try {
        return Array.from(hoja.cssRules).map((regla) => regla.cssText).join("\n");
      } catch {
        return "";
      }
    }).join("\n");
    const html = new XMLSerializer().serializeToString(nodo.cloneNode(true));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}"><style>${estilos}</style><foreignObject width="100%" height="100%">${html}</foreignObject></svg>`;
    const imagen = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    await new Promise<void>((resolve, reject) => {
      imagen.onload = () => resolve();
      imagen.onerror = reject;
      imagen.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = ancho * 2;
    canvas.height = alto * 2;
    const contexto = canvas.getContext("2d");
    if (!contexto) return;
    contexto.scale(2, 2);
    contexto.fillStyle = "#ffffff";
    contexto.fillRect(0, 0, ancho, alto);
    contexto.drawImage(imagen, 0, 0);
    URL.revokeObjectURL(url);
    const enlace = document.createElement("a");
    enlace.download = `reporte-hubya-${jornada.hub.toLowerCase().replaceAll(" ", "-")}-${jornada.fecha}.png`;
    enlace.href = canvas.toDataURL("image/png");
    enlace.click();
    setMensajeGuardado(`Imagen del reporte preparada: ${new Date().toLocaleTimeString("es-AR")}`);
  }

  function guardarJornada() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(jornada));
    setMensajeGuardado(`Jornada guardada localmente: ${new Date().toLocaleTimeString("es-AR")}`);
  }

  function cargarJornada() {
    const guardada = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!guardada) return setMensajeGuardado("No hay una jornada guardada para cargar");
    setJornada(normalizarJornada(JSON.parse(guardada) as JornadaOperativa));
    setMensajeGuardado("Jornada cargada desde este navegador");
  }

  function limpiarJornada() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setJornada(jornadaInicial);
    setMensajeGuardado("Jornada local limpiada y formulario reiniciado");
  }

  async function copiarTexto(texto: string, etiqueta: string) {
    await navigator.clipboard.writeText(texto);
    setMensajeGuardado(`${etiqueta} copiado: ${new Date().toLocaleTimeString("es-AR")}`);
  }

  const inputNumero = (valor: CampoNumerico, onChange: (valor: CampoNumerico) => void) => <input type="number" step="0.25" value={valor} onChange={(e) => onChange(normalizarNumero(e.target.value))} className="h-7 w-28 bg-transparent px-1 text-right outline-none" />;
  const inputTexto = (valor: string, onChange: (valor: string) => void, ancho = "min-w-40") => <input value={valor} onChange={(e) => onChange(e.target.value)} className={`h-7 ${ancho} bg-transparent px-1 outline-none`} />;

  return (
    <main className="min-h-screen bg-[#eef2e8] text-[#182018]">
      <section className="mx-auto max-w-[1600px] px-3 py-3 sm:px-4">
        <header className="sticky top-0 z-20 mb-3 rounded-xl border border-[#cfd8c6] bg-white/95 p-3 shadow-sm backdrop-blur">
          <div className="grid gap-2 xl:grid-cols-[1fr_280px_180px_auto] xl:items-end">
            <div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#66745c]">HubYa Operativo · carga manual + reporte vivo</p><h1 className="text-xl font-black leading-tight">Reporte del Hub — {jornada.hub} — {fechaFormateada}</h1></div>
            <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Hub<select value={jornada.hub} onChange={(e) => actualizarJornada({ hub: e.target.value as HubDisponible })} className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-2 text-sm font-semibold outline-none">{HUBS_DISPONIBLES.map((hub) => <option key={hub} value={hub}>{hub}</option>)}</select></label>
            <label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Fecha<input type="date" value={jornada.fecha} onChange={(e) => actualizarJornada({ fecha: e.target.value })} className="h-8 rounded-lg border border-[#cfd8c6] px-2 text-sm outline-none" /></label>
            <div className="flex flex-wrap gap-1.5 xl:justify-end"><button onClick={guardarJornada} className="h-8 rounded-lg bg-[#1f2a1d] px-3 text-xs font-black text-white">Guardar</button><button onClick={cargarJornada} className="h-8 rounded-lg border border-[#cfd8c6] bg-white px-3 text-xs font-black">Cargar</button><button onClick={limpiarJornada} className="h-8 rounded-lg border border-[#d6b7b7] bg-[#fff7f7] px-3 text-xs font-black text-[#743c3c]">Limpiar</button></div>
          </div>
          <p className="mt-1 text-[11px] font-semibold text-[#66745c]">{mensajeGuardado} · Carga principal editable con sumas y distribución automáticas.</p>
        </header>

        <section className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-3">
            <section className="rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm"><div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-black uppercase tracking-wide">Zona A · Carga operativa</h2><span className="text-xs font-bold text-[#66745c]">Planilla compacta</span></div>
              <h3 className="mb-1 text-xs font-black uppercase text-[#66745c]">Clientes / ingresos</h3><div className="overflow-x-auto"><table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-1">Origen / sistema</th><th className="border p-1">Cliente</th><th className="border p-1">Email privado</th><th className="border p-1">Importe manual</th><th className="border p-1">Email</th><th className="border p-1"></th></tr></thead><tbody>{datosHub.clientesIngresos.map((cliente) => <tr key={cliente.id} className={cliente.id === datosHub.clienteActivoId ? "bg-[#eef4ea]" : "bg-white"}><td className="border border-[#e1e6dc] p-1">{inputTexto(cliente.origen, (valor) => actualizarCliente(cliente.id, { origen: valor }), "min-w-32")}</td><td className="border border-[#e1e6dc] p-1">{inputTexto(cliente.nombre, (valor) => actualizarCliente(cliente.id, { nombre: valor }))}</td><td className="border border-[#e1e6dc] p-1">{inputTexto(cliente.email, (valor) => actualizarCliente(cliente.id, { email: valor }), "min-w-48")}</td><td className="border border-[#e1e6dc] p-1">{inputNumero(cliente.importe, (valor) => actualizarCliente(cliente.id, { importe: valor }))}</td><td className="border border-[#e1e6dc] p-1 text-center"><input type="radio" name="clienteActivo" checked={cliente.id === datosHub.clienteActivoId} onChange={() => actualizarDatosHub({ clienteActivoId: cliente.id })} /></td><td className="border border-[#e1e6dc] p-1 text-center"><button onClick={() => actualizarDatosHub({ clientesIngresos: datosHub.clientesIngresos.filter((fila) => fila.id !== cliente.id) })} className="font-black text-[#743c3c]">×</button></td></tr>)}</tbody></table></div><button onClick={() => actualizarDatosHub({ clientesIngresos: [...datosHub.clientesIngresos, { ...clienteIngresoInicial(""), id: crearId() }] })} className="mt-2 h-7 rounded-md bg-[#1f2a1d] px-3 text-xs font-black text-white">Agregar cliente</button>
            </section>

            <section className="rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm">
              <h3 className="mb-2 text-xs font-black uppercase text-[#66745c]">Resumen automático del Hub</h3>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
                <div className="rounded-lg border border-[#cfd8c6] p-2"><p className="text-[10px] font-black uppercase text-[#66745c]">Total facturado al Hub</p><p className="text-sm font-black">{formatoMoneda(totalFacturadoHub)}</p></div>
                <div className="rounded-lg border border-[#cfd8c6] p-2"><p className="text-[10px] font-black uppercase text-[#66745c]">Total gastos</p><p className="text-sm font-black">{formatoMoneda(totalGastos)}</p></div>
                <div className={`rounded-lg border p-2 ${totalADistribuir < 0 ? "border-[#d6b7b7] bg-[#fff7f7]" : "border-[#cfd8c6]"}`}><p className="text-[10px] font-black uppercase text-[#66745c]">Total a distribuir</p><p className="text-sm font-black">{formatoMoneda(totalADistribuir)}</p></div>
                <div className="rounded-lg border border-[#cfd8c6] p-2"><p className="text-[10px] font-black uppercase text-[#66745c]">Actores activos</p><p className="text-sm font-black">{cantidadActoresActivos}</p></div>
                <div className="rounded-lg border border-[#cfd8c6] p-2"><p className="text-[10px] font-black uppercase text-[#66745c]">Total participación</p><p className="text-sm font-black">{totalParticipacion}</p></div>
              </div>
              {totalADistribuir < 0 && <p className="mt-2 rounded-lg border border-[#d6b7b7] bg-[#fff7f7] px-2 py-1 text-xs font-black text-[#743c3c]">Advertencia: el total a distribuir es negativo.</p>}
            </section>

            <section className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm"><h3 className="mb-1 text-xs font-black uppercase text-[#66745c]">Gastos</h3><table className="w-full border-collapse text-xs"><tbody>{datosHub.gastos.map((gasto) => <tr key={gasto.id}><td className="border p-1">{inputTexto(gasto.concepto, (valor) => actualizarGasto(gasto.id, { concepto: valor }), "min-w-28")}</td><td className="border p-1">{inputNumero(gasto.importe, (valor) => actualizarGasto(gasto.id, { importe: valor }))}</td><td className="border p-1 text-center"><button onClick={() => actualizarDatosHub({ gastos: datosHub.gastos.filter((fila) => fila.id !== gasto.id) })} className="font-black text-[#743c3c]">×</button></td></tr>)}</tbody></table><button onClick={() => actualizarDatosHub({ gastos: [...datosHub.gastos, { id: crearId(), concepto: "", importe: 0 }] })} className="mt-2 h-7 rounded-md border px-3 text-xs font-black">Agregar gasto</button></div>
              <div className="rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm"><h3 className="mb-1 text-xs font-black uppercase text-[#66745c]">Actores del equipo</h3><div className="overflow-x-auto"><table className="w-full border-collapse text-xs"><thead className="bg-[#f1f4ec] text-left text-[10px] uppercase text-[#66745c]"><tr><th className="border p-1">Actor</th><th className="border p-1">Activo</th><th className="border p-1">Participación</th><th className="border p-1">Ajuste manual</th><th className="border p-1">Importe calculado</th><th className="border p-1"></th></tr></thead><tbody>{distribucionCalculada.map((actor) => <tr key={actor.id}><td className="border p-1">{inputTexto(actor.nombre, (valor) => actualizarActor(actor.id, { nombre: valor }), "min-w-32")}</td><td className="border p-1 text-center"><input type="checkbox" checked={actor.activo} onChange={(e) => actualizarActor(actor.id, { activo: e.target.checked })} /></td><td className="border p-1">{inputNumero(actor.participacion, (valor) => actualizarActor(actor.id, { participacion: valor }))}</td><td className="border p-1">{inputNumero(actor.ajusteManual, (valor) => actualizarActor(actor.id, { ajusteManual: valor }))}</td><td className="border p-1 text-right font-black">{formatoMoneda(actor.importeFinal)}</td><td className="border p-1 text-center"><button onClick={() => actualizarDatosHub({ actores: datosHub.actores.filter((item) => item.id !== actor.id) })} className="font-black text-[#743c3c]">×</button></td></tr>)}</tbody></table></div><button onClick={() => actualizarDatosHub({ actores: [...datosHub.actores, { id: crearId(), nombre: "", activo: true, participacion: 1, ajusteManual: 0 }] })} className="mt-2 h-7 rounded-md border px-3 text-xs font-black">Agregar actor</button></div>
            </section>

            <section className="rounded-xl border border-[#d8dfd1] bg-white p-3 shadow-sm"><h3 className="mb-2 text-xs font-black uppercase text-[#66745c]">Datos operativos</h3><div className="grid gap-2 lg:grid-cols-3"><label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Tiempo efectivo por operario<input value={datosHub.resumen.tiempoEfectivo} onChange={(e) => actualizarResumen({ tiempoEfectivo: e.target.value })} className="h-8 rounded-lg border px-2 text-sm normal-case" /></label><label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Estado operativo<input value={datosHub.resumen.estadoOperativo} onChange={(e) => actualizarResumen({ estadoOperativo: e.target.value })} className="h-8 rounded-lg border px-2 text-sm normal-case" /></label><label className="grid gap-1 text-[11px] font-bold uppercase text-[#66745c]">Observación general<input value={datosHub.resumen.observacionGeneral} onChange={(e) => actualizarResumen({ observacionGeneral: e.target.value })} className="h-8 rounded-lg border px-2 text-sm normal-case" /></label></div></section>
          </div>

          <aside className="space-y-3">
          <section className="border border-[#b9c5ae] bg-white p-3 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#d8dfd1] pb-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#66745c]">Vista previa exacta para mail</p>
                <h2 className="text-lg font-black">Documento administrativo emitido por sistema</h2>
                <p className="text-xs font-bold text-[#66745c]">La imagen generada usa exactamente este formato de factura / presupuesto / reporte.</p>
              </div>
              <button onClick={descargarImagenReporte} className="h-8 rounded-lg bg-[#5d7032] px-3 text-xs font-black text-white">Generar imagen del reporte</button>
            </div>

            <article ref={reporteVisualRef} xmlns="http://www.w3.org/1999/xhtml" className="w-full max-w-[760px] border border-[#6f7968] bg-white p-0 font-sans text-[#182018] shadow-none">
              <header className="border-b-2 border-[#1f2a1d] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#66745c]">HubYa</p>
                <h3 className="mt-1 text-xl font-black uppercase leading-tight">Reporte administrativo del Hub</h3>
                <p className="mt-1 text-xs font-semibold text-[#66745c]">Documento emitido por sistema</p>
              </header>

              <section className="border-b border-[#9aa78f] p-4">
                <h4 className="mb-2 text-[11px] font-black uppercase tracking-wide text-[#1f2a1d]">Resumen rápido para el cliente</h4>
                <table className="w-full border-collapse text-xs">
                  <tbody>
                    <tr><td className="border border-[#d8dfd1] bg-[#f6f8f3] p-1.5 font-black uppercase">Cliente seleccionado</td><td className="border border-[#d8dfd1] p-1.5 font-bold">{clienteActivo?.nombre || "Sin cliente seleccionado"}</td></tr>
                    <tr><td className="border border-[#d8dfd1] bg-[#f6f8f3] p-1.5 font-black uppercase">Hub</td><td className="border border-[#d8dfd1] p-1.5">{jornada.hub}</td></tr>
                    <tr><td className="border border-[#d8dfd1] bg-[#f6f8f3] p-1.5 font-black uppercase">Fecha</td><td className="border border-[#d8dfd1] p-1.5">{fechaFormateada}</td></tr>
                    <tr><td className="border border-[#1f2a1d] bg-[#eef2e8] p-2 font-black uppercase">Importe correspondiente a su espacio verde</td><td className="border border-[#1f2a1d] bg-[#eef2e8] p-2 text-lg font-black text-[#1f2a1d]">{formatoPlano(clienteActivo?.importe) || formatoMoneda(0)}</td></tr>
                    <tr><td className="border border-[#d8dfd1] bg-[#f6f8f3] p-1.5 font-black uppercase">Estado operativo</td><td className="border border-[#d8dfd1] p-1.5 font-bold">{datosHub.resumen.estadoOperativo || "Sin cargar"}</td></tr>
                  </tbody>
                </table>
              </section>

              <div className="p-4">
                <table className="w-full border-collapse bg-white text-xs">
                  <tbody>
                    <tr className="bg-[#eef2e8]"><th colSpan={3} className="border border-[#9aa78f] p-2 text-left text-[11px] uppercase tracking-wide">Clientes / ingresos</th></tr>
                    <tr className="bg-[#f8faf5] text-[10px] uppercase text-[#66745c]"><th className="border border-[#d8dfd1] p-1.5 text-left">Origen / sistema</th><th className="border border-[#d8dfd1] p-1.5 text-left">Nombre cliente</th><th className="border border-[#d8dfd1] p-1.5 text-right">Importe</th></tr>
                    {datosHub.clientesIngresos.map((cliente, index) => <tr key={cliente.id}><td className="border border-[#d8dfd1] p-1.5">{cliente.origen || "Sin origen"}</td><td className="border border-[#d8dfd1] p-1.5">{nombrePrivado(cliente, index) || "Sin cliente"}</td><td className="border border-[#d8dfd1] p-1.5 text-right">{formatoPlano(cliente.importe)}</td></tr>)}
                    <tr className="bg-[#fbfcf9] font-black"><td colSpan={2} className="border border-[#9aa78f] p-1.5">Total facturado al Hub</td><td className="border border-[#9aa78f] p-1.5 text-right">{formatoPlano(totalFacturadoHub)}</td></tr>
                    <tr className="bg-[#eef2e8]"><th colSpan={3} className="border border-[#9aa78f] p-2 text-left text-[11px] uppercase tracking-wide">Gastos</th></tr>
                    <tr className="bg-[#f8faf5] text-[10px] uppercase text-[#66745c]"><th colSpan={2} className="border border-[#d8dfd1] p-1.5 text-left">Concepto</th><th className="border border-[#d8dfd1] p-1.5 text-right">Importe</th></tr>
                    {datosHub.gastos.map((gasto) => <tr key={gasto.id}><td colSpan={2} className="border border-[#d8dfd1] p-1.5">{gasto.concepto || "Sin concepto"}</td><td className="border border-[#d8dfd1] p-1.5 text-right">{formatoPlano(gasto.importe)}</td></tr>)}
                    <tr className="font-black"><td colSpan={2} className="border border-[#9aa78f] p-1.5">Total gastos</td><td className="border border-[#9aa78f] p-1.5 text-right">{formatoPlano(totalGastos)}</td></tr>
                    <tr className="bg-[#fbfcf9] font-black"><td colSpan={2} className="border border-[#9aa78f] p-1.5">Total a distribuir</td><td className="border border-[#9aa78f] p-1.5 text-right">{formatoPlano(totalADistribuir)}</td></tr>
                    <tr className="bg-[#eef2e8]"><th colSpan={3} className="border border-[#9aa78f] p-2 text-left text-[11px] uppercase tracking-wide">Distribución automática por actor</th></tr>
                    <tr className="bg-[#f8faf5] text-[10px] uppercase text-[#66745c]"><th className="border border-[#d8dfd1] p-1.5 text-left">Actor</th><th className="border border-[#d8dfd1] p-1.5 text-center">Participación / activo</th><th className="border border-[#d8dfd1] p-1.5 text-right">Importe</th></tr>
                    {distribucionCalculada.map((actor) => <tr key={actor.id}><td className="border border-[#d8dfd1] p-1.5">{actor.nombre || "Sin actor"}</td><td className="border border-[#d8dfd1] p-1.5 text-center">{numero(actor.participacion)} / {actor.activo ? "activo" : "inactivo"}</td><td className="border border-[#d8dfd1] p-1.5 text-right">{formatoMoneda(actor.importeFinal)}</td></tr>)}
                    <tr className="bg-[#fbfcf9] font-black"><td colSpan={2} className="border border-[#9aa78f] p-1.5">Total distribuido</td><td className="border border-[#9aa78f] p-1.5 text-right">{formatoPlano(totalDistribuido)}</td></tr>
                    <tr><td className="border border-[#d8dfd1] bg-[#f8faf5] p-1.5 font-black">Tiempo efectivo</td><td colSpan={2} className="border border-[#d8dfd1] p-1.5">{datosHub.resumen.tiempoEfectivo || "Sin cargar"}</td></tr>
                    <tr><td className="border border-[#d8dfd1] bg-[#f8faf5] p-1.5 font-black">Estado operativo</td><td colSpan={2} className="border border-[#d8dfd1] p-1.5">{datosHub.resumen.estadoOperativo || "Sin cargar"}</td></tr>
                    <tr><td className="border border-[#d8dfd1] bg-[#f8faf5] p-1.5 font-black">Observación</td><td colSpan={2} className="border border-[#d8dfd1] p-1.5">{datosHub.resumen.observacionGeneral || "Sin cargar"}</td></tr>
                  </tbody>
                </table>
                <p className="mt-2 border border-[#d8dfd1] bg-[#f8faf5] p-2 text-[10px] font-semibold text-[#66745c]">Privacidad: solo el cliente seleccionado se muestra con nombre real. Los demás clientes están anonimizados como Cliente 2, Cliente 3, Cliente 4, etc. y no se incluyen emails.</p>

                <section className="mt-3 border border-[#9aa78f] p-3 text-xs leading-5">
                  <h4 className="mb-2 text-[11px] font-black uppercase tracking-wide text-[#1f2a1d]">Sobre HubYa</h4>
                  <p>HubYa es una empresa tecnológica salteña que agrupa demanda y organiza oferta para ejecutar procesos específicos según cada rama de servicio.</p>
                  <p className="mt-2">Nuestra filosofía es simple: el agrupamiento de la demanda mejora el agrupamiento de la oferta, y el agrupamiento de la oferta mejora la capacidad de abastecer la demanda.</p>
                  <p className="mt-2">Este reporte se emite como respaldo de transparencia operativa. No es necesario leer todo el detalle para validar el servicio; la información queda disponible para trazabilidad, control y mejora del proceso.</p>
                </section>
              </div>
            </article>
          </section>

          <details className="rounded-xl border border-[#1f2a1d] bg-[#1f2a1d] p-3 text-white shadow-sm"><summary className="cursor-pointer text-sm font-black uppercase tracking-wide">Mail corto para enviar con el documento</summary><div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]"><select value={datosHub.clienteActivoId} onChange={(e) => actualizarDatosHub({ clienteActivoId: Number(e.target.value) })} className="h-8 rounded-lg bg-white px-2 text-sm font-semibold text-[#182018]">{datosHub.clientesIngresos.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nombre || "Sin cliente"}</option>)}</select><button onClick={() => copiarTexto(emailPrivado, "Email privado")} className="h-8 rounded-lg bg-white px-3 text-xs font-black text-[#1f2a1d]">Copiar texto del mail</button></div><pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-white/10 p-3 text-xs leading-5">{emailPrivado}</pre></details>
        </aside>
        </section>
      </section>
    </main>
  );
}
