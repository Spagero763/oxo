"use client";

import { createPublicClient, http, formatEther } from "viem";
import { celo } from "viem/chains";

export const celoClient = createPublicClient({
  chain: celo,
  transport: http("https://forno.celo.org"),
});

/** Reads a CELO balance and returns it as a float (for display). */
export async function celoBalance(address: `0x${string}`): Promise<number> {
  const wei = await celoClient.getBalance({ address });
  return Number(formatEther(wei));
}
