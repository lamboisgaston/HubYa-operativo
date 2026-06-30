"use client";

import { useState } from "react";

export function MembershipCheckoutButton() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error || "No se pudo iniciar la suscripción.");
      }

      window.location.href = data.url;
    } catch (checkoutError) {
      const message = checkoutError instanceof Error ? checkoutError.message : "No se pudo iniciar la suscripción.";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className="w-full rounded-2xl bg-violet-200 px-5 py-4 text-center text-sm font-black text-[#12071f] shadow-lg shadow-violet-950/30 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Abriendo Checkout..." : "Suscribirme"}
        <span className="block text-xs font-bold opacity-60">Checkout Stripe · membresía mensual</span>
      </button>
      {error ? <p className="mt-3 text-center text-sm font-bold text-red-200">{error}</p> : null}
    </div>
  );
}
