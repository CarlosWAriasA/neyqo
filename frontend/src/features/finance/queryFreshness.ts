export const financeQueryFreshness = {
  default: 5 * 60_000,
  highActivity: 2 * 60_000,
  reference: 10 * 60_000,
  preferences: 30 * 60_000,
  details: 5 * 60_000,
} as const;

export const financeQueryGcTime = 30 * 60_000;
