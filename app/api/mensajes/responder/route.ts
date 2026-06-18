import { NextResponse } from "next/server";
import { registrarRespuestaPorToken } from "@/lib/data/mensajes";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const result = await registrarRespuestaPorToken(token);
  return NextResponse.json(result, { status: result.ok ? 200 : 404 });
}
