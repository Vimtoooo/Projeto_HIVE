import type { Viewer } from "../types/HomeTypes.ts";
import type { PublicUser } from "../types/ApiTypes.ts";
export const VIEWER_KEY = "hive:viewer";
const CHANGE = "hive:display-change";
const fallback = new Map<string, string>();
// Preferências de apresentação, nunca prova de autenticação. Não guardar senha/token.
export function readStored(key: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(key) ?? "";
  } catch {
    return fallback.get(key) ?? "";
  }
}
export function writeStored(key: string, value: string): void {
  fallback.set(key, value);
  try {
    if (value) window.sessionStorage.setItem(key, value);
    else window.sessionStorage.removeItem(key);
  } catch {
    /* Mantém apresentação em memória quando o storage está bloqueado. */
  }
  window.dispatchEvent(new Event(CHANGE));
}
export function subscribeViewer(callback: () => void): () => void {
  window.addEventListener(CHANGE, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE, callback);
    window.removeEventListener("storage", callback);
  };
}
export function parseViewer(raw: string): Viewer | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === "object" &&
      value !== null &&
      "id" in value &&
      typeof value.id === "number" &&
      Number.isInteger(value.id) &&
      value.id > 0 &&
      "name" in value &&
      typeof value.name === "string" &&
      value.name.trim()
    )
      return { id: value.id, name: value.name.trim() };
  } catch {
    /* Dados locais inválidos são ignorados. */
  }
  return null;
}
export function rememberViewer(user: PublicUser): void {
  writeStored(
    VIEWER_KEY,
    JSON.stringify({ id: user.idUsuario, name: user.nome }),
  );
}
export function favoriteKey(viewer: Viewer | null): string {
  return "hive:favorites:" + (viewer?.id ?? "guest");
}
export function parseFavorites(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (item: unknown): item is string => typeof item === "string",
            ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}
export function forgetViewer(): void {
  const viewer = parseViewer(readStored(VIEWER_KEY));
  writeStored(favoriteKey(viewer), "");
  writeStored(VIEWER_KEY, "");
}
