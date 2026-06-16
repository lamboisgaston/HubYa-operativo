import { NextResponse } from "next/server";
import { responderSolicitudHub, type DecisionSolicitudHub } from "@/lib/data/solicitudes";

function campoTexto(valor: unknown) {
  return typeof valor === "string" ? valor.trim() : "";
}

export async function POST(request: Request) {
  let body: { solicitudId?: unknown; decision?: unknown; mensajeOpcional?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "El cuerpo de la solicitud debe ser JSON válido." }, { status: 400 });
  }

  const solicitudId = campoTexto(body.solicitudId);
  const decision = campoTexto(body.decision) as DecisionSolicitudHub;
  const mensajeOpcional = campoTexto(body.mensajeOpcional);

  if (!solicitudId) return NextResponse.json({ ok: false, error: "Falta solicitudId." }, { status: 400 });
  if (decision !== "aprobada" && decision !== "rechazada") return NextResponse.json({ ok: false, error: "decision debe ser aprobada o rechazada." }, { status: 400 });

  const resultado = await responderSolicitudHub(solicitudId, decision, mensajeOpcional);
  if (!resultado) return NextResponse.json({ ok: false, error: "Solicitud no encontrada." }, { status: 404 });

  return NextResponse.json({ ok: true, ...resultado });
}
