import type { Professional, Profession, SortMode } from "../types/HomeTypes.ts";
export const normalizeSearch = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
export function filterProfessionals(
  items: readonly Professional[],
  query: string,
  category: Profession | null,
  favorites?: readonly string[],
): Professional[] {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return items.filter(
    (item) =>
      (!category || item.profession === category) &&
      (!favorites || favorites.includes(item.id)) &&
      terms.every((term) =>
        normalizeSearch(
          [item.name, item.profession, item.specialty, item.description].join(
            " ",
          ),
        ).includes(term),
      ),
  );
}
export function sortProfessionals(
  items: readonly Professional[],
  mode: SortMode,
): Professional[] {
  return [...items].sort((a, b) =>
    mode === "nearby"
      ? a.distance - b.distance
      : mode === "rating"
        ? b.rating - a.rating || b.reviews - a.reviews
        : b.jobs - a.jobs,
  );
}
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "visitante";
}
export function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toLocaleUpperCase("pt-BR") || "V"
  );
}
export const money = (value: number): string =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
