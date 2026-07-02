export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createContacto, getContactos, getHubsOperativos } from "@/lib/data/hubs";

export async function GET() {
  return NextResponse.json(await getContactos());
}

function emailInvalido(email: string) {
  return Boolean(email.trim()) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!String(body?.nombre || "").trim()) return NextResponse.json({ error: "Nombre es obligatorio." }, { status: 400 });
  if (emailInvalido(String(body?.email || ""))) return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  const hubId = String(body?.hubId || "").trim();
  if (hubId) {
    const hubs = await getHubsOperativos();
    if (!hubs.some((hub) => hub.id === hubId)) return NextResponse.json({ error: "El Hub asociado no existe." }, { status: 400 });
  }
  const contacto = await createContacto({ ...(body || {}), hubId });
  return NextResponse.json(contacto, { status: 201 });
}
