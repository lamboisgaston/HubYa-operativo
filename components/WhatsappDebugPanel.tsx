"use client";

import { FormEvent, useState } from "react";

type NormalizeResult = {
  normalized: unknown;
  hasMessage: boolean;
  fromPhone: string | null;
  messageText: string | null;
  messageId: string | null;
  timestamp: string | null;
  source: string | null;
};

type SendResult = {
  ok: boolean;
  status?: number;
  skipped?: boolean;
  messageId?: string | null;
  error?: string;
};

export function WhatsappDebugPanel() {
  const [payload, setPayload] = useState("");
  const [normalizeResult, setNormalizeResult] = useState<NormalizeResult | null>(null);
  const [normalizeError, setNormalizeError] = useState<string | null>(null);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("Prueba HUBYA WhatsApp");
  const [debugSecret, setDebugSecret] = useState("");
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function handleNormalize(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsNormalizing(true);
    setNormalizeError(null);
    setNormalizeResult(null);

    try {
      const parsedPayload = JSON.parse(payload);
      const response = await fetch("/api/whatsapp/debug-normalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedPayload),
      });
      const data = (await response.json()) as NormalizeResult;
      if (!response.ok) throw new Error("No se pudo normalizar el payload.");
      setNormalizeResult(data);
    } catch (err) {
      setNormalizeError(err instanceof SyntaxError ? "El payload no es JSON válido." : err instanceof Error ? err.message : "No se pudo normalizar el payload.");
    } finally {
      setIsNormalizing(false);
    }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    setSendError(null);
    setSendResult(null);

    try {
      const response = await fetch("/api/whatsapp/debug-send", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-debug-secret": debugSecret },
        body: JSON.stringify({ to, message }),
      });
      const data = (await response.json()) as SendResult;
      if (!response.ok) throw new Error(data.error || "No se pudo enviar el mensaje de prueba.");
      setSendResult(data);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "No se pudo enviar el mensaje de prueba.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-[#DDE7E2] bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1E8F4D]">Diagnóstico WhatsApp</p>
      <h2 className="mt-2 text-2xl font-black">Webhook y envío de prueba</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#53685C]">
        Pegá un payload de Meta para confirmar si HUBYA detecta teléfono, texto e ID del mensaje. Para probar envíos, ingresá manualmente el secreto interno configurado como WHATSAPP_DEBUG_SECRET.
      </p>

      <form onSubmit={handleNormalize} className="mt-5 grid gap-3">
        <label className="grid gap-2">
          <span className="text-sm font-black text-[#0B1726]">Payload de Meta</span>
          <textarea
            value={payload}
            rows={8}
            onChange={(event) => setPayload(event.target.value)}
            className="w-full rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] px-4 py-3 font-mono text-xs font-semibold leading-6 outline-none transition focus:border-[#1E8F4D] focus:bg-white"
            placeholder='{"object":"whatsapp_business_account","entry":[...]}'
          />
        </label>
        <button type="submit" disabled={isNormalizing || !payload.trim()} className="rounded-2xl bg-[#0B1726] px-5 py-4 text-sm font-black text-white transition hover:bg-[#16283F] disabled:cursor-not-allowed disabled:opacity-60">
          {isNormalizing ? "Normalizando..." : "Normalizar payload"}
        </button>
        {normalizeError && <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{normalizeError}</p>}
        {normalizeResult && <pre className="overflow-auto rounded-2xl bg-[#0B1726] p-4 text-xs font-semibold text-white">{JSON.stringify(normalizeResult, null, 2)}</pre>}
      </form>

      <form onSubmit={handleSend} className="mt-6 grid gap-3 border-t border-[#DDE7E2] pt-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-black text-[#0B1726]">Teléfono destino</span>
            <input value={to} onChange={(event) => setTo(event.target.value)} className="rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#1E8F4D] focus:bg-white" placeholder="549..." />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-black text-[#0B1726]">Debug secret</span>
            <input type="password" value={debugSecret} onChange={(event) => setDebugSecret(event.target.value)} className="rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#1E8F4D] focus:bg-white" placeholder="WHATSAPP_DEBUG_SECRET" />
          </label>
        </div>
        <label className="grid gap-2">
          <span className="text-sm font-black text-[#0B1726]">Mensaje</span>
          <textarea value={message} rows={3} onChange={(event) => setMessage(event.target.value)} className="w-full rounded-2xl border border-[#DDE7E2] bg-[#F8FAF7] px-4 py-3 text-sm font-semibold leading-6 outline-none transition focus:border-[#1E8F4D] focus:bg-white" />
        </label>
        <button type="submit" disabled={isSending || !debugSecret.trim() || !to.trim() || !message.trim()} className="rounded-2xl bg-[#1E8F4D] px-5 py-4 text-sm font-black text-white transition hover:bg-[#166D3B] disabled:cursor-not-allowed disabled:opacity-60">
          {isSending ? "Enviando..." : "Enviar mensaje de prueba"}
        </button>
        {sendError && <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{sendError}</p>}
        {sendResult && <pre className="overflow-auto rounded-2xl bg-[#0B1726] p-4 text-xs font-semibold text-white">{JSON.stringify(sendResult, null, 2)}</pre>}
      </form>
    </section>
  );
}
