export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { deleteContacto, updateContacto } from "@/lib/data/hubs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const contacto = await updateContacto(id, body || {});
  if (!contacto) return NextResponse.json({ error: "Contacto no encontrado." }, { status: 404 });
  return NextResponse.json(contacto);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const contacto = await deleteContacto(id);
  if (!contacto) return NextResponse.json({ error: "Contacto no encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
