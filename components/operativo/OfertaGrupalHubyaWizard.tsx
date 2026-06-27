"use client";

import { useMemo, useState } from "react";
import type { HubPublico } from "@/lib/data/hubs";

type Props = {
  hubs: HubPublico[];
  action: (formData: FormData) => void | Promise<void>;
};

const defaultScales = [
  [1, 5, 45000],
  [6, 10, 42000],
  [11, 30, 39000],
  [31, 999, 37000],
];

export function OfertaGrupalHubyaWizard({ hubs, action }: Props) {
  const [step, setStep] = useState(1);
  const [selectedHubIds, setSelectedHubIds] = useState<string[]>([]);
  const selectedHubs = useMemo(() => hubs.filter((hub) => selectedHubIds.includes(hub.id)), [hubs, selectedHubIds]);

  function nextStep() {
    setStep((current) => Math.min(4, current + 1));
  }

  function toggleHub(hubId: string) {
    setSelectedHubIds((current) => current.includes(hubId) ? current.filter((id) => id !== hubId) : [...current, hubId]);
  }

  return (
    <form action={action} className="rounded-[2rem] border border-[#f3d2a5] bg-white p-6 shadow-sm">
      <input type="hidden" name="title" value="Oferta grupal HUBYA" />
      <input type="hidden" name="description" value="Tu Hub fue invitado a participar de esta oferta grupal." />
      <input type="hidden" name="deliveryMode" value="Entrega coordinada HUBYA" />
      <input type="hidden" name="notes" value="Mientras más integrantes del Hub participen, mejor precio consigue el grupo. Si al cierre corresponde diferencia a favor, se informa en ficha física junto con la mercadería." />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#B45309]">Oferta grupal HUBYA</p>
          <h2 className="mt-1 text-2xl font-black">Paso {step} de 4</h2>
        </div>
        <span className="rounded-full bg-[#fff8ed] px-4 py-2 text-xs font-black text-[#B45309]">Una pantalla = una decisión</span>
      </div>

      <section className={step === 1 ? "mt-6 grid gap-5" : "hidden"}>
          <div><h3 className="text-2xl font-black">Crear oferta</h3><p className="mt-1 text-sm font-bold text-[#7c5a34]">Definí solamente los datos mínimos para abrir la oferta.</p></div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-xs font-black uppercase text-[#7c5a34]">Producto<input name="productName" defaultValue="Huevos" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 text-base font-bold normal-case text-[#2b1705]" /></label>
            <label className="grid gap-1 text-xs font-black uppercase text-[#7c5a34]">Formato<input name="format" defaultValue="Media caja" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 text-base font-bold normal-case text-[#2b1705]" /></label>
            <label className="grid gap-1 text-xs font-black uppercase text-[#7c5a34]">Día de entrega<input name="deliveryDay" defaultValue="Miércoles" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 text-base font-bold normal-case text-[#2b1705]" /></label>
            <label className="grid gap-1 text-xs font-black uppercase text-[#7c5a34]">Duración de la oferta<input name="countdownHours" type="number" min="1" defaultValue="5" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 text-base font-bold normal-case text-[#2b1705]" /></label>
            <label className="grid gap-1 text-xs font-black uppercase text-[#7c5a34] md:col-span-2">Link de pago<input name="paymentLink" defaultValue="https://www.mercadopago.com.ar/link-demo" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 text-base font-bold normal-case text-[#2b1705]" /></label>
          </div>
          <button type="button" onClick={nextStep} className="justify-self-start rounded-2xl bg-[#B45309] px-5 py-3 font-black text-white">Siguiente</button>
        </section>

      <section className={step === 2 ? "mt-6 grid gap-5" : "hidden"}>
          <div><h3 className="text-2xl font-black">Cargar escala de precios</h3><p className="mt-1 text-sm font-bold text-[#7c5a34]">Mostrá solo la escala: desde, hasta y precio final.</p></div>
          <div className="grid gap-3">
            {defaultScales.map(([min, max, price], index) => <div key={index} className="grid items-end gap-2 rounded-2xl bg-[#fff8ed] p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
              <label className="text-xs font-black uppercase text-[#7c5a34]">Desde<input name={`scale${index}Min`} type="number" defaultValue={min} className="mt-1 w-full rounded-xl border border-[#f3d2a5] px-3 py-2 text-base text-[#2b1705]" /></label>
              <label className="text-xs font-black uppercase text-[#7c5a34]">Hasta<input name={`scale${index}Max`} type="number" defaultValue={max} className="mt-1 w-full rounded-xl border border-[#f3d2a5] px-3 py-2 text-base text-[#2b1705]" /></label>
              <label className="text-xs font-black uppercase text-[#7c5a34]">Precio<input name={`scale${index}Price`} type="number" defaultValue={price} className="mt-1 w-full rounded-xl border border-[#f3d2a5] px-3 py-2 text-base text-[#2b1705]" /></label>
              <span className="pb-2 text-sm font-black text-[#B45309]">participantes</span>
            </div>)}
          </div>
          <div className="flex flex-wrap gap-2"><button type="button" className="rounded-2xl border border-[#f3d2a5] px-5 py-3 font-black text-[#B45309]">Agregar escala</button><button type="button" onClick={nextStep} className="rounded-2xl bg-[#B45309] px-5 py-3 font-black text-white">Siguiente</button></div>
        </section>

      <section className={step === 3 ? "mt-6 grid gap-5" : "hidden"}>
          <div><h3 className="text-2xl font-black">Elegir Hubs</h3><p className="mt-1 text-sm font-bold text-[#7c5a34]">Lista simple. Sin reportes, métricas ni datos largos.</p></div>
          <div className="grid gap-2 md:grid-cols-2">
            {hubs.map((hub) => <label key={hub.id} className="flex items-center gap-3 rounded-2xl border border-[#f3d2a5] px-4 py-3 text-sm font-black"><input name="targetHubIds" value={hub.id} type="checkbox" checked={selectedHubIds.includes(hub.id)} onChange={() => toggleHub(hub.id)} /><span>{hub.nombre} — {hub.clientesActivos} usuarios</span></label>)}
          </div>
          <button type="button" onClick={nextStep} disabled={selectedHubIds.length === 0} className="justify-self-start rounded-2xl bg-[#B45309] px-5 py-3 font-black text-white disabled:opacity-50">Enviar oferta</button>
        </section>

      <section className={step === 4 ? "mt-6 grid gap-5" : "hidden"}>
          <div><h3 className="text-2xl font-black">Oferta enviada</h3><p className="mt-1 text-sm font-bold text-[#7c5a34]">Resumen simple antes de generar los links públicos.</p></div>
          <div className="rounded-3xl bg-[#fff8ed] p-5 font-bold leading-8"><p><b>Oferta enviada:</b><br />Media caja de huevos</p><p className="mt-3"><b>Cierra en:</b><br />5 horas</p><p className="mt-3"><b>Hubs seleccionados:</b></p><ul className="list-inside list-disc">{selectedHubs.map((hub) => <li key={hub.id}>{hub.nombre}</li>)}</ul><p className="mt-3 break-all"><b>Link de pago:</b><br />https://www.mercadopago.com.ar/link-demo</p></div>
          <div className="flex flex-wrap gap-2"><button type="button" className="rounded-2xl border border-[#f3d2a5] px-5 py-3 font-black text-[#B45309]">Copiar mensaje</button><button className="rounded-2xl bg-[#B45309] px-5 py-3 font-black text-white">Ver respuestas</button></div>
        </section>
    </form>
  );
}
