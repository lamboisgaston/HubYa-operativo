import { NextResponse } from "next/server";
import { deleteReporteHub, getReportesPorHub, readStore, upsertReporteHub, type ReporteHub } from "@/lib/data/hubs";

async function resolverHub(hubId: string) {
  const store = await readStore();
  return store.hubs.find((hub) => hub.id === hubId || hub.slug === hubId || hub.nombre === hubId) || null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ hubId: string }> }) {
  const { hubId } = await params;
  const hub = await resolverHub(hubId);
  if (!hub) return NextResponse.json({ error: "No se encontró este Hub. Volver a Operativo." }, { status: 404 });
  const reportes = await getReportesPorHub(hub.id);
  return NextResponse.json(reportes);
}

export async function POST(request: Request, { params }: { params: Promise<{ hubId: string }> }) {
  const { hubId } = await params;
  const body = (await request.json()) as ReporteHub;
  const reporte = await upsertReporteHub(hubId, body);
  if (!reporte) return NextResponse.json({ error: "No se encontró este Hub. Volver a Operativo." }, { status: 404 });
  return NextResponse.json(reporte);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ hubId: string }> }) {
  const { hubId } = await params;
  const { searchParams } = new URL(request.url);
  const reporteId = searchParams.get("id") || "";
  if (!reporteId) return NextResponse.json({ error: "Falta el id del reporte." }, { status: 400 });
  const eliminado = await deleteReporteHub(hubId, reporteId);
  if (!eliminado) return NextResponse.json({ error: "No se encontró este reporte." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
