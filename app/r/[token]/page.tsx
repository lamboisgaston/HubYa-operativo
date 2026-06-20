import Link from "next/link";
import { registrarRespuestaPorToken } from "@/lib/data/mensajes";

export default async function ResponderMensajePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const resultado = await registrarRespuestaPorToken(token);
  return <main className="flex min-h-screen items-center justify-center bg-[#f6f8f3] p-6 text-[#1f2a1d]"><section className="max-w-xl rounded-[2rem] border border-[#d8dfd1] bg-white p-8 text-center shadow-sm"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#66745c]">Mensajes HUBYA</p><h1 className="mt-3 text-3xl font-black">{resultado.ok ? "Gracias, tu respuesta fue registrada." : "No pudimos registrar esta respuesta."}</h1>{resultado.hubNombre && <p className="mt-3 text-sm font-bold text-[#66745c]">Respuesta registrada para {resultado.hubNombre}.</p>}<p className="mt-5 text-sm font-semibold text-[#66745c]">{resultado.message}</p><Link href="/" className="mt-6 inline-flex rounded-2xl bg-[#1f2a1d] px-5 py-3 text-sm font-black text-white">Volver</Link></section></main>;
}
