import type { Entry } from "./types";

/** Lowercase, strip Vietnamese diacritics (including đ) for matching. */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesQuery(e: Pick<Entry, "name" | "agency">, query: string): boolean {
  const q = normalize(query);
  if (!q) return false;
  return normalize(`${e.name} ${e.agency}`).includes(q);
}

/** Keeps the incoming order (the source already ranked the rows). */
export function filterByAgency<T extends Pick<Entry, "agency">>(rows: T[], agency: string): T[] {
  return agency ? rows.filter((r) => r.agency === agency) : rows;
}

export function listAgencies(rows: Pick<Entry, "agency">[]): string[] {
  return [...new Set(rows.map((r) => r.agency))].sort((a, b) => a.localeCompare(b, "vi"));
}

/** Stable identity for pinning: masked phone is unique enough within a name+agency. */
export function entryKey(e: Pick<Entry, "name" | "agency" | "phoneMasked">): string {
  return `${e.phoneMasked}|${normalize(e.name)}|${normalize(e.agency)}`;
}
