export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createContacto, getContactos } from "@/lib/data/hubs";

export async function GET() {
  return NextResponse.json(await getContactos());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const contacto = await createContacto(body || {});
  return NextResponse.json(contacto, { status: 201 });
}
