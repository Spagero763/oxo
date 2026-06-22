/** Formats a CELO amount with just enough precision to stay readable. */
export function fmtCelo(amount: number): string {
  if (amount === 0) return "0";
  const abs = Math.abs(amount);
  if (abs >= 1) return amount.toFixed(2).replace(/\.00$/, "");
  if (abs >= 0.001) return amount.toFixed(4).replace(/0+$/, "");
  // tiny stakes like 0.000001 — show full significant digits, trim trailing zeros
  return amount.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

export function signed(amount: number): string {
  const s = fmtCelo(Math.abs(amount));
  return amount > 0 ? `+${s}` : amount < 0 ? `-${s}` : s;
}

export function shortAddr(addr?: string | null): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
