import { leerConsultasPersistidas, upsertConsultaPersistida, type ConsultaHubPersistida } from "@/lib/consultasStore";

export async function GET() {
  return Response.json({ consultas: await leerConsultasPersistidas() });
}

export async function POST(request: Request) {
  let payload: { consulta?: ConsultaHubPersistida };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "El cuerpo debe ser JSON válido." }, { status: 400 });
  }

  if (!payload.consulta?.id || !payload.consulta?.hub) return Response.json({ error: "Faltan datos de encuesta." }, { status: 400 });
  const consulta = await upsertConsultaPersistida(payload.consulta);
  return Response.json({ ok: true, consulta });
}
