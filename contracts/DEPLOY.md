# Deploy OXOArcade to Celo Mainnet (Foundry, keystore + Etherscan verify)

Run everything from the `contracts/` folder in your terminal.

## 0. One-time setup

Install Foundry (Git Bash on Windows):

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

You need:
- A Celo wallet with a little CELO for gas + house funding.
- An Etherscan API key from https://etherscan.io/myapikey (Etherscan API v2
  verifies Celo with the same key).

## 1. Import your deployer key as an encrypted keystore (no raw key on disk)

```bash
cast wallet import oxo-deployer --interactive
# paste your private key, then set a password.
```

This stores an encrypted keystore as `oxo-deployer` in `~/.foundry/keystores`.

## 2. Set your Etherscan API key for this shell

```bash
export ETHERSCAN_API_KEY=your_etherscan_api_key
```

## 3. Compile

```bash
forge build
```

## 4. Deploy + verify (Celo Mainnet, chainId 42220)

The constructor takes the relayer address. Pass the zero address to make the
deployer the relayer (you can change it later with `setRelayer`).

```bash
forge create OXOArcade.sol:OXOArcade \
  --rpc-url https://forno.celo.org \
  --account oxo-deployer \
  --broadcast \
  --constructor-args 0x0000000000000000000000000000000000000000 \
  --verify \
  --verifier etherscan \
  --etherscan-api-key "$ETHERSCAN_API_KEY" \
  --chain 42220
```

Foundry will ask for your keystore password, deploy, then verify on Celoscan.
Copy the **Deployed to:** address — that is your contract address.

## 5. Fund the house so it can pay winnings

```bash
# send e.g. 0.01 CELO into the house pool
cast send <CONTRACT_ADDRESS> "fundHouse()" \
  --value 0.01ether \
  --rpc-url https://forno.celo.org \
  --account oxo-deployer
```

## 6. Wire it into the app

Add to the app's environment (e.g. `.env.local` and Vercel):

```
NEXT_PUBLIC_OXO_CONTRACT=0xYourDeployedAddress
```

Then `payStake` in `src/lib/wallet.ts` can send the real on-chain stake.
