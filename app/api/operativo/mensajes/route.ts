import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { crearMensajeOperativoDesdeInput } from "@/lib/data/mensajes";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const origin = request.headers.get("origin") || new URL(request.url).origin;
  const result = await crearMensajeOperativoDesdeInput({ ...body, baseUrl: origin });
  revalidatePath("/operativo");
  revalidatePath("/operativo/mensajes");
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
