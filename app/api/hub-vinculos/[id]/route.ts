import { NextResponse } from "next/server";
import { deleteHubVinculo, updateHubVinculo } from "@/lib/data/hubVinculos";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const vinculo = await updateHubVinculo(id, body);
  return vinculo ? NextResponse.json({ ok: true, vinculo }) : NextResponse.json({ ok: false, error: "Vínculo no encontrado." }, { status: 404 });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = await deleteHubVinculo(id);
  return deleted ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false, error: "Vínculo no encontrado." }, { status: 404 });
}
