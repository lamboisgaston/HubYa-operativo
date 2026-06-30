import Link from "next/link";
import { HubyaBrandLogo } from "@/components/HubyaBrandLogo";

export default function MembresiaCanceladaPage() {
  return (
    <main className="min-h-screen bg-[#05030b] px-5 py-12 text-white sm:px-8">
      <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.055] p-8 text-center shadow-2xl shadow-black/30 sm:p-10">
          <HubyaBrandLogo markOnly className="mx-auto h-16 w-16" />
          <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-violet-200">HUBYA Membership</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">La suscripción no fue completada</h1>
          <p className="mt-5 text-base font-semibold leading-7 text-white/65">Podés volver a intentar cuando quieras desde la página de membresía.</p>
          <Link href="/membresia" className="mt-8 inline-flex rounded-full bg-violet-200 px-6 py-3 text-sm font-black text-[#12071f] transition hover:bg-violet-100">
            Volver a membresía
          </Link>
        </div>
      </section>
    </main>
  );
}
