import Link from "next/link";
import { HubyaLogo } from "@/components/HubyaLogo";

export default function MembresiaPage() {
  return (
    <main className="min-h-screen bg-[#06110D] px-5 py-8 text-white sm:px-8">
      <section className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <Link href="/web-publica" className="flex items-center gap-3">
            <HubyaLogo className="h-10 w-auto" />
            <div>
              <p className="text-sm font-black tracking-[0.20em] text-[#22C7E8]">HUBYA</p>
              <p className="text-xs font-bold text-white/55">Membership</p>
            </div>
          </Link>

          <Link href="/web-publica" className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#06110D]">
            Volver
          </Link>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.75fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-7">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#22C7E8]">
              HUBYA Membership
            </p>

            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              Membresía mensual HUBYA
            </h1>

            <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-white/65">
              Acceso mensual a tecnología HUBYA para organización de Hubs, propuestas, comunicación, reportes y coordinación operativa recurrente.
            </p>

            <div className="mt-7 rounded-3xl border border-[#22C7E8]/20 bg-[#22C7E8]/10 p-6">
              <p className="text-5xl font-black text-[#22C7E8]">US$ 7</p>
              <p className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-white/55">
                por mes
              </p>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <h2 className="text-xl font-black">Organización de Hubs</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/55">
                  Herramientas para ordenar demanda, oferta y capacidad mensual agrupada.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <h2 className="text-xl font-black">Propuestas y reportes</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/55">
                  Gestión de propuestas, comunicación operativa y reportes del proceso.
                </p>
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm font-semibold leading-7 text-white/58">
                Cobrado por HUBYA LLC · Sheridan, Wyoming, United States.
                Contacto: contact@hubya.tech
              </p>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-7">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#22C7E8]">
              Estado
            </p>

            <h2 className="mt-4 text-3xl font-black">
              Paso listo para conectar Stripe
            </h2>

            <p className="mt-4 text-sm font-semibold leading-7 text-white/60">
              Esta página ya presenta la membresía. En el próximo paso vamos a crear el botón real de pago con Stripe Checkout.
            </p>

            <div className="mt-6 rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#06110D] opacity-70">
              Comprar membresía
              <span className="block text-xs font-bold opacity-60">
                Próximo paso
              </span>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/40">
                Producto Stripe
              </p>
              <p className="mt-2 break-all text-sm font-bold text-white/70">
                price_1TnQP0Csi5bFeeBgKj7OsG2X
              </p>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
