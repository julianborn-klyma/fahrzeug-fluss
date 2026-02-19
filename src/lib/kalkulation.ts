// Kalkulation calculation helpers

/** EK = material_cost + (hourly_rate * time_budget) */
export function calcEK(materialCost: number, hourlyRate: number, timeBudget: number): number {
  return materialCost + hourlyRate * timeBudget;
}

/** VK = EK * factor */
export function calcVKFromFactor(ek: number, factor: number): number {
  return ek * factor;
}

/** Factor = VK / EK (safe division) */
export function calcFactorFromVK(ek: number, vk: number): number {
  if (ek === 0) return 0;
  return vk / ek;
}

/** Format number as currency string */
export function fmtEur(value: number): string {
  return value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
