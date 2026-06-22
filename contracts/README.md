# OXOArcade contract

`OXOArcade.sol` is the stake escrow for OXO. It holds a player's CELO stake for
a single-player game against the off-chain bot, then pays out based on the
result reported by a trusted `relayer`:

- **Win** — player receives `stake * payout` (Normal 2x, Hard 3x). The extra
  comes from the house pool.
- **Draw** — stake refunded.
- **Loss** — stake forfeited to the house pool.
- **Stuck game** — if the relayer never settles, the player can call
  `claimStaleRefund` after 1 hour and get their stake back. Funds are never
  frozen.

The contract is self-contained (no imports), so it deploys in Remix with no
build setup.

## Deploy with Remix (fastest, ~2 minutes)

1. Open https://remix.ethereum.org
2. Create a file `OXOArcade.sol` and paste in this contract.
3. **Compile** tab: select compiler `0.8.20+`, click *Compile*.
4. In your wallet (MetaMask / Valora / MiniPay), select the Celo network:
   - **Celo Mainnet** — chainId `42220`, RPC `https://forno.celo.org`, explorer `https://celoscan.io`
   - or a Celo testnet for a free trial run.
5. **Deploy** tab: set Environment to *Injected Provider* (your wallet).
6. In the constructor field, pass the `_relayer` address (the wallet your backend
   will use to settle games). Passing `0x0000000000000000000000000000000000000000`
   makes the deployer the relayer.
7. Click **Deploy** and confirm in your wallet.
8. Copy the deployed contract address — that is the address to submit.

## After deploy

- Call `fundHouse()` with some CELO so the contract can pay winnings
  (it must hold at least `stake * (payout - 1)` per concurrent open game).
- Put the address in the app env as `NEXT_PUBLIC_OXO_CONTRACT` to wire the
  on-chain stake (see `src/lib/wallet.ts` -> `payStake`).

## Deploy with a script (optional)

If you prefer CLI, drop a funded deployer key into `contracts/.env`
(see `.env.example`) and use Hardhat or Foundry against the Celo RPC above.
Never commit the `.env`.
