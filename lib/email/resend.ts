const REMITENTE_HUBYA = "HUBYA <noreply@hubya.tech>";
const REPLY_TO_HUBYA = "lamboisgaston@gmail.com";
const DOMINIO_RESEND_HUBYA = "hubya.tech";
const ERROR_DOMINIO_RESEND_HUBYA = "El dominio hubya.tech todavía no está verificado en Resend.";

export function obtenerRemitenteResend() {
  return process.env.RESEND_FROM_EMAIL || REMITENTE_HUBYA;
}

export function obtenerReplyToResend() {
  return process.env.RESEND_REPLY_TO || REPLY_TO_HUBYA;
}

export function esErrorDominioHubYaNoVerificado(mensaje: unknown) {
  if (typeof mensaje !== "string") return false;

  const texto = mensaje.toLowerCase();
  return texto.includes(DOMINIO_RESEND_HUBYA) && (texto.includes("verify") || texto.includes("verified") || texto.includes("verificado"));
}

export function mensajeErrorResend(data: unknown, fallback = "Resend rechazó el envío.") {
  const mensajeResend = data && typeof data === "object" && "message" in data ? (data as { message?: unknown }).message : undefined;
  const mensaje = typeof mensajeResend === "string" ? mensajeResend : fallback;

  return esErrorDominioHubYaNoVerificado(mensaje) ? ERROR_DOMINIO_RESEND_HUBYA : mensaje;
}
