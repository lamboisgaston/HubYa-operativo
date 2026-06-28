"use server";

import { revalidatePath } from "next/cache";
import {
  createGroupedSalesProposalData,
  createSalesProposalData,
  updateSalesProposalPricingData,
  updateSalesProposalStatusData,
} from "@/lib/sales/proposals-store";

function revalidateSalesPaths(hubId?: string) {
  if (hubId) revalidatePath(`/operativo/hubs/${hubId}/ventas`);
  revalidatePath("/operativo?rama=ventas");
  revalidatePath("/operativo/ventas");
}

export async function createSalesProposalAction(formData: FormData) {
  const result = await createSalesProposalData(formData);
  revalidateSalesPaths(result.hubId);
}

export async function createGroupedSalesProposalAction(formData: FormData) {
  const result = await createGroupedSalesProposalData(formData);
  for (const proposal of result?.proposals || []) {
    revalidateSalesPaths(proposal.hubId);
  }
  if (!result?.proposals?.length) revalidateSalesPaths();
}

export async function updateSalesProposalStatusAction(formData: FormData) {
  const result = await updateSalesProposalStatusData(formData);
  revalidateSalesPaths(result.hubId);
}

export async function updateSalesProposalPricingAction(formData: FormData) {
  const result = await updateSalesProposalPricingData(formData);
  revalidateSalesPaths(result.hubId);
}
