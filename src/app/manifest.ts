import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OXO — Stake & Play",
    short_name: "OXO",
    description:
      "Onchain noughts & crosses on Celo. Stake a sliver of CELO, beat the bot, take the pot.",
    start_url: "/",
    display: "standalone",
    background_color: "#060609",
    theme_color: "#060609",
    orientation: "portrait",
    categories: ["games", "entertainment"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
