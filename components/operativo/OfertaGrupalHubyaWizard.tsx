"use client";

import { useMemo, useState } from "react";
import type { Cliente, HubPublico } from "@/lib/data/hubs";
import { formatCurrency } from "@/lib/sales/format";

type Props = { hubs: HubPublico[]; clientes: Cliente[]; action: (formData: FormData) => void | Promise<void> };

const defaultScales = [[1, 5, 45000], [6, 10, 42000], [11, 30, 39000], [31, 999, 37000]];

export function OfertaGrupalHubyaWizard({ hubs, clientes, action }: Props) {
  const [step, setStep] = useState(1);
  const [sale, setSale] = useState({ productName: "Huevos", format: "Media caja", deliveryDay: "Miércoles", paymentLink: "https://www.mercadopago.com.ar/link-demo", countdownHours: "5" });
  const [selectedHubIds, setSelectedHubIds] = useState<string[]>([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const selectedHubs = useMemo(() => hubs.filter((hub) => selectedHubIds.includes(hub.id)), [hubs, selectedHubIds]);
  const selectedCustomers = clientes.filter((cliente) => selectedCustomerIds.includes(cliente.id));

  function nextStep() { setStep((current) => Math.min(4, current + 1)); }
  function prevStep() { setStep((current) => Math.max(1, current - 1)); }
  function toggleHub(hubId: string) { setSelectedHubIds((current) => current.includes(hubId) ? current.filter((id) => id !== hubId) : [...current, hubId]); }
  function toggleCustomer(id: string) { setSelectedCustomerIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  function setHubCustomers(hubId: string, checked: boolean) {
    const ids = clientes.filter((cliente) => cliente.hubId === hubId && cliente.estado === "activo").map((cliente) => cliente.id);
    setSelectedHubIds((current) => checked && !current.includes(hubId) ? [...current, hubId] : current);
    setSelectedCustomerIds((current) => checked ? Array.from(new Set([...current, ...ids])) : current.filter((id) => !ids.includes(id)));
  }

  return <form action={action} className="rounded-[2rem] border border-[#f3d2a5] bg-white p-6 shadow-sm">
    <input type="hidden" name="title" value={`Propuesta HUBYA — ${sale.productName} a domicilio para el ${sale.deliveryDay}`} />
    <input type="hidden" name="description" value="Tu Hub fue invitado a participar de esta oferta grupal." />
    <input type="hidden" name="deliveryMode" value="Entrega coordinada HUBYA" />
    <input type="hidden" name="notes" value="Mientras más integrantes participen, mejor precio consigue el grupo. Si al cierre corresponde un precio menor al pagado, la diferencia queda como saldo a favor o se bonifica con mercadería equivalente." />
    {selectedHubIds.map((id) => <input key={id} type="hidden" name="targetHubIds" value={id} />)}
    {selectedCustomerIds.map((id) => <input key={id} type="hidden" name="targetCustomerIds" value={id} />)}

    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#B45309]">HueverosYa guiado</p><h2 className="mt-1 text-2xl font-black">Paso {step} de 4</h2></div>
      <span className="rounded-full bg-[#fff8ed] px-4 py-2 text-xs font-black text-[#B45309]">Una pantalla = una decisión</span>
    </div>

    <section className={step === 1 ? "mt-6 grid gap-5" : "hidden"}>
      <div><h3 className="text-2xl font-black">Paso 1 — Parámetros de venta</h3><p className="mt-1 text-sm font-bold text-[#7c5a34]">Solo producto, formato, entrega, link, cierre y escala. Sin respuestas ni logística.</p></div>
      <div className="grid gap-3 md:grid-cols-2">
        {[["productName", "Producto"], ["format", "Formato"], ["deliveryDay", "Día de entrega"], ["countdownHours", "La oferta cierra en horas"], ["paymentLink", "Link de pago"]].map(([name, label]) => <label key={name} className={`grid gap-1 text-xs font-black uppercase text-[#7c5a34] ${name === "paymentLink" ? "md:col-span-2" : ""}`}>{label}<input name={name} value={sale[name as keyof typeof sale]} onChange={(event) => setSale({ ...sale, [name]: event.target.value })} type={name === "countdownHours" ? "number" : "text"} min="1" className="rounded-2xl border border-[#f3d2a5] px-4 py-3 text-base font-bold normal-case text-[#2b1705]" /></label>)}
      </div>
      <div className="grid gap-3">{defaultScales.map(([min, max, price], index) => <div key={index} className="grid items-end gap-2 rounded-2xl bg-[#fff8ed] p-3 md:grid-cols-3"><input type="hidden" name={`scale${index}Min`} value={min} /><input type="hidden" name={`scale${index}Max`} value={max} /><label className="text-xs font-black uppercase text-[#7c5a34]">Participantes<span className="mt-1 block rounded-xl bg-white px-3 py-2 text-base text-[#2b1705]">{min} a {max >= 999 ? "más" : max}</span></label><label className="text-xs font-black uppercase text-[#7c5a34]">Precio<input name={`scale${index}Price`} type="number" defaultValue={price} className="mt-1 w-full rounded-xl border border-[#f3d2a5] px-3 py-2 text-base text-[#2b1705]" /></label><p className="pb-2 text-sm font-black text-[#B45309]">escala grupal</p></div>)}</div>
      <button type="button" onClick={nextStep} className="justify-self-start rounded-2xl bg-[#B45309] px-5 py-3 font-black text-white">Siguiente: elegir destinatarios</button>
    </section>

    <section className={step === 2 ? "mt-6 grid gap-5" : "hidden"}>
      <div><h3 className="text-2xl font-black">Paso 2 — Destinatarios</h3><p className="mt-1 text-sm font-bold text-[#7c5a34]">Elegí todo el Hub, personas puntuales o excluí vecinos antes de enviar.</p></div>
      <div className="grid gap-3">{hubs.map((hub) => { const hubClientes = clientes.filter((cliente) => cliente.hubId === hub.id && cliente.estado === "activo"); return <details key={hub.id} open={selectedHubIds.includes(hub.id)} className="rounded-2xl border border-[#f3d2a5] p-4"><summary className="cursor-pointer font-black"><input type="checkbox" className="mr-2" checked={selectedHubIds.includes(hub.id)} onChange={() => toggleHub(hub.id)} />{hub.nombre} · {hubClientes.length} personas</summary><label className="mt-3 block rounded-xl bg-[#fff8ed] p-3 text-sm font-black"><input type="checkbox" className="mr-2" checked={hubClientes.length > 0 && hubClientes.every((cliente) => selectedCustomerIds.includes(cliente.id))} onChange={(event) => setHubCustomers(hub.id, event.target.checked)} />Enviar a todo el Hub</label><div className="mt-2 grid gap-2 md:grid-cols-2">{hubClientes.map((cliente) => <label key={cliente.id} className="rounded-xl bg-[#fff8ed] p-3 text-sm font-bold"><input type="checkbox" className="mr-2" checked={selectedCustomerIds.includes(cliente.id)} onChange={() => toggleCustomer(cliente.id)} />{cliente.nombre || "Cliente"} · {cliente.email || "sin email"}</label>)}</div></details>; })}</div>
      <div className="flex gap-2"><button type="button" onClick={prevStep} className="rounded-2xl border border-[#f3d2a5] px-5 py-3 font-black text-[#B45309]">Atrás</button><button type="button" onClick={nextStep} disabled={selectedHubIds.length === 0} className="rounded-2xl bg-[#B45309] px-5 py-3 font-black text-white disabled:opacity-50">Siguiente: vista previa</button></div>
    </section>

    <section className={step === 3 ? "mt-6 grid gap-5" : "hidden"}>
      <div><h3 className="text-2xl font-black">Paso 3 — Vista previa del mensaje</h3><p className="mt-1 text-sm font-bold text-[#7c5a34]">Revisá el modelo que recibirá el cliente antes de enviarlo.</p></div>
      <div className="rounded-3xl bg-[#fff8ed] p-5 font-bold leading-7"><p><b>Asunto:</b><br />Propuesta HUBYA — {sale.productName} a domicilio para el {sale.deliveryDay.toLowerCase()}</p><p className="mt-4"><b>Mensaje:</b><br />Hola, HUBYA te acerca una propuesta para tu Hub.</p><p className="mt-3">Producto:<br />{sale.format} de {sale.productName.toLowerCase()}</p><p>Entrega:<br />{sale.deliveryDay}</p><p>La oferta cierra en:<br />{sale.countdownHours} horas</p><p className="break-all">Link de pago:<br />{sale.paymentLink}</p><p className="mt-3">Escala de precio grupal:</p><ul className="list-inside list-disc">{defaultScales.map(([min, max, price]) => <li key={min}>{min} a {max >= 999 ? "más participantes" : `${max} participantes`}: {formatCurrency(price)}</li>)}</ul><p className="mt-3">Mientras más integrantes participen, mejor precio consigue el grupo.</p><p>Si al cierre corresponde un precio menor al pagado, la diferencia queda como saldo a favor o se bonifica con mercadería equivalente.</p><p>Para responder: [link público de la propuesta]</p></div>
      <div className="flex gap-2"><button type="button" onClick={prevStep} className="rounded-2xl border border-[#f3d2a5] px-5 py-3 font-black text-[#B45309]">Atrás</button><button type="button" onClick={nextStep} className="rounded-2xl bg-[#B45309] px-5 py-3 font-black text-white">Siguiente: enviar</button></div>
    </section>

    <section className={step === 4 ? "mt-6 grid gap-5" : "hidden"}>
      <div><h3 className="text-2xl font-black">Paso 4 — Enviar propuesta</h3><p className="mt-1 text-sm font-bold text-[#7c5a34]">Se generará una propuesta por Hub seleccionado y quedará lista para recolectar respuestas.</p></div>
      <div className="rounded-3xl bg-[#fff8ed] p-5 font-bold"><p>Hubs: {selectedHubs.map((hub) => hub.nombre).join(", ") || "sin seleccionar"}</p><p>Personas específicas: {selectedCustomers.length || "todo el Hub si no se eligieron personas"}</p></div>
      <div className="flex gap-2"><button type="button" onClick={prevStep} className="rounded-2xl border border-[#f3d2a5] px-5 py-3 font-black text-[#B45309]">Atrás</button><button className="rounded-2xl bg-[#B45309] px-5 py-3 font-black text-white">Enviar propuesta</button></div>
    </section>
  </form>;
}
