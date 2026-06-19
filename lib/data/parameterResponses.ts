import { createHmac, timingSafeEqual } from "node:crypto";
import { getPublicStore, updatePublicStore, type Hub, type Cliente } from "@/lib/data/hubs";

export type ParameterResponseChoice = "confirmar_valor" | "sugerir_otro_valor" | "sugerir_subir" | "sugerir_bajar" | "necesito_aclaracion";
export type ParameterResponseStatus = "nueva" | "leida" | "considerada" | "aplicada" | "archivada";
export type ParameterValueType = "money" | "percent" | "hours" | "text";

export type ParameterResponse = {
  id: string;
  hubId: string;
  reportId: string;
  contactId: string;
  parameterKey: string;
  parameterLabel: string;
  currentValue: number | string;
  currentValueType: ParameterValueType;
  responseType: ParameterResponseChoice;
  response?: ParameterResponseChoice;
  suggestedValue?: number | string;
  comment?: string;
  status: ParameterResponseStatus;
  createdAt: string;
  internalNote?: string;
};

export type ParameterConsultationTokenPayload = Omit<ParameterResponse, "id" | "status" | "createdAt" | "comment" | "internalNote"> & { createdFor: string };

type StoreConParametros = Omit<Awaited<ReturnType<typeof getPublicStore>>, "parameterResponses"> & { parameterResponses: ParameterResponse[] };

const choices = new Set<ParameterResponseChoice>(["confirmar_valor", "sugerir_otro_valor", "sugerir_subir", "sugerir_bajar", "necesito_aclaracion"]);
const statuses = new Set<ParameterResponseStatus>(["nueva", "leida", "considerada", "aplicada", "archivada"]);

function b64url(input: string | Buffer) { return Buffer.from(input).toString("base64url"); }
function fromB64url(input: string) { return Buffer.from(input, "base64url").toString("utf8"); }
function secret() { return process.env.PARAMETER_RESPONSE_TOKEN_SECRET || process.env.RESEND_API_KEY || "hubya-local-parameter-response-secret"; }
function sign(data: string) { return createHmac("sha256", secret()).update(data).digest("base64url"); }
function uid() { return `param-resp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
function texto(v: unknown) { return typeof v === "string" ? v.trim() : ""; }

function normalizar(base: unknown) {
  const store = base as StoreConParametros & { parameterResponses?: unknown[] };
  store.parameterResponses = Array.isArray(store.parameterResponses) ? store.parameterResponses.map((item) => { const r = item as Partial<ParameterResponse>; const legacyResponse = (r.response || r.responseType) as ParameterResponseChoice; const responseType = legacyResponse === ("confirmar" as ParameterResponseChoice) ? "confirmar_valor" : legacyResponse; return { ...r, responseType, response: responseType, status: statuses.has(r.status as ParameterResponseStatus) ? r.status as ParameterResponseStatus : "nueva" } as ParameterResponse; }) : [];
  return store as StoreConParametros;
}

export function crearTokenRespuestaParametro(payload: ParameterConsultationTokenPayload) {
  const data = b64url(JSON.stringify(payload));
  return `${data}.${sign(data)}`;
}

export function verificarTokenRespuestaParametro(token: string): ParameterConsultationTokenPayload | null {
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;
  const expected = sign(data);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const payload = JSON.parse(fromB64url(data)) as ParameterConsultationTokenPayload;
  if (!payload.hubId || !payload.reportId || !payload.contactId || !payload.parameterKey || !payload.parameterLabel || !choices.has(payload.responseType)) return null;
  return payload;
}

export async function registrarRespuestaParametroPorToken(token: string, input?: { comment?: string; suggestedValue?: string }) {
  const payload = verificarTokenRespuestaParametro(token);
  if (!payload) return { ok: false, message: "El link no es válido o está vencido." };
  const timestamp = new Date().toISOString();
  let response: ParameterResponse | null = null;
  let hub: Hub | undefined;
  let contact: Cliente | undefined;
  await updatePublicStore((base) => {
    const store = normalizar(base);
    hub = store.hubs.find((h) => h.id === payload.hubId);
    contact = store.clientes.find((c) => c.id === payload.contactId);
    const existing = store.parameterResponses.find((r) => r.hubId === payload.hubId && r.reportId === payload.reportId && r.contactId === payload.contactId && r.parameterKey === payload.parameterKey && r.responseType === payload.responseType);
    response = { id: existing?.id || uid(), ...payload, response: payload.responseType, suggestedValue: texto(input?.suggestedValue) || existing?.suggestedValue, comment: texto(input?.comment) || existing?.comment, status: existing?.status || "nueva", createdAt: existing?.createdAt || timestamp, internalNote: existing?.internalNote };
    store.parameterResponses = [response, ...store.parameterResponses.filter((r) => r.id !== response!.id)];
    return store;
  });
  return { ok: true, message: `Registramos tu respuesta sobre el parámetro ${payload.parameterLabel} del Hub.`, response, hubNombre: hub?.nombre, contactNombre: contact?.nombre };
}

export async function getParameterResponses(hubId?: string) {
  const store = normalizar(await getPublicStore());
  return store.parameterResponses.filter((r) => !hubId || r.hubId === hubId);
}

export async function updateParameterResponse(id: string, input: { status?: string; internalNote?: string }) {
  let updated: ParameterResponse | null = null;
  await updatePublicStore((base) => {
    const store = normalizar(base);
    store.parameterResponses = store.parameterResponses.map((r) => {
      if (r.id !== id) return r;
      updated = { ...r, status: statuses.has(input.status as ParameterResponseStatus) ? input.status as ParameterResponseStatus : r.status, internalNote: input.internalNote === undefined ? r.internalNote : texto(input.internalNote) };
      return updated;
    });
    return store;
  });
  return updated;
}
