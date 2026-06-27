import { revalidatePath } from "next/cache";
import { getHubs, readStore, saveStore, type Cliente } from "@/lib/data/hubs";
import { mensajeErrorResend, obtenerRemitenteResend, obtenerReplyToResend } from "@/lib/email/resend";

export type SalesProposalStatus = "Borrador" | "Abierta" | "Cerrada" | "Confirmada" | "Entregada" | "Cancelada";
export type SalesResponseStatus = "Pendiente" | "Participa" | "No participa";
export type SalesProposalPricingMode = "automatic" | "manual";

export type SalesProposalPriceScale = {
  minParticipants: number;
  maxParticipants: number | null;
  price: number;
};

export type SalesProposal = {
  id: string;
  branchId: "ventas";
  hubId: string;
  proposalGroupId?: string;
  title: string;
  productName: string;
  format: string;
  description?: string;
  paymentLink?: string;
  price: number;
  priceScales: SalesProposalPriceScale[];
  acceptedParticipantsCount: number;
  pricingParticipantsCount: number;
  pricingMode: SalesProposalPricingMode;
  pricingOverrideReason: string;
  pricingUpdatedAt: string;
  pricingUpdatedBy: string;
  deliveryDay: string;
  deliveryMode: string;
  notes: string;
  responseDeadline: string;
  countdownHours: number;
  status: SalesProposalStatus;
  publicLink: string;
  createdAt: string;
  closedAt?: string;
  targetCustomerIds?: string[];
  sentCount?: number;
};

export type SalesProposalResponse = {
  id: string;
  proposalId: string;
  targetHubId: string;
  userId?: string;
  customerName: string;
  phone: string;
  address: string;
  responseStatus: SalesResponseStatus;
  quantity: number;
  deliveryAvailability: "Sí, voy a estar" | "No voy a estar" | "";
  preferredDeliveryTime?: "Mañana" | "Mediodía" | "Tarde" | "Otro horario" | "";
  deliveryPreference: "" | "Dejar en portería / guardia" | "Dejar con vecino" | "Coordinar observación" | "Otra indicación";
  deliveryNotes: string;
  respondedAt: string;
};

type SalesStore = Omit<Awaited<ReturnType<typeof readStore>>, "salesProposals" | "salesProposalResponses"> & {
  salesProposals?: SalesProposal[];
  salesProposalResponses?: SalesProposalResponse[];
};


const DEFAULT_PAYMENT_LINK = "https://www.mercadopago.com.ar/link-de-pago-demo-hubya";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function hours(value: FormDataEntryValue | null) {
  const parsed = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
}

function deadlineFromHours(countdownHours: number, createdAt = new Date()) {
  return new Date(createdAt.getTime() + countdownHours * 60 * 60 * 1000).toISOString();
}

function proposalIsExpired(proposal: Pick<SalesProposal, "responseDeadline" | "status">) {
  return proposal.status === "Abierta" && Boolean(proposal.responseDeadline) && new Date(proposal.responseDeadline).getTime() <= Date.now();
}

function normalizeStatus(proposal: SalesProposal): SalesProposalStatus {
  return proposalIsExpired(proposal) ? "Cerrada" : proposal.status || "Borrador";
}

const DEFAULT_PRICE_SCALES: SalesProposalPriceScale[] = [
  { minParticipants: 1, maxParticipants: 5, price: 45000 },
  { minParticipants: 6, maxParticipants: 10, price: 42000 },
  { minParticipants: 11, maxParticipants: 30, price: 39000 },
  { minParticipants: 31, maxParticipants: null, price: 37000 },
];

const token = () => Math.random().toString(36).slice(2, 10);
const money = (value: FormDataEntryValue | null) => Number(String(value || "0").replace(/[^0-9.-]/g, "")) || 0;
const count = (value: FormDataEntryValue | null) => Math.max(0, Math.round(money(value)));
const text = (value: FormDataEntryValue | null) => String(value || "").trim();

function responseParticipates(response: SalesProposalResponse) {
  return response.responseStatus === "Participa" || String(response.responseStatus) === "Aceptó";
}

function responseDoesNotParticipate(response: SalesProposalResponse) {
  return response.responseStatus === "No participa" || String(response.responseStatus) === "No aceptó";
}

