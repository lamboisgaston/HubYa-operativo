import { NextResponse } from "next/server";
import { getHubVinculos } from "@/lib/data/hubVinculos";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return NextResponse.json({ hub_id: slug, hub_vinculos: await getHubVinculos(decodeURIComponent(slug)) });
}
