import { updateParameterResponse } from "@/lib/data/parameterResponses";

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const updated = await updateParameterResponse(String(body.respuestaId || ""), { status: body.status, internalNote: body.internalNote });
  if (!updated) return Response.json({ ok: false, message: "No se encontró la respuesta." }, { status: 404 });
  return Response.json({ ok: true, message: "Respuesta sobre parámetro actualizada.", response: updated });
}
