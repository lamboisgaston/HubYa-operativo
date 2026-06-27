"use server";

import { createSalesProposal, updateSalesProposalStatus } from "@/lib/sales/proposals";

export async function createSalesProposalAction(formData: FormData) {
  await createSalesProposal(formData);
}

export async function updateSalesProposalStatusAction(formData: FormData) {
  await updateSalesProposalStatus(formData);
}
