import { NextResponse } from "next/server";
import { createSolicitudHub, getSolicitudesHub, responderSolicitudHub } from "@/lib/data/solicitudes";

export async function GET() {
  return NextResponse.json(await getSolicitudesHub());
}

export async function POST(request: Request) {
  const body = await request.json();
  if (body.action === "approve") return NextResponse.json(await responderSolicitudHub(body.id, "aprobada"));
  if (body.action === "reject") return NextResponse.json(await responderSolicitudHub(body.id, "rechazada", body.mensajeOpcional));
  const required = ["nombre", "whatsapp", "email", "direccion", "hubSolicitadoId", "hubSolicitadoNombre", "servicio"];
  if (required.some((key) => !String(body[key] || "").trim())) return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  return NextResponse.json(await createSolicitudHub(body), { status: 201 });
}
