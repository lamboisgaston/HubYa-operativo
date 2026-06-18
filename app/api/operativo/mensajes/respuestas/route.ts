import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { actualizarRespuestaOperativaDesdeInput, cargarRespuestaManualDesdeInput } from "@/lib/data/mensajes";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const result = await cargarRespuestaManualDesdeInput(body);
  revalidatePath("/operativo/mensajes");
  if (body.hubSlug) revalidatePath(`/operativo/hubs/${body.hubSlug}/mensajes`);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const result = await actualizarRespuestaOperativaDesdeInput(body);
  revalidatePath("/operativo/mensajes");
  if (body.hubSlug) revalidatePath(`/operativo/hubs/${body.hubSlug}/mensajes`);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
