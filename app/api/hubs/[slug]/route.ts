export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getHubBySlug, updateHubInformacionImportante, updateHubOperativo, updateHubParametrosOperativos } from "@/lib/data/hubs";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const hub = await getHubBySlug((await params).slug);
  return hub ? NextResponse.json(hub) : NextResponse.json({ error: "Hub no encontrado" }, { status: 404 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  if (body?.informacionImportante) {
    const hub = await updateHubInformacionImportante(slug, body.informacionImportante);
    return hub ? NextResponse.json(hub) : NextResponse.json({ error: "Hub no encontrado" }, { status: 404 });
  }
  if (Array.isArray(body?.hubOperativo)) {
    const hub = await updateHubOperativo(slug, body.hubOperativo);
    return hub ? NextResponse.json(hub) : NextResponse.json({ error: "Hub no encontrado" }, { status: 404 });
  }
  if (body?.moduloOperativo || body?.parametrosOperativos || body?.nivelEstabilidad !== undefined) {
    const hub = await updateHubParametrosOperativos(slug, { moduloOperativo: body.moduloOperativo, parametrosOperativos: body.parametrosOperativos, nivelEstabilidad: body.nivelEstabilidad });
    return hub ? NextResponse.json(hub) : NextResponse.json({ error: "Hub no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ error: "No hay cambios válidos para guardar." }, { status: 400 });
}
