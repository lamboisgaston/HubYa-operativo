export type ElIngenieroConfig = {
  assistantName?: string;
  personality?: string;
  hubyaContext?: string;
  services?: string;
  dataToCollect?: string;
  humanHandoffRules?: string;
  welcomeMessage?: string;
  faqs?: string;
  avoidTopics?: string;
};

export type GenerateElIngenieroReplyInput = {
  message: string;
  config?: ElIngenieroConfig;
  fromPhone?: string;
  source?: string;
};

export type GenerateElIngenieroReplyOutput = {
  reply: string;
  needsHuman: boolean;
  collectedData?: Record<string, string>;
};

export const defaultElIngenieroConfig: Required<ElIngenieroConfig> = {
  assistantName: "El Ingeniero",
  personality: "Breve, amable, claro y operativo. Responde siempre en español.",
  hubyaContext:
    "HUBYA es una tecnología para agrupar demanda, oferta y operación en Hubs. Puede coordinar servicios, membresías, comunicación, reportes y procesos recurrentes.",
  services:
    "Servicios coordinados por Hubs, membresías HUBYA, comunicación operativa, reportes, procesos recurrentes y organización de oferta y demanda local.",
  dataToCollect: "Nombre, barrio o ciudad, rubro de interés y necesidad concreta.",
  humanHandoffRules:
    "Si no sabe, si faltan datos, si el usuario pide precios cerrados, acuerdos comerciales, soporte sensible o una decisión humana, debe derivar la consulta a Gastón o al equipo HUBYA.",
  welcomeMessage:
    "Hola, soy El Ingeniero de HUBYA. Puedo ayudarte a entender cómo funciona HUBYA, cómo sumarte a un Hub, consultar por servicios, membresías o dejar tus datos para que podamos contactarte.",
  faqs:
    "¿Cómo funciona HUBYA? Agrupa demanda, oferta y operación en Hubs. ¿Puedo sumarme? Sí, dejando datos de contacto, zona, rubro y necesidad. ¿Hay precios cerrados? Solo cuando el equipo tenga los datos necesarios.",
  avoidTopics: "No inventar información, no prometer precios cerrados sin datos, no dar asesoramiento legal, financiero o médico especializado.",
};

const fallbackReply = "El Ingeniero todavía no tiene IA activa. Dejá tu consulta y te responderemos a la brevedad.";

function mergeConfig(config?: ElIngenieroConfig): Required<ElIngenieroConfig> {
  return { ...defaultElIngenieroConfig, ...(config ?? {}) };
}

function buildSystemPrompt(config: Required<ElIngenieroConfig>) {
  return [
    `Sos ${config.assistantName}, asistente operativo de HUBYA.`,
    `Personalidad: ${config.personality}`,
    `Contexto de HUBYA: ${config.hubyaContext}`,
    `Servicios que podés explicar: ${config.services}`,
    `Datos que debés pedir: ${config.dataToCollect}`,
    `Reglas de derivación a humano: ${config.humanHandoffRules}`,
    `Mensaje de bienvenida: ${config.welcomeMessage}`,
    `Preguntas frecuentes: ${config.faqs}`,
    `Temas que debés evitar: ${config.avoidTopics}`,
    "Reglas obligatorias: respondé en español claro; sé breve, amable y operativo; no prometas precios cerrados si no tenés datos; no inventes información; si no sabés, decí que derivás la consulta a Gastón o al equipo HUBYA; priorizá capturar datos útiles para el operativo.",
    'Devolvé exclusivamente JSON válido con esta forma: {"reply":"texto para el usuario","needsHuman":false,"collectedData":{}}. needsHuman debe ser true cuando corresponda derivar a humano.',
  ].join("\n");
}

function safeParseReply(content: string): GenerateElIngenieroReplyOutput {
  try {
    const parsed = JSON.parse(content) as Partial<GenerateElIngenieroReplyOutput>;
    return {
      reply: typeof parsed.reply === "string" && parsed.reply.trim() ? parsed.reply : fallbackReply,
      needsHuman: Boolean(parsed.needsHuman),
      collectedData: parsed.collectedData && typeof parsed.collectedData === "object" ? parsed.collectedData : {},
    };
  } catch {
    return { reply: content.trim() || fallbackReply, needsHuman: true, collectedData: {} };
  }
}

export async function generateElIngenieroReply(input: GenerateElIngenieroReplyInput): Promise<GenerateElIngenieroReplyOutput> {
  const message = input.message?.trim();

  if (!message) {
    return { reply: "Contame tu consulta para que El Ingeniero pueda ayudarte.", needsHuman: false, collectedData: {} };
  }

  if (!process.env.OPENAI_API_KEY) {
    return { reply: fallbackReply, needsHuman: true, collectedData: {} };
  }

  const config = mergeConfig(input.config);
  const userContext = [
    `Mensaje del usuario: ${message}`,
    input.fromPhone ? `Teléfono de origen: ${input.fromPhone}` : undefined,
    input.source ? `Fuente: ${input.source}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(config) },
        { role: "user", content: userContext },
      ],
    }),
  });

  if (!response.ok) {
    return { reply: "El Ingeniero no pudo generar una respuesta ahora. Derivo tu consulta al equipo HUBYA.", needsHuman: true, collectedData: {} };
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content ?? "";
  return safeParseReply(content);
}
