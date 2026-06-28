"use server";

import { revalidatePath } from "next/cache";
import { addSalesProposalResponseData } from "@/lib/sales/proposals-store";

export async function respondSalesProposalAction(formData: FormData) {
  const result = await addSalesProposalResponseData(formData);
  if (!result) return;
  revalidatePath(`/propuestas/${result.publicLink}`);
  revalidatePath(`/operativo/hubs/${result.hubId}/ventas`);
  revalidatePath("/operativo/ventas");
}
