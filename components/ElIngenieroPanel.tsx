"use client";

import { FormEvent, useMemo, useState } from "react";
import { defaultElIngenieroConfig, type ElIngenieroConfig, type GenerateElIngenieroReplyOutput } from "@/lib/ai/elIngeniero";

type ConfigField = {
  key: keyof ElIngenieroConfig;
  label: string;
  rows: number;
};

const fields: ConfigField[] = [
  { key: "assistantName", label: "Nombre del asistente", rows: 1 },
  { key: "personality", label: "Personalidad", rows: 3 },
  { key: "hubyaContext", label: "Contexto de HUBYA", rows: 4 },
  { key: "services", label: "Servicios que puede explicar", rows: 4 },
  { key: "dataToCollect", label: "Datos que debe pedir", rows: 3 },
  { key: "humanHandoffRules", label: "Reglas de derivación a humano", rows: 4 },
  { key: "welcomeMessage", label: "Mensaje de bienvenida", rows: 3 },
  { key: "faqs", label: "Preguntas frecuentes", rows: 5 },
  { key: "avoidTopics", label: "Temas que debe evitar", rows: 3 },
];

export function ElIngenieroPanel() {
  const [config, setConfig] = useState<Required<ElIngenieroConfig>>(defaultElIngenieroConfig);
  const [message, setMessage] = useState("Hola, quiero saber cómo sumarme a HUBYA y qué datos necesitan.");
  const [result, setResult] = useState<GenerateElIngenieroReplyOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewPrompt = useMemo(
    () => [config.welcomeMessage, "", "Datos a capturar:", config.dataToCollect, "", "Derivar cuando:", config.humanHandoffRules].join("\n"),
    [config],
  );

  function updateConfig(key: keyof ElIngenieroConfig, value: string) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/el-ingeniero/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, config, source: "operativo" }),
      });
      const data = (await response.json()) as GenerateElIngenieroReplyOutput;
      if (!response.ok) throw new Error(data.reply || "No se pudo probar El Ingeniero.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo probar El Ingeniero.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-[2rem] border border-[#DDE7E2] bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1E8F4D]">Configuración</p>
        <h2 className="mt-2 text-2xl font-black">Entrenamiento por instrucciones</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#53685C]">
          Esta primera versión guarda la configuración en el estado local del panel. La estructura queda lista para persistirla más adelante sin tocar base de datos ahora.
        </p>

        <div className="mt-6 grid gap-4">
          {fields.map((field) => (
            <label key={field.key} className="grid gap-2">
              <span className="text-sm font-black text-[#0B1726]">{field.label}</span>
              <textarea
                value={config[field.key]}
                rows={field.rows}
                onChange={(event) => updateConfig(field.key, event.target.value)}
                className="w-full rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] px-4 py-3 text-sm font-semibold leading-6 outline-none transition focus:border-[#1E8F4D] focus:bg-white"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-[#DDE7E2] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#22C7E8]">Prueba</p>
          <h2 className="mt-2 text-2xl font-black">Probar respuesta de IA</h2>
          <label className="mt-5 grid gap-2">
            <span className="text-sm font-black text-[#0B1726]">Consulta</span>
            <textarea
              value={message}
              rows={6}
              onChange={(event) => setMessage(event.target.value)}
              className="w-full rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] px-4 py-3 text-sm font-semibold leading-6 outline-none transition focus:border-[#22C7E8] focus:bg-white"
              placeholder="Escribí una consulta para El Ingeniero"
            />
          </label>
          <button type="submit" disabled={isLoading} className="mt-4 w-full rounded-2xl bg-[#1E8F4D] px-5 py-4 text-sm font-black text-white shadow-sm transition hover:bg-[#166D3B] disabled:cursor-not-allowed disabled:opacity-60">
            {isLoading ? "Generando respuesta..." : "Probar El Ingeniero"}
          </button>
        </form>

        <div className="rounded-[2rem] border border-[#DDE7E2] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1E8F4D]">Respuesta generada</p>
          {error && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}
          {result ? (
            <div className="mt-4 grid gap-4">
              <p className="rounded-2xl bg-[#F8FAF7] p-4 text-sm font-semibold leading-6 text-[#0B1726]">{result.reply}</p>
              <p className="text-sm font-black text-[#53685C]">Derivar a humano: {result.needsHuman ? "Sí" : "No"}</p>
              {result.collectedData && Object.keys(result.collectedData).length > 0 && (
                <pre className="overflow-auto rounded-2xl bg-[#0B1726] p-4 text-xs font-semibold text-white">{JSON.stringify(result.collectedData, null, 2)}</pre>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm font-semibold leading-6 text-[#53685C]">La respuesta aparecerá acá después de enviar una consulta.</p>
          )}
        </div>

        <div className="rounded-[2rem] border border-dashed border-[#DDE7E2] bg-[#F8FAF7] p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#53685C]">Vista rápida</p>
          <pre className="mt-3 whitespace-pre-wrap text-xs font-semibold leading-6 text-[#53685C]">{previewPrompt}</pre>
        </div>
      </section>
    </div>
  );
}
