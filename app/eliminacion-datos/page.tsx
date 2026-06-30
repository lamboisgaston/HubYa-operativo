import Link from "next/link";

export const metadata = {
  title: "Eliminación de datos",
  description: "Instrucciones para solicitar la eliminación de datos en HUBYA.",
};

export default function EliminacionDatosPage() {
  return (
    <main className="min-h-screen bg-[#05030b] px-5 py-12 text-white sm:px-8">
      <section className="mx-auto max-w-3xl rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-7 shadow-2xl shadow-black/20 sm:p-10">
        <Link href="/" className="text-sm font-black text-violet-200 transition hover:text-white">
          ← Volver a HUBYA
        </Link>

        <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">Eliminación de datos</h1>

        <div className="mt-8 space-y-6 text-sm font-semibold leading-7 text-white/70 sm:text-base sm:leading-8">
          <p>
            Cualquier persona puede solicitar la eliminación de sus datos escribiendo a{" "}
            <a href="mailto:contact@hubya.tech" className="text-violet-200 underline underline-offset-4 hover:text-white">
              contact@hubya.tech
            </a>
            .
          </p>

          <p>
            Para identificar correctamente la información, la solicitud debe incluir el nombre y el teléfono o email
            utilizado para comunicarse con HUBYA.
          </p>

          <p>
            HUBYA revisará la solicitud y eliminará o anonimizará los datos operativos cuando corresponda, de acuerdo
            con las necesidades legales, administrativas y operativas aplicables.
          </p>
        </div>
      </section>
    </main>
  );
}
