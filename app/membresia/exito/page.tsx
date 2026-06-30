import Link from "next/link";
import { HubyaBrandLogo } from "@/components/HubyaBrandLogo";

export default function MembresiaExitoPage() {
  return (
    <main className="min-h-screen bg-[#05030b] px-5 py-12 text-white sm:px-8">
      <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-violet-300/20 bg-white/[0.055] p-8 text-center shadow-2xl shadow-violet-950/30 sm:p-10">
          <HubyaBrandLogo markOnly className="mx-auto h-16 w-16" />
          <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-violet-200">HUBYA Membership</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Membresía registrada</h1>
          <p className="mt-5 text-lg font-bold text-white/75">Gracias por sumarte a HUBYA.</p>
          <p className="mt-3 text-base font-semibold leading-7 text-white/60">Tu acceso queda asociado al email utilizado en Stripe.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className="rounded-full bg-violet-200 px-6 py-3 text-sm font-black text-[#12071f] transition hover:bg-violet-100">
              Volver a la web pública
            </Link>
            <Link href="/membresia" className="rounded-full border border-violet-300/30 px-6 py-3 text-sm font-black text-violet-100 transition hover:bg-violet-400/10">
              Ver membresía
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
