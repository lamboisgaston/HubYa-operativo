const INGENIERO_WHATSAPP_FALLBACK_URL =
  "https://wa.me/13072434106?text=Hola%20Ingeniero%2C%20quiero%20consultar%20por%20HUBYA";

export function getIngenieroWhatsappUrl() {
  return process.env.NEXT_PUBLIC_INGENIERO_WHATSAPP_URL || INGENIERO_WHATSAPP_FALLBACK_URL;
}

export function IngenieroWhatsappCard({ compact = false }: { compact?: boolean }) {
  const whatsappUrl = getIngenieroWhatsappUrl();

  return (
    <section className="relative overflow-hidden rounded-[1.7rem] border border-emerald-300/20 bg-[#07120f]/80 p-6 shadow-2xl shadow-emerald-950/20 ring-1 ring-white/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.20),transparent_34%),radial-gradient(circle_at_86%_70%,rgba(124,58,237,0.22),transparent_32%)]" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className={compact ? "max-w-2xl" : "max-w-3xl"}>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">El Ingeniero</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Hablar con El Ingeniero</h2>
          <p className="mt-3 text-sm font-semibold leading-7 text-white/62">
            Consultá por HUBYA, Hubs, servicios, membresías o coordinación operativa.
          </p>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-[#04120d] shadow-lg shadow-emerald-950/30 transition hover:bg-white"
        >
          Abrir WhatsApp
        </a>
      </div>
    </section>
  );
}
