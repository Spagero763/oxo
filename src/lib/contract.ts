/* The deployed OXOArcade stake escrow on Celo Mainnet. The address is public,
   so it ships as a default and can still be overridden per environment. */

export const OXO_CONTRACT =
  process.env.NEXT_PUBLIC_OXO_CONTRACT ??
  "0xb85EcAF971cd07799B674a81FDC1D0b364B52B96";

export const OXO_CHAIN_ID = 42220; // Celo Mainnet
export const CELOSCAN = "https://celoscan.io";

export function contractUrl(addr: string = OXO_CONTRACT): string {
  return `${CELOSCAN}/address/${addr}`;
}

export function shortContract(addr: string = OXO_CONTRACT): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
