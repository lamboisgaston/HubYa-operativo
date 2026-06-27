"use server";

import { respondSalesProposal } from "@/lib/sales/proposals";

export async function respondSalesProposalAction(formData: FormData) {
  await respondSalesProposal(formData);
}
