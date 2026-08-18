export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function displayName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}