function acceptedParticipantsCount(responses: SalesProposalResponse[]) {
  return responses.filter(responseParticipates).length;
}

function normalizePricingMode(value: FormDataEntryValue | string | null | undefined): SalesProposalPricingMode {
  return value === "manual" ? "manual" : "automatic";
}

function parsePriceScales(formData: FormData, fallbackPrice: number): SalesProposalPriceScale[] {
  const scales = Array.from({ length: 8 }, (_, index) => ({
    minParticipants: count(formData.get(`scale${index}Min`)),
    maxParticipants: text(formData.get(`scale${index}Max`)) ? count(formData.get(`scale${index}Max`)) : null,
    price: money(formData.get(`scale${index}Price`)),
  })).filter((scale) => scale.minParticipants > 0 && (scale.maxParticipants === null || scale.maxParticipants >= scale.minParticipants) && scale.price > 0);
  if (scales.length > 0) return scales.sort((a, b) => a.minParticipants - b.minParticipants);
  return fallbackPrice > 0 ? [{ minParticipants: 1, maxParticipants: null, price: fallbackPrice }] : DEFAULT_PRICE_SCALES;
}

function normalizePriceScales(proposal: Partial<SalesProposal>): SalesProposalPriceScale[] {
  const scales = (proposal.priceScales || []).map((scale) => ({ ...scale, maxParticipants: scale.maxParticipants ?? null })).filter((scale) => scale.minParticipants > 0 && (scale.maxParticipants === null || scale.maxParticipants >= scale.minParticipants) && scale.price > 0);
  if (scales.length > 0) return scales.sort((a, b) => a.minParticipants - b.minParticipants);
  const fallbackPrice = proposal.price || 0;
  return fallbackPrice > 0 ? [{ minParticipants: 1, maxParticipants: null, price: fallbackPrice }] : DEFAULT_PRICE_SCALES;
}


export function getFinalPriceForParticipants(scales: SalesProposalPriceScale[], participants: number) {
  const normalized = [...scales].sort((a, b) => a.minParticipants - b.minParticipants);
  const firstScale = normalized[0];
  if (!firstScale) return 0;
  if (participants < firstScale.minParticipants) return firstScale.price;
  return normalized.find((scale) => participants >= scale.minParticipants && (scale.maxParticipants === null || participants <= scale.maxParticipants))?.price || normalized.at(-1)?.price || 0;
}

function normalizeProposal(proposal: SalesProposal, responses: SalesProposalResponse[] = []): SalesProposal {
  const realAcceptedCount = acceptedParticipantsCount(responses);
  const pricingMode = normalizePricingMode(proposal.pricingMode);
  const pricingCount = pricingMode === "manual" ? Math.max(0, proposal.pricingParticipantsCount || realAcceptedCount) : realAcceptedCount;
  const priceScales = normalizePriceScales(proposal);
  const price = getFinalPriceForParticipants(priceScales, pricingCount) || proposal.price || 0;
  return {
    ...proposal,
    priceScales,
    price,
    countdownHours: proposal.countdownHours || 5,
    responseDeadline: proposal.responseDeadline || deadlineFromHours(proposal.countdownHours || 5, new Date(proposal.createdAt || Date.now())),
    status: normalizeStatus(proposal),
    acceptedParticipantsCount: realAcceptedCount,
    pricingMode,
    pricingParticipantsCount: pricingCount,
    pricingOverrideReason: proposal.pricingOverrideReason || "",
    pricingUpdatedAt: proposal.pricingUpdatedAt || proposal.createdAt,
    pricingUpdatedBy: proposal.pricingUpdatedBy || "Operador",
  };
}

function withSales(store: Awaited<ReturnType<typeof readStore>>): SalesStore {
  const raw = store as SalesStore;
  const responses = (raw.salesProposalResponses || []) as SalesProposalResponse[];
  const proposals = ((raw.salesProposals || []) as SalesProposal[]).map((proposal) => normalizeProposal(proposal, responses.filter((response) => response.proposalId === proposal.id)));
  return { ...store, salesProposals: proposals, salesProposalResponses: responses };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value || 0);
}

