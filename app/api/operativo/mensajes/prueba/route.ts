import { NextResponse } from "next/server";
import { enviarPruebaMensajeDesdeInput } from "@/lib/data/mensajes";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const origin = request.headers.get("origin") || new URL(request.url).origin;
  const result = await enviarPruebaMensajeDesdeInput({ ...body, baseUrl: origin });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
