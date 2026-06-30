import Link from "next/link";

export const metadata = {
  title: "Términos de uso",
  description: "Términos de uso públicos de HUBYA.",
};

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-[#05030b] px-5 py-12 text-white sm:px-8">
      <section className="mx-auto max-w-3xl rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-7 shadow-2xl shadow-black/20 sm:p-10">
        <Link href="/" className="text-sm font-black text-violet-200 transition hover:text-white">
          ← Volver a HUBYA
        </Link>

        <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">Términos de uso</h1>

        <div className="mt-8 space-y-6 text-sm font-semibold leading-7 text-white/70 sm:text-base sm:leading-8">
          <p>
            HUBYA es una plataforma tecnológica para organizar Hubs, comunicación, reportes, membresías y coordinación
            operativa.
          </p>

          <p>
            La información entregada por asistentes, formularios o canales digitales es orientativa y puede requerir
            confirmación humana antes de ser considerada definitiva.
          </p>

          <p>
            Para consultas sobre estos términos, escribinos a{" "}
            <a href="mailto:contact@hubya.tech" className="text-violet-200 underline underline-offset-4 hover:text-white">
              contact@hubya.tech
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
