import { NextResponse } from "next/server";
import { generateElIngenieroReply, type ElIngenieroConfig } from "@/lib/ai/elIngeniero";

type ElIngenieroChatBody = {
  message?: unknown;
  config?: ElIngenieroConfig;
  fromPhone?: unknown;
  source?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ElIngenieroChatBody;

  const result = await generateElIngenieroReply({
    message: typeof body.message === "string" ? body.message : "",
    config: body.config && typeof body.config === "object" ? body.config : undefined,
    fromPhone: typeof body.fromPhone === "string" ? body.fromPhone : undefined,
    source: typeof body.source === "string" ? body.source : "operativo",
  });

  return NextResponse.json(result);
}
