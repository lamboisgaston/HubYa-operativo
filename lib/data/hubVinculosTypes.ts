export type EstadoHubVinculo = "POSTULANTE" | "EVALUACION" | "ACTIVO" | "SUSPENDIDO" | "FINALIZADO";
export type TipoEquipoVinculo = "PRINCIPAL" | "SECUNDARIO";

export type HubVinculo = {
  id: string;
  hub_id: string;
  oferta_id: string;
  estado: EstadoHubVinculo;
  rol: string;
  fecha_inicio: string;
  fecha_fin: string;
  capacidad: string;
  observaciones: string;
  created_at: string;
  updated_at: string;
};

export type HubVinculoEquipo = {
  id: string;
  vinculo_id: string;
  persona_id: string;
  tipo_equipo: TipoEquipoVinculo;
};

export const HUB_VINCULOS_STORAGE_KEY = "hubya-hub-vinculos";
export const HUB_VINCULO_EQUIPOS_STORAGE_KEY = "hubya-hub-vinculo-equipos";
export const ESTADOS_HUB_VINCULO: EstadoHubVinculo[] = ["POSTULANTE", "EVALUACION", "ACTIVO", "SUSPENDIDO", "FINALIZADO"];
export const TIPOS_EQUIPO_VINCULO: TipoEquipoVinculo[] = ["PRINCIPAL", "SECUNDARIO"];
