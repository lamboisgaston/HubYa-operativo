import { NextResponse } from "next/server"; import { getHubs } from "@/lib/data/hubs";
export async function GET() { return NextResponse.json(await getHubs()); }
