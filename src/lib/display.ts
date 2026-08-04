// Helpers de exibição — garantem que nenhum card mostre campos vazios,
// "00:00", ", PR -" ou "--".
export const NOT_INFORMED = "Não informado";

const EMPTY_TOKENS = new Set(["", "-", "--", "—", "–", "n/a", "na", "null", "undefined", "00:00"]);

export function isEmptyValue(value?: string | null): boolean {
  if (value === null || value === undefined) return true;
  return EMPTY_TOKENS.has(value.trim().toLowerCase());
}

/** Devolve o valor ou "Não informado". */
export function displayValue(value?: string | null, fallback = NOT_INFORMED): string {
  return isEmptyValue(value) ? fallback : value!.trim().replace(/\s{2,}/g, " ");
}

/** Horário: nunca exibe 00:00 vazio. */
export function displayTime(value?: string | null): string {
  if (isEmptyValue(value)) return "A definir";
  return value!.trim();
}

/** "Estádio · Cidade/UF" ignorando partes desconhecidas. */
export function displayVenue(stadium?: string | null, city?: string | null, state?: string | null): string {
  const parts: string[] = [];
  if (!isEmptyValue(stadium) && stadium !== NOT_INFORMED) parts.push(stadium!.trim());

  const cityOk = !isEmptyValue(city) && city !== NOT_INFORMED;
  const stateOk = !isEmptyValue(state) && state !== NOT_INFORMED;
  if (cityOk && stateOk) parts.push(`${city!.trim()}/${state!.trim()}`);
  else if (cityOk) parts.push(city!.trim());
  else if (stateOk) parts.push(state!.trim());

  return parts.length > 0 ? parts.join(" · ") : `Local ${NOT_INFORMED.toLowerCase()}`;
}

/** Distância só é exibida quando conhecida. */
export function displayDistance(km?: number | null): string | null {
  if (km == null || Number.isNaN(km) || km <= 0) return null;
  return `${Math.round(km)} km`;
}
