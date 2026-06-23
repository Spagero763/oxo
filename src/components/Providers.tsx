"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { celo } from "viem/chains";

const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "cmqpvuppd001g0dl4txk3mmu5";

/* Privy auth + embedded wallet, scoped to Celo. Wrapping happens here (client)
   so the server layout stays a server component. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={APP_ID}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#7c5cff",
          logo: "https://oxo-iota.vercel.app/icon.svg",
          showWalletLoginFirst: false,
        },
        embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" } },
        defaultChain: celo,
        supportedChains: [celo],
        loginMethods: ["email", "wallet"],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
