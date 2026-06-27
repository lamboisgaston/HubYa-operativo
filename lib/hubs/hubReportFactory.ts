import { getHubCategoryConfig } from "./getHubCategoryConfig";

export function getHubReportDefinition(category?: string | null) {
  const config = getHubCategoryConfig(category);
  return {
    tipoReporte: config.tipoReporte,
    campos: config.camposEspecificos,
    camposEconomicos: config.camposEconomicos,
    estados: config.estados,
    procesosHabilitados: config.procesosHabilitados,
    textos: config.textos,
  };
}
