"use server";

import { revalidatePath } from "next/cache";
import { actualizarRespuestaOperativa, cargarRespuestaManual, crearMensajeOperativo } from "@/lib/data/mensajes";

export async function crearMensajeAction(formData: FormData) {
  await crearMensajeOperativo(formData);
  revalidatePath("/operativo");
  revalidatePath("/operativo/mensajes");
}

export async function cargarRespuestaAction(formData: FormData) {
  await cargarRespuestaManual(formData);
  revalidatePath("/operativo/mensajes");
  const hubSlug = formData.get("hubSlug");
  if (typeof hubSlug === "string" && hubSlug) revalidatePath(`/operativo/hubs/${hubSlug}/mensajes`);
}

export async function actualizarRespuestaAction(formData: FormData) {
  await actualizarRespuestaOperativa(formData);
  revalidatePath("/operativo/mensajes");
  const hubSlug = formData.get("hubSlug");
  if (typeof hubSlug === "string" && hubSlug) revalidatePath(`/operativo/hubs/${hubSlug}/mensajes`);
}
