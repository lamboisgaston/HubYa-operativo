import Link from "next/link";
import { ElIngenieroPanel } from "@/components/ElIngenieroPanel";

export default function ElIngenieroPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,199,232,0.14),transparent_34%),#F8FAF7] px-4 py-6 text-[#0B1726] sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-[2rem] border border-[#DDE7E2] bg-white/95 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1E8F4D]">HUBYA Operativo</p>
              <h1 className="mt-2 text-4xl font-black">El Ingeniero</h1>
              <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[#53685C]">Asistente operativo de HUBYA</p>
            </div>
            <Link href="/operativo" className="rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] px-4 py-3 text-sm font-black text-[#0B1726] transition hover:border-[#1E8F4D]">
              ← Volver al operativo
            </Link>
          </div>
        </header>

        <ElIngenieroPanel />
      </section>
    </main>
  );
}
