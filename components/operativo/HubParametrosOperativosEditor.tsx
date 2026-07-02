"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HubPublico, ModuloOperativoHub, ParametrosJardinerosYaHub } from "@/lib/data/hubs";

const escalasComisionIniciales = [
  { desde: 1, hasta: 1, porcentaje: 15 },
  { desde: 2, hasta: 2, porcentaje: 20 },
  { desde: 3, hasta: 5, porcentaje: 25 },
];

const escalasTrasladoIniciales = [
  { desde: 1, hasta: 1, valor: 0 },
  { desde: 2, hasta: 3, valor: 0 },
  { desde: 4, hasta: 6, valor: 0 },
];

const parametrosVacios: ParametrosJardinerosYaHub = {
  valorHoraTrabajo: 0,
  comisionResponsableCuadrillaPorcentaje: 0,
  traslado: 0,
  aceite: 0,
  nafta: 0,
  valorHoraCortadoraCesped: 0,
  valorHoraBordeadora: 0,
  valorHoraMaquinaEmpuje: 0,
  escalasComisionManejoPersonal: escalasComisionIniciales,
  escalasTrasladoBonoFinalizacion: escalasTrasladoIniciales,
  mostrarEnWebPublica: false,
};

function numero(valor: unknown) {
  return Number(valor || 0);
}

function normalizarParametrosJardinerosYa(input?: Partial<ParametrosJardinerosYaHub>): ParametrosJardinerosYaHub {
  return {
    ...parametrosVacios,
    ...input,
    valorHoraTrabajo: numero(input?.valorHoraTrabajo),
    valorHoraBordeadora: numero(input?.valorHoraBordeadora),
    valorHoraMaquinaEmpuje: numero(input?.valorHoraMaquinaEmpuje),
    escalasComisionManejoPersonal:
      Array.isArray(input?.escalasComisionManejoPersonal) && input.escalasComisionManejoPersonal.length > 0
        ? input.escalasComisionManejoPersonal.map((escala) => ({
            desde: numero(escala.desde),
            hasta: numero(escala.hasta),
            porcentaje: numero(escala.porcentaje),
          }))
        : escalasComisionIniciales,
    escalasTrasladoBonoFinalizacion:
      Array.isArray(input?.escalasTrasladoBonoFinalizacion) && input.escalasTrasladoBonoFinalizacion.length > 0
        ? input.escalasTrasladoBonoFinalizacion.map((escala) => ({
            desde: numero(escala.desde),
            hasta: numero(escala.hasta),
            valor: numero(escala.valor),
          }))
        : escalasTrasladoIniciales,
    mostrarEnWebPublica: Boolean(input?.mostrarEnWebPublica),
  };
}

const modulos: Array<{ valor: ModuloOperativoHub; etiqueta: string }> = [
  { valor: "jardinerosya", etiqueta: "JardinerosYa" },
  { valor: "fumigadoresya", etiqueta: "FumigadoresYa" },
  { valor: "comerciarya", etiqueta: "ComerciarYa" },
  { valor: "pileterosya", etiqueta: "PileterosYa" },
  { valor: "otro", etiqueta: "Otro" },
];

