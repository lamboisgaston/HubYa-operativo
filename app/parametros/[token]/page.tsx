import Link from "next/link";
import { registrarRespuestaParametroPorToken, verificarTokenRespuestaParametro } from "@/lib/data/parameterResponses";

function formatoValor(valor: number | string, tipo: string) {
  if (tipo === "percent") return `${valor}%`;
  if (tipo === "money") return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(valor || 0));
  return String(valor || "—");
}

export default async function ResponderParametroPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams?: Promise<{ comment?: string; suggestedValue?: string }> }) {
  const { token } = await params;
  const query = await searchParams;
  const payload = verificarTokenRespuestaParametro(token);

  if (payload?.response === "sugerir_otro_valor" && !query?.suggestedValue) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f6f8f3] p-6 text-[#1f2a1d]"><section className="w-full max-w-xl rounded-[2rem] border border-[#d8dfd1] bg-white p-8 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#66745c]">Parámetros de referencia del Hub</p><h1 className="mt-3 text-3xl font-black">Sugerir otro valor</h1><p className="mt-3 text-sm font-semibold text-[#66745c]">Tu sugerencia ayuda a mantener actualizados los valores de trabajo. El valor no cambia automáticamente: primero será revisado por el equipo operativo.</p><div className="mt-5 rounded-2xl bg-[#f8faf5] p-4 text-sm font-bold"><p>Parámetro: {payload.parameterLabel}</p><p>Valor actual de referencia: {formatoValor(payload.currentValue, payload.currentValueType)}</p></div><form className="mt-5 grid gap-3" action={`/parametros/${encodeURIComponent(token)}`}><label className="grid gap-1 text-sm font-black">Mi valor sugerido es:<input name="suggestedValue" required inputMode="decimal" className="h-12 rounded-xl border border-[#cfd8c6] px-3 text-sm font-semibold" placeholder={payload.currentValueType === "percent" ? "Ej: 15" : "Ej: 6000"} /></label><label className="grid gap-1 text-sm font-black">Comentario opcional:<textarea name="comment" className="min-h-24 rounded-xl border border-[#cfd8c6] p-3 text-sm font-semibold" placeholder="Agregá una aclaración si hace falta." /></label><button className="rounded-2xl bg-[#1f2a1d] px-5 py-3 text-sm font-black text-white">Enviar sugerencia</button></form></section></main>;
  }

  const resultado = await registrarRespuestaParametroPorToken(token, { comment: query?.comment, suggestedValue: query?.suggestedValue });
  return <main className="flex min-h-screen items-center justify-center bg-[#f6f8f3] p-6 text-[#1f2a1d]"><section className="max-w-xl rounded-[2rem] border border-[#d8dfd1] bg-white p-8 text-center shadow-sm"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#66745c]">Parámetros de referencia del Hub</p><h1 className="mt-3 text-3xl font-black">{resultado.ok ? "Gracias, tu sugerencia fue registrada." : "No pudimos registrar esta respuesta."}</h1>{resultado.hubNombre && <p className="mt-3 text-sm font-bold text-[#66745c]">Respuesta registrada para {resultado.hubNombre}.</p>}<p className="mt-5 text-sm font-semibold text-[#66745c]">{resultado.message}</p><p className="mt-3 rounded-2xl bg-[#f8faf5] p-4 text-sm font-bold text-[#66745c]">Los gastos cuentan lo que pasó en el día. Los parámetros definen reglas de referencia del Hub. El cliente puede ayudar a mejorarlas, pero no las cambia automáticamente.</p><details className="mt-6 rounded-2xl border border-[#cfd8c6] bg-[#f8faf5] p-4 text-left"><summary className="cursor-pointer text-sm font-black">¿Querés agregar un comentario?</summary><form className="mt-3 grid gap-3" action={`/parametros/${encodeURIComponent(token)}`}><textarea name="comment" placeholder="Escribí una observación opcional." className="min-h-24 rounded-xl border border-[#cfd8c6] p-3 text-sm font-semibold" /><button className="rounded-2xl bg-[#1f2a1d] px-5 py-3 text-sm font-black text-white">Guardar comentario</button></form></details><Link href="/" className="mt-6 inline-flex rounded-2xl border border-[#cfd8c6] px-5 py-3 text-sm font-black">Volver</Link></section></main>;
}
