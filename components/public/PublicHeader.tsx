import Link from "next/link";
import { HubyaLogo } from "@/components/HubyaLogo";

export function PublicHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#DDE7E2] bg-white/90 px-6 py-3 shadow-sm backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href="/web-publica" className="inline-flex items-center" aria-label="HUBYA inicio">
          <HubyaLogo className="h-12 w-auto" />
        </Link>
        <div className="flex flex-wrap justify-end gap-4 text-sm font-bold text-[#375243]">
          <a className="transition hover:text-[#1E8F4D]" href="/web-publica#servicios-coordinados">¿Cómo funciona?</a>
          <a className="transition hover:text-[#1E8F4D]" href="/web-publica#modulos">Módulos</a>
          <a className="transition hover:text-[#1E8F4D]" href="/web-publica#hubs">Hubs</a>
          <Link className="transition hover:text-[#1E8F4D]" href="/operativo">Operativo</Link>
        </div>
      </nav>
    </header>
  );
}