export async function getSalesDashboardData() {
  const store = withSales(await readStore());
  const hubs = await getHubs();
  const proposals = store.salesProposals!.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((proposal) => ({
    ...proposal,
    hub: hubs.find((hub) => hub.id === proposal.hubId) || null,
    responses: store.salesProposalResponses!.filter((response) => response.proposalId === proposal.id),
  }));
  return { hubs, clientes: store.clientes, proposals };
}

export async function getSalesProposalsByHub(hubId: string): Promise<Array<SalesProposal & { responses: SalesProposalResponse[] }>> {
  const store = withSales(await readStore());
  return store.salesProposals!.filter((proposal) => proposal.hubId === hubId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((proposal) => ({ ...proposal, responses: store.salesProposalResponses!.filter((response) => response.proposalId === proposal.id) }));
}

export async function getSalesProposalByToken(publicLink: string) {
  const store = withSales(await readStore());
  const proposal = store.salesProposals!.find((item) => item.publicLink === publicLink || item.id === publicLink) || null;
  if (!proposal) return null;
  const hubBase = store.hubs.find((item) => item.id === proposal.hubId) || null;
  const hub = hubBase ? { ...hubBase, clientesActivos: store.clientes.filter((cliente) => cliente.hubId === hubBase.id && cliente.estado === "activo").length } : null;
  const responses = store.salesProposalResponses!.filter((response) => response.proposalId === proposal.id);
  return { proposal: normalizeProposal(proposal, responses), hub, responses };
}

export function summarizeSalesProposal(proposal: SalesProposal, responses: SalesProposalResponse[], clientes: Cliente[] = []) {
  const accepted = responses.filter(responseParticipates);
  const rejected = responses.filter(responseDoesNotParticipate);
  const destinatarios = proposal.targetCustomerIds?.length ? clientes.filter((cliente) => proposal.targetCustomerIds?.includes(cliente.id)) : clientes.filter((cliente) => cliente.hubId === proposal.hubId && cliente.estado === "activo");
  const pendingCount = Math.max(0, (proposal.sentCount || destinatarios.length) - responses.length);
  const realAcceptedCount = accepted.length;
  const normalizedProposal = normalizeProposal(proposal, responses);
  const finalPrice = getFinalPriceForParticipants(normalizedProposal.priceScales, normalizedProposal.pricingParticipantsCount);
  const totalQuantity = accepted.reduce((sum, response) => sum + response.quantity, 0);
  const totalToCollect = accepted.reduce((sum, response) => sum + (response.quantity * finalPrice), 0);
  const respondedNames = new Set(responses.map((response) => response.customerName.trim().toLowerCase()).filter(Boolean));
  const pending = destinatarios.filter((cliente) => !respondedNames.has(cliente.nombre.trim().toLowerCase()));
  return { acceptedCount: realAcceptedCount, rejectedCount: rejected.length, pendingCount, totalQuantity, totalToCollect, acceptedParticipantsCount: realAcceptedCount, pricingParticipantsCount: normalizedProposal.pricingParticipantsCount, pricingMode: normalizedProposal.pricingMode, finalPrice, accepted, rejected, pending };
}

async function sendSalesProposalEmail(proposal: SalesProposal, clientes: Cliente[], hubUserCount: number) {
  const apiKey = process.env.RESEND_API_KEY;
  const destinatarios = clientes.map((cliente) => cliente.email).filter((email) => email.includes("@"));
  if (!apiKey || destinatarios.length === 0) return;
  const publicLink = `${BASE_URL}/propuestas/${proposal.publicLink}`;
  const scales = proposal.priceScales.map((scale) => `* Si participan ${scale.maxParticipants === null || scale.maxParticipants >= 999 ? `más de ${scale.minParticipants - 1} personas` : `de ${scale.minParticipants} a ${scale.maxParticipants} personas`}: ${formatCurrency(scale.price)}`).join("\n");
  const textBody = `Hola,\n\nHUBYA te acerca una propuesta para tu Hub.\n\nTu Hub tiene actualmente ${hubUserCount} usuarios registrados.\n\nEsta semana estamos organizando reparto de ${proposal.productName} a domicilio para el día ${proposal.deliveryDay}.\n\nProducto:\n${proposal.productName}\n\nLa propuesta cierra en:\n${proposal.countdownHours} horas\n\nLink de pago:\n${proposal.paymentLink}\n\nEscala de precio grupal:\n\n${scales}\n\nMientras más integrantes del Hub participen, mejor precio consigue el grupo.\n\nEl cobro se realiza por Mercado Pago. HUBYA registra tu participación y, al cerrar la oferta, calcula el precio final por escala. Si corresponde diferencia a favor, se informa en ficha física junto con la mercadería.\n\nPara responder:\n${publicLink}`;
  const respuesta = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: obtenerRemitenteResend(), reply_to: obtenerReplyToResend(), to: destinatarios, subject: `Propuesta HUBYA: ${proposal.productName.toLowerCase()} para este ${proposal.deliveryDay.toLowerCase()}`, text: textBody }) });
  if (!respuesta.ok) {
    const data = await respuesta.json().catch(() => ({}));
    console.error("No se pudo enviar email de propuesta comercial", mensajeErrorResend(data));
  }
}

