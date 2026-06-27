import { revalidatePath } from "next/cache";
import { readStore, saveStore, type Cliente } from "@/lib/data/hubs";

export type SalesProposalStatus = "Borrador" | "Enviada" | "Abierta" | "Cerrada" | "Confirmada" | "Entregada" | "Cancelada";
export type SalesResponseStatus = "Pendiente" | "Aceptó" | "No aceptó";

export type SalesProposal = {
  id: string;
  branchId: "ventas";
  hubId: string;
  title: string;
  productName: string;
  format: string;
  price: number;
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

const token = () => Math.random().toString(36).slice(2, 10);
const money = (value: FormDataEntryValue | null) => Number(String(value || "0").replace(/[^0-9.-]/g, "")) || 0;
const text = (value: FormDataEntryValue | null) => String(value || "").trim();

function withSales(store: Awaited<ReturnType<typeof readStore>>): SalesStore {
  const raw = store as SalesStore;
  return { ...store, salesProposals: (raw.salesProposals || []) as SalesProposal[], salesProposalResponses: (raw.salesProposalResponses || []) as SalesProposalResponse[] };
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
  const hub = store.hubs.find((item) => item.id === proposal.hubId) || null;
  const responses = store.salesProposalResponses!.filter((response) => response.proposalId === proposal.id);
  return { proposal, hub, responses };
}

export function summarizeSalesProposal(proposal: SalesProposal, responses: SalesProposalResponse[], clientes: Cliente[] = []) {
  const accepted = responses.filter((response) => response.responseStatus === "Aceptó");
  const rejected = responses.filter((response) => response.responseStatus === "No aceptó");
  const pendingCount = Math.max(0, clientes.filter((cliente) => cliente.hubId === proposal.hubId && cliente.estado === "activo").length - responses.length);
  const totalQuantity = accepted.reduce((sum, response) => sum + response.quantity, 0);
  const totalToCollect = accepted.reduce((sum, response) => sum + response.total, 0);
  const respondedNames = new Set(responses.map((response) => response.customerName.trim().toLowerCase()).filter(Boolean));
  const pending = clientes.filter((cliente) => cliente.hubId === proposal.hubId && cliente.estado === "activo" && !respondedNames.has(cliente.nombre.trim().toLowerCase()));
  return { acceptedCount: accepted.length, rejectedCount: rejected.length, pendingCount, totalQuantity, totalToCollect, accepted, rejected, pending };
}

export async function createSalesProposal(formData: FormData) {
  const store = withSales(await readStore());
  const hubId = text(formData.get("hubId"));
  const id = `sales-proposal-${Date.now()}`;
  const productName = text(formData.get("productName")) || "Huevos";
  const format = text(formData.get("format")) || "Media caja";
  const proposal: SalesProposal = {
    id,
    branchId: "ventas",
    hubId,
    title: text(formData.get("title")) || `${format} de ${productName}`,
    productName,
    format,
    price: money(formData.get("price")),
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
