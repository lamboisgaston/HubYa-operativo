import { NextResponse } from "next/server";
import { createHubVinculo, getHubVinculos } from "@/lib/data/hubVinculos";

export async function GET() {
  return NextResponse.json({ hub_vinculos: await getHubVinculos() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  try {
    const vinculo = await createHubVinculo(body);
    return NextResponse.json({ ok: true, vinculo }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "No se pudo crear el vínculo." }, { status: 400 });
  }
}