export async function createSalesProposal(formData: FormData) {
  const store = withSales(await readStore());
  const hubId = text(formData.get("hubId"));
  const id = `sales-proposal-${Date.now()}`;
  const productName = text(formData.get("productName")) || "Huevos";
  const format = text(formData.get("format")) || "Media caja";
  const scales = parsePriceScales(formData, money(formData.get("price")));
  const countdownHours = hours(formData.get("countdownHours"));
  const createdAt = new Date();
  const proposal: SalesProposal = {
    id,
    branchId: "ventas",
    hubId,
    title: text(formData.get("title")) || `${format} de ${productName}`,
    productName,
    format,
    description: text(formData.get("description")),
    paymentLink: text(formData.get("paymentLink")) || DEFAULT_PAYMENT_LINK,
    priceScales: scales,
    price: getFinalPriceForParticipants(scales, 1),
    acceptedParticipantsCount: 0,
    pricingParticipantsCount: 0,
    pricingMode: "automatic",
    pricingOverrideReason: "",
    pricingUpdatedAt: new Date().toISOString(),
    pricingUpdatedBy: "Operador",
    deliveryDay: text(formData.get("deliveryDay")),
    deliveryMode: text(formData.get("deliveryMode")),
    notes: text(formData.get("notes")),
    responseDeadline: text(formData.get("responseDeadline")) || deadlineFromHours(countdownHours, createdAt),
    countdownHours,
    status: "Abierta",
    publicLink: token(),
    proposalGroupId: text(formData.get("proposalGroupId")) || id,
    createdAt: createdAt.toISOString(),
    targetCustomerIds: formData.getAll("targetCustomerIds").map((value) => text(value)).filter(Boolean),
  };
  store.salesProposals = [proposal, ...store.salesProposals!];
  await saveStore(store);
  const clientesDelHub = store.clientes.filter((cliente) => cliente.hubId === hubId && cliente.estado === "activo");
  const clientesSeleccionados = proposal.targetCustomerIds?.length ? clientesDelHub.filter((cliente) => proposal.targetCustomerIds?.includes(cliente.id)) : clientesDelHub;
  proposal.sentCount = clientesSeleccionados.length;
  store.salesProposals = store.salesProposals!.map((item) => item.id === proposal.id ? proposal : item);
  await saveStore(store);
  await sendSalesProposalEmail(proposal, clientesSeleccionados, clientesSeleccionados.length);
  revalidatePath(`/operativo/hubs/${hubId}/ventas`);
  revalidatePath(`/operativo?rama=ventas`);
  revalidatePath(`/operativo/ventas`);
}

export async function updateSalesProposalStatus(formData: FormData) {
  const store = withSales(await readStore());
  const proposalId = text(formData.get("proposalId"));
  const status = text(formData.get("status")) as SalesProposalStatus;
  let hubId = "";
  store.salesProposals = store.salesProposals!.map((proposal) => {
    if (proposal.id !== proposalId) return proposal;
    hubId = proposal.hubId;
    return { ...proposal, status, closedAt: status === "Cerrada" ? new Date().toISOString() : proposal.closedAt };
  });
  await saveStore(store);
  if (hubId) revalidatePath(`/operativo/hubs/${hubId}/ventas`);
  revalidatePath(`/operativo/ventas`);
}

