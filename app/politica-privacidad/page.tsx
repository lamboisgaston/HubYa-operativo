import Link from "next/link";

export const metadata = {
  title: "Política de privacidad de HUBYA",
  description: "Política de privacidad pública de HUBYA.",
};

export default function PoliticaPrivacidadPage() {
  return (
    <main className="min-h-screen bg-[#05030b] px-5 py-12 text-white sm:px-8">
      <section className="mx-auto max-w-3xl rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-7 shadow-2xl shadow-black/20 sm:p-10">
        <Link href="/" className="text-sm font-black text-violet-200 transition hover:text-white">
          ← Volver a HUBYA
        </Link>

        <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">Política de privacidad de HUBYA</h1>

        <div className="mt-8 space-y-6 text-sm font-semibold leading-7 text-white/70 sm:text-base sm:leading-8">
          <p>
            <strong className="text-white">Responsable:</strong> HUBYA LLC.
            <br />
            <strong className="text-white">Contacto:</strong>{" "}
            <a href="mailto:contact@hubya.tech" className="text-violet-200 underline underline-offset-4 hover:text-white">
              contact@hubya.tech
            </a>
            .
          </p>

          <p>
            HUBYA puede recopilar datos personales y operativos como nombre, teléfono, email, ciudad o barrio,
            mensajes enviados por WhatsApp o formularios, y rubro de interés.
          </p>

          <p>
            Estos datos se usan para responder consultas, organizar Hubs, coordinar servicios, gestionar membresías,
            preparar reportes y sostener la comunicación operativa vinculada a HUBYA.
          </p>

          <p>
            HUBYA no vende datos personales. La información se utiliza para fines operativos propios de la plataforma
            y para la coordinación de las solicitudes recibidas.
          </p>

          <p>
            El usuario puede solicitar la eliminación o modificación de sus datos escribiendo a{" "}
            <a href="mailto:contact@hubya.tech" className="text-violet-200 underline underline-offset-4 hover:text-white">
              contact@hubya.tech
            </a>
            .
          </p>

          <p>
            Si el usuario se comunica con HUBYA por WhatsApp, también aplican las políticas y condiciones de Meta y
            WhatsApp.
          </p>
        </div>
      </section>
    </main>
  );
}