export function HubParametrosOperativosEditor({ hub }: { hub: HubPublico }) {
  const router = useRouter();
  const [moduloOperativo, setModuloOperativo] = useState<ModuloOperativoHub>(hub.moduloOperativo || "otro");
  const [parametros, setParametros] = useState(() => normalizarParametrosJardinerosYa(hub.parametrosOperativos?.jardinerosYa));
  const [nivelEstabilidad, setNivelEstabilidad] = useState(() => Math.min(10, Math.max(1, Math.round(Number(hub.nivelEstabilidad || 8)))));
  const [estado, setEstado] = useState("");

  async function guardar() {
    setEstado("Guardando parámetros JardinerosYa...");

    const respuesta = await fetch(`/api/hubs/${hub.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduloOperativo,
        nivelEstabilidad,
        parametrosOperativos: { jardinerosYa: parametros },
      }),
    });

    if (respuesta.ok) {
      setEstado("Parámetros JardinerosYa del Hub guardados correctamente.");
      router.refresh();
      return;
    }

    setEstado("No se pudieron guardar los parámetros JardinerosYa.");
  }

  function actualizarComision(index: number, clave: "desde" | "hasta" | "porcentaje", valor: number) {
    setParametros((actual) => ({
      ...actual,
      escalasComisionManejoPersonal: actual.escalasComisionManejoPersonal.map((escala, escalaIndex) =>
        escalaIndex === index ? { ...escala, [clave]: valor } : escala
      ),
    }));
  }

  function actualizarTraslado(index: number, clave: "desde" | "hasta" | "valor", valor: number) {
    setParametros((actual) => ({
      ...actual,
      escalasTrasladoBonoFinalizacion: actual.escalasTrasladoBonoFinalizacion.map((escala, escalaIndex) =>
        escalaIndex === index ? { ...escala, [clave]: valor } : escala
      ),
    }));
  }

  return (
    <section className="rounded-[2rem] border border-[#bfd3b8] bg-[#fbfdf8] p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#5d7032]">Parámetros JardinerosYa del Hub</p>
          <h2 className="mt-1 text-2xl font-black">Parámetros JardinerosYa del Hub</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold text-[#66745c]">
            Estos valores sirven como referencia para ordenar el cobro del servicio: hora de trabajo, manejo de personal, maquinaria y traslado/bono de finalización.
          </p>
        </div>

        <button onClick={guardar} className="rounded-2xl bg-[#1f2a1d] px-4 py-3 text-sm font-black text-white">
          Guardar parámetros
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-xs font-black uppercase text-[#66745c]">
          Módulo operativo del Hub
          <select
            value={moduloOperativo}
            onChange={(e) => setModuloOperativo(e.target.value as ModuloOperativoHub)}
            className="h-11 rounded-xl border border-[#cfd8c6] bg-white px-3 text-sm font-semibold normal-case outline-none"
          >
            {modulos.map((modulo) => (
              <option key={modulo.valor} value={modulo.valor}>{modulo.etiqueta}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-xs font-black uppercase text-[#66745c]">
          Nivel de estabilidad del Hub
          <input
            type="number"
            min="1"
            max="10"
            value={nivelEstabilidad}
            onChange={(e) => setNivelEstabilidad(Math.min(10, Math.max(1, Math.round(Number(e.target.value || 1)))))}
            className="h-11 rounded-xl border border-[#cfd8c6] bg-white px-3 text-sm font-semibold normal-case outline-none"
          />
          <span className="text-[11px] font-semibold normal-case text-[#66745c]">Valor manual de 1 a 10 visible en ficha, vista previa y mail.</span>
        </label>
      </div>

      {moduloOperativo === "jardinerosya" && (
        <div className="mt-5 grid gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <label className="grid gap-1 rounded-2xl border border-[#d8dfd1] bg-white p-3 text-xs font-black uppercase text-[#66745c]">
              Precio de la hora de trabajo
              <input
                type="number"
                min="0"
                value={parametros.valorHoraTrabajo}
                onChange={(e) => setParametros((actual) => ({ ...actual, valorHoraTrabajo: Number(e.target.value || 0) }))}
                className="h-10 rounded-xl border border-[#cfd8c6] px-3 text-sm font-semibold normal-case outline-none"
              />
            </label>

            <label className="grid gap-1 rounded-2xl border border-[#d8dfd1] bg-white p-3 text-xs font-black uppercase text-[#66745c]">
              Precio de la hora máquina bordeadora
              <input
                type="number"
                min="0"
                value={parametros.valorHoraBordeadora}
                onChange={(e) => setParametros((actual) => ({ ...actual, valorHoraBordeadora: Number(e.target.value || 0) }))}
                className="h-10 rounded-xl border border-[#cfd8c6] px-3 text-sm font-semibold normal-case outline-none"
              />
            </label>

            <label className="grid gap-1 rounded-2xl border border-[#d8dfd1] bg-white p-3 text-xs font-black uppercase text-[#66745c]">
              Precio de la hora máquina de empuje
              <input
                type="number"
                min="0"
                value={parametros.valorHoraMaquinaEmpuje}
                onChange={(e) => setParametros((actual) => ({ ...actual, valorHoraMaquinaEmpuje: Number(e.target.value || 0) }))}
                className="h-10 rounded-xl border border-[#cfd8c6] px-3 text-sm font-semibold normal-case outline-none"
              />
            </label>

            <label className="flex items-center gap-2 rounded-2xl border border-[#d8dfd1] bg-white p-3 text-sm font-black">
              <input
                type="checkbox"
                checked={parametros.mostrarEnWebPublica}
                onChange={(e) => setParametros((actual) => ({ ...actual, mostrarEnWebPublica: e.target.checked }))}
              />
              Mostrar parámetros JardinerosYa en web pública
            </label>
          </div>

          <div className="rounded-2xl border border-[#d8dfd1] bg-white p-4">
            <h3 className="text-sm font-black">Comisión por manejo de personal</h3>
            <p className="mt-1 text-xs font-semibold text-[#66745c]">A mayor cantidad de personas coordinadas, mayor comisión por manejo de personal.</p>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="bg-[#eef7ea] text-left text-xs uppercase text-[#66745c]">
                    <th className="border border-[#d8dfd1] p-2">Desde ayudantes/personas</th>
                    <th className="border border-[#d8dfd1] p-2">Hasta ayudantes/personas</th>
                    <th className="border border-[#d8dfd1] p-2">% comisión</th>
                  </tr>
                </thead>
                <tbody>
                  {parametros.escalasComisionManejoPersonal.map((escala, index) => (
                    <tr key={index}>
                      <td className="border border-[#d8dfd1] p-2">
                        <input type="number" min="0" value={escala.desde} onChange={(e) => actualizarComision(index, "desde", Number(e.target.value || 0))} className="h-9 w-full rounded-lg border border-[#cfd8c6] px-2 font-semibold outline-none" />
                      </td>
                      <td className="border border-[#d8dfd1] p-2">
                        <input type="number" min="0" value={escala.hasta} onChange={(e) => actualizarComision(index, "hasta", Number(e.target.value || 0))} className="h-9 w-full rounded-lg border border-[#cfd8c6] px-2 font-semibold outline-none" />
                      </td>
                      <td className="border border-[#d8dfd1] p-2">
                        <input type="number" min="0" value={escala.porcentaje} onChange={(e) => actualizarComision(index, "porcentaje", Number(e.target.value || 0))} className="h-9 w-full rounded-lg border border-[#cfd8c6] px-2 font-semibold outline-none" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-[#d8dfd1] bg-white p-4">
            <h3 className="text-sm font-black">Traslado / bono de finalización</h3>
            <p className="mt-1 text-xs font-semibold text-[#66745c]">A mayor cantidad de casas atendidas en una jornada, menor debería ser el costo de traslado por casa, incentivando finalizar y pasar a la siguiente casa.</p>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="bg-[#eef7ea] text-left text-xs uppercase text-[#66745c]">
                    <th className="border border-[#d8dfd1] p-2">Desde casas</th>
                    <th className="border border-[#d8dfd1] p-2">Hasta casas</th>
                    <th className="border border-[#d8dfd1] p-2">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {parametros.escalasTrasladoBonoFinalizacion.map((escala, index) => (
                    <tr key={index}>
                      <td className="border border-[#d8dfd1] p-2">
                        <input type="number" min="0" value={escala.desde} onChange={(e) => actualizarTraslado(index, "desde", Number(e.target.value || 0))} className="h-9 w-full rounded-lg border border-[#cfd8c6] px-2 font-semibold outline-none" />
                      </td>
                      <td className="border border-[#d8dfd1] p-2">
                        <input type="number" min="0" value={escala.hasta} onChange={(e) => actualizarTraslado(index, "hasta", Number(e.target.value || 0))} className="h-9 w-full rounded-lg border border-[#cfd8c6] px-2 font-semibold outline-none" />
                      </td>
                      <td className="border border-[#d8dfd1] p-2">
                        <input type="number" min="0" value={escala.valor} onChange={(e) => actualizarTraslado(index, "valor", Number(e.target.value || 0))} className="h-9 w-full rounded-lg border border-[#cfd8c6] px-2 font-semibold outline-none" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <p className="mt-4 rounded-xl border border-[#d8dfd1] bg-white p-3 text-sm font-bold text-[#4f5f47]">
        JardinerosYa funciona como algoritmo operativo para Hubs de espacios verdes. La ficha del Hub define las reglas base del servicio.
      </p>

      {estado && <p className="mt-3 rounded-xl border border-[#cfe0c8] bg-[#eef7ea] px-3 py-2 text-sm font-black text-[#2f6d32]">{estado}</p>}
    </section>
  );
}