export async function updateSalesProposalPricing(formData: FormData) {
  const store = withSales(await readStore());
  const proposalId = text(formData.get("proposalId"));
  const mode = normalizePricingMode(formData.get("pricingMode"));
  let hubId = "";
  const now = new Date().toISOString();
  store.salesProposals = store.salesProposals!.map((proposal) => {
    if (proposal.id !== proposalId) return proposal;
    const responses = store.salesProposalResponses!.filter((response) => response.proposalId === proposal.id);
    const realAcceptedCount = acceptedParticipantsCount(responses);
    const pricingCount = mode === "manual" ? count(formData.get("pricingParticipantsCount")) : realAcceptedCount;
    hubId = proposal.hubId;
    const price = getFinalPriceForParticipants(proposal.priceScales, pricingCount);
    return { ...proposal, acceptedParticipantsCount: realAcceptedCount, pricingMode: mode, pricingParticipantsCount: pricingCount, price, pricingOverrideReason: text(formData.get("pricingOverrideReason")), pricingUpdatedAt: now, pricingUpdatedBy: text(formData.get("pricingUpdatedBy")) || "Operador" };
  });
  await saveStore(store);
  if (hubId) revalidatePath(`/operativo/hubs/${hubId}/ventas`);
  revalidatePath(`/operativo/ventas`);
}

export async function respondSalesProposal(formData: FormData) {
  const store = withSales(await readStore());
  const proposalId = text(formData.get("proposalId"));
  const proposal = store.salesProposals!.find((item) => item.id === proposalId);
  if (!proposal || normalizeStatus(proposal) === "Cerrada") return;
  const responseStatus: SalesResponseStatus = text(formData.get("responseStatus")) === "Participa" ? "Participa" : "No participa";
  const quantity = responseStatus === "Participa" ? Math.max(1, money(formData.get("quantity")) || 1) : 0;
  const deliveryAvailability = responseStatus === "Participa" ? text(formData.get("deliveryAvailability")) : "";
  const response: SalesProposalResponse = {
    id: `sales-response-${Date.now()}-${token()}`,
    proposalId,
    targetHubId: proposal.hubId,
    userId: text(formData.get("userId")) || undefined,
    customerName: text(formData.get("customerName")) || "Integrante del Hub",
    phone: text(formData.get("phone")),
    address: text(formData.get("address")),
    responseStatus,
    quantity,
    deliveryAvailability: deliveryAvailability === "No voy a estar" ? "No voy a estar" : deliveryAvailability === "Sí, voy a estar" ? "Sí, voy a estar" : "",
    preferredDeliveryTime: responseStatus === "Participa" ? (text(formData.get("preferredDeliveryTime")) as SalesProposalResponse["preferredDeliveryTime"]) : "",
    deliveryPreference: responseStatus === "Participa" ? (text(formData.get("deliveryPreference")) as SalesProposalResponse["deliveryPreference"]) : "",
    deliveryNotes: text(formData.get("deliveryNotes")),
    respondedAt: new Date().toISOString(),
  };
  store.salesProposalResponses = [response, ...store.salesProposalResponses!];
  await saveStore(store);
  revalidatePath(`/propuestas/${proposal.publicLink}`);
  revalidatePath(`/operativo/hubs/${proposal.hubId}/ventas`);
  revalidatePath(`/operativo/ventas`);
}


export async function createGroupedSalesProposal(formData: FormData) {
  const store = withSales(await readStore());
  const selectedHubIds = formData.getAll("targetHubIds").map((value) => text(value)).filter(Boolean);
  if (selectedHubIds.length === 0) return;
  const groupId = `sales-group-${Date.now()}`;
  for (const hubId of selectedHubIds) {
    const next = new FormData();
    for (const [key, value] of formData.entries()) {
      if (key !== "targetHubIds" && key !== "targetCustomerIds") next.append(key, value);
    }
    next.set("hubId", hubId);
    for (const customerId of formData.getAll("targetCustomerIds")) {
      const cliente = store.clientes.find((item) => item.id === text(customerId));
      if (cliente?.hubId === hubId) next.append("targetCustomerIds", cliente.id);
    }
    next.set("proposalGroupId", groupId);
    await createSalesProposal(next);
  }
}
