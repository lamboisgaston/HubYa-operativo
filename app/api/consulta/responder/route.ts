import { registrarRespuestaConsulta } from "@/lib/consultasStore";

function htmlGracias(respuesta: string) {
  return new Response(`<!doctype html><html lang="es"><body style="margin:0;background:#eef2e8;color:#182018;font-family:Arial,Helvetica,sans-serif;"><main style="min-height:100vh;display:grid;place-items:center;padding:24px;"><section style="max-width:520px;border:1px solid #b7d6ba;background:#fff;border-radius:20px;padding:28px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.08);"><p style="margin:0 0 8px;font-size:11px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;color:#66745c;">HubYa</p><h1 style="margin:0 0 10px;font-size:28px;">Gracias. Tu respuesta fue registrada.</h1><p style="margin:0;color:#66745c;font-weight:700;">Tu respuesta fue: ${respuesta}.</p></section></main></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function responder(request: Request) {
  const url = new URL(request.url);
  let token = url.searchParams.get("token") || "";
  let respuesta = url.searchParams.get("respuesta") || "";

  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    token = token || (typeof body.token === "string" ? body.token : "");
    respuesta = respuesta || (typeof body.respuesta === "string" ? body.respuesta : "");
  }

  if (!token || !respuesta) return Response.json({ error: "Faltan token o respuesta." }, { status: 400 });
  const registrada = await registrarRespuestaConsulta(token, respuesta);
  if (!registrada) return Response.json({ error: "Consulta o cliente no encontrado para el token." }, { status: 404 });

  const aceptaHtml = request.headers.get("accept")?.includes("text/html");
  if (request.method === "GET" && aceptaHtml) return htmlGracias(registrada.opcion);
  return Response.json({ ok: true, hub: registrada.consulta.hub, consultaId: registrada.consulta.id, clienteId: registrada.cliente.id, respuesta: registrada.opcion, respondidoEn: registrada.respondidoEn });
}

export async function GET(request: Request) {
  return responder(request);
}

export async function POST(request: Request) {
  return responder(request);
}
