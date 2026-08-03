/**
 * Módulo: settings
 *
 * Responsabilidad: configuración de la instalación y de la bodega.
 * - Nombre de la bodega
 * - Zona horaria (predeterminada: America/Lima)
 * - Moneda (predeterminada: PEN)
 * - Configuración de QR y tickets
 * - Recordatorios y preferencias de UI
 *
 * @module settings
 */

export const SETTINGS_MODULE = "settings" as const;

export type SettingsModuleId = typeof SETTINGS_MODULE;

export { LocalStorageStatusCard } from "./ui/components/local-storage-status-card";
