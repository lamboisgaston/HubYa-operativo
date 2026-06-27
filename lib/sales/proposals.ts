import { revalidatePath } from "next/cache";
import { readStore, saveStore, type Cliente } from "@/lib/data/hubs";

export type SalesProposalStatus = "Borrador" | "Enviada" | "Abierta" | "Cerrada" | "Confirmada" | "Entregada" | "Cancelada";
export type SalesResponseStatus = "Pendiente" | "Aceptó" | "No aceptó";
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
  title: string;
  productName: string;
  format: string;
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
  status: SalesProposalStatus;
  publicLink: string;
  createdAt: string;
};

export type SalesProposalResponse = {
  id: string;
  proposalId: string;
  userId?: string;
  customerName: string;
  phone: string;
  address: string;
  responseStatus: SalesResponseStatus;
  quantity: number;
  total: number;
  notes: string;
  respondedAt: string;
};

type SalesStore = Omit<Awaited<ReturnType<typeof readStore>>, "salesProposals" | "salesProposalResponses"> & {
  salesProposals?: SalesProposal[];
  salesProposalResponses?: SalesProposalResponse[];
};

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

function acceptedParticipantsCount(responses: SalesProposalResponse[]) {
  return responses.filter((response) => response.responseStatus === "Aceptó").length;
}

function normalizePricingMode(value: FormDataEntryValue | string | null | undefined): SalesProposalPricingMode {
  return value === "manual" ? "manual" : "automatic";
}

function parsePriceScales(formData: FormData, fallbackPrice: number): SalesProposalPriceScale[] {
  const scales = [0, 1, 2, 3].map((index) => ({
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
  const accepted = responses.filter((response) => response.responseStatus === "Aceptó");
  const rejected = responses.filter((response) => response.responseStatus === "No aceptó");
  const pendingCount = Math.max(0, clientes.filter((cliente) => cliente.hubId === proposal.hubId && cliente.estado === "activo").length - responses.length);
  const realAcceptedCount = accepted.length;
  const normalizedProposal = normalizeProposal(proposal, responses);
  const finalPrice = getFinalPriceForParticipants(normalizedProposal.priceScales, normalizedProposal.pricingParticipantsCount);
  const totalQuantity = accepted.reduce((sum, response) => sum + response.quantity, 0);
  const totalToCollect = accepted.reduce((sum, response) => sum + (response.quantity * finalPrice), 0);
  const respondedNames = new Set(responses.map((response) => response.customerName.trim().toLowerCase()).filter(Boolean));
  const pending = clientes.filter((cliente) => cliente.hubId === proposal.hubId && cliente.estado === "activo" && !respondedNames.has(cliente.nombre.trim().toLowerCase()));
  return { acceptedCount: realAcceptedCount, rejectedCount: rejected.length, pendingCount, totalQuantity, totalToCollect, acceptedParticipantsCount: realAcceptedCount, pricingParticipantsCount: normalizedProposal.pricingParticipantsCount, pricingMode: normalizedProposal.pricingMode, finalPrice, accepted, rejected, pending };
}

export async function createSalesProposal(formData: FormData) {
  const store = withSales(await readStore());
  const hubId = text(formData.get("hubId"));
  const id = `sales-proposal-${Date.now()}`;
  const productName = text(formData.get("productName")) || "Huevos";
  const format = text(formData.get("format")) || "Media caja";
  const scales = parsePriceScales(formData, money(formData.get("price")));
  const proposal: SalesProposal = {
    id,
    branchId: "ventas",
    hubId,
    title: text(formData.get("title")) || `${format} de ${productName}`,
    productName,
    format,
    priceScales: scales,
    price: getFinalPriceForParticipants(scales, 0),
    acceptedParticipantsCount: 0,
    pricingParticipantsCount: 0,
    pricingMode: "automatic",
    pricingOverrideReason: "",
    pricingUpdatedAt: new Date().toISOString(),
    pricingUpdatedBy: "Operador",
    deliveryDay: text(formData.get("deliveryDay")),
    deliveryMode: text(formData.get("deliveryMode")),
    notes: text(formData.get("notes")),
    responseDeadline: text(formData.get("responseDeadline")),
    status: "Abierta",
    publicLink: token(),
    createdAt: new Date().toISOString(),
  };
  store.salesProposals = [proposal, ...store.salesProposals!];
  await saveStore(store);
  revalidatePath(`/operativo/hubs/${hubId}/ventas`);
  revalidatePath(`/operativo?rama=ventas`);
}

export async function updateSalesProposalStatus(formData: FormData) {
  const store = withSales(await readStore());
  const proposalId = text(formData.get("proposalId"));
  const status = text(formData.get("status")) as SalesProposalStatus;
  let hubId = "";
  store.salesProposals = store.salesProposals!.map((proposal) => {
    if (proposal.id !== proposalId) return proposal;
    hubId = proposal.hubId;
    return { ...proposal, status };
  });
  await saveStore(store);
  if (hubId) revalidatePath(`/operativo/hubs/${hubId}/ventas`);
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
}

export async function respondSalesProposal(formData: FormData) {
  const store = withSales(await readStore());
  const proposalId = text(formData.get("proposalId"));
  const proposal = store.salesProposals!.find((item) => item.id === proposalId);
  if (!proposal) return;
  const responseStatus = text(formData.get("responseStatus")) === "Aceptó" ? "Aceptó" : "No aceptó";
  const quantity = responseStatus === "Aceptó" ? Math.max(1, money(formData.get("quantity"))) : 0;
  const response: SalesProposalResponse = {
    id: `sales-response-${Date.now()}-${token()}`,
    proposalId,
    customerName: text(formData.get("customerName")) || "Integrante del Hub",
    phone: text(formData.get("phone")),
    address: text(formData.get("address")),
    responseStatus,
    quantity,
    total: quantity * proposal.price,
    notes: text(formData.get("notes")),
    respondedAt: new Date().toISOString(),
  };
  store.salesProposalResponses = [response, ...store.salesProposalResponses!];
  await saveStore(store);
  revalidatePath(`/propuestas/${proposal.publicLink}`);
  revalidatePath(`/operativo/hubs/${proposal.hubId}/ventas`);
}
