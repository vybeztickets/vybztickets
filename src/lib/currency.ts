export function formatPrice(n: number, currency: string = "CRC"): string {
  if (n === 0) return currency === "USD" ? "$0.00" : "₡0";
  if (currency === "USD") {
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (n >= 1_000_000) return "₡" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "₡" + (n / 1_000).toFixed(0) + "K";
  return "₡" + n.toLocaleString("es-CR");
}

export function currencySymbol(currency: string): string {
  return currency === "USD" ? "$" : "₡";
}

export function currencyLabel(currency: string): string {
  return currency === "USD" ? "$ Dólar (USD)" : "₡ Colón (CRC)";
}
