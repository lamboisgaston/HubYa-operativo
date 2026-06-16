import { NextResponse } from "next/server"; import { getHubBySlug } from "@/lib/data/hubs";
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) { const hub = await getHubBySlug((await params).slug); return hub ? NextResponse.json(hub) : NextResponse.json({ error: "Hub no encontrado" }, { status: 404 }); }
