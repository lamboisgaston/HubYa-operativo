export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4f6f1] text-[#182018]">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        <header className="mb-10 flex items-center justify-between border-b border-[#d8ddcf] pb-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#66745c]">
              Plataforma Operativa
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              HubYa
            </h1>
          </div>

          <div className="rounded-full border border-[#cfd7c6] bg-white px-4 py-2 text-sm font-medium text-[#3c4937] shadow-sm">
            MVP interno
          </div>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-[#dde4d6]">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#7b8b70]">
              Sistema de jornadas
            </p>

            <h2 className="max-w-2xl text-4xl font-bold leading-tight">
              Agrupamos demanda, coordinamos oferta y emitimos reportes privados del Hub.
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4d5b48]">
              HubYa permite cargar una jornada operativa, registrar qué se hizo,
              qué quedó pendiente, cuánto pagó cada cliente y cómo se distribuyó
              el valor entre equipo, logística, maquinaria, administración y utilidad.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[#dfe7d9] bg-[#f8faf5] p-5">
                <p className="text-sm font-semibold text-[#718067]">Paso 1</p>
                <h3 className="mt-2 text-xl font-bold">Hubs</h3>
                <p className="mt-2 text-sm leading-6 text-[#5c6955]">
                  Tipal, Pradera, Prado, Punto o Chacras.
                </p>
              </div>

              <div className="rounded-2xl border border-[#dfe7d9] bg-[#f8faf5] p-5">
                <p className="text-sm font-semibold text-[#718067]">Paso 2</p>
                <h3 className="mt-2 text-xl font-bold">Jornadas</h3>
                <p className="mt-2 text-sm leading-6 text-[#5c6955]">
                  Carga diaria de trabajos, pendientes y números.
                </p>
              </div>

              <div className="rounded-2xl border border-[#dfe7d9] bg-[#f8faf5] p-5">
                <p className="text-sm font-semibold text-[#718067]">Paso 3</p>
                <h3 className="mt-2 text-xl font-bold">Reportes</h3>
                <p className="mt-2 text-sm leading-6 text-[#5c6955]">
                  Envío privado por email a cada cliente.
                </p>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl bg-[#1f2a1d] p-8 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b8c9ad]">
              Hub Tipal
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              Reporte de jornada
            </h2>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl bg-white/10 p-5">
                <p className="text-sm text-[#c8d5c1]">Cliente visible</p>
                <p className="mt-1 text-2xl font-bold">Carolina Yovi</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-5">
                <p className="text-sm text-[#c8d5c1]">Participantes del Hub</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Carolina Yovi</span>
                    <span>$45.000</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Cliente 2</span>
                    <span>$38.000</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Cliente 3</span>
                    <span>$52.000</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white/10 p-5">
                <p className="text-sm text-[#c8d5c1]">Distribución</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Capataz</span>
                    <span>$15.000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ayudante</span>
                    <span>$10.000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Maquinaria</span>
                    <span>$3.000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Traslado</span>
                    <span>$4.000</span>
                  </div>
                  <div className="flex justify-between border-t border-white/20 pt-3 font-bold">
                    <span>Total</span>
                    <span>$45.000</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
