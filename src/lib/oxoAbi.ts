/* Minimal ABI for the deployed OXOArcade escrow (see contracts/OXOArcade.sol). */
export const OXO_ABI = [
  {
    type: "function",
    name: "stake",
    stateMutability: "payable",
    inputs: [
      { name: "gameId", type: "bytes32" },
      { name: "mode", type: "uint8" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "settle",
    stateMutability: "nonpayable",
    inputs: [
      { name: "gameId", type: "bytes32" },
      { name: "outcome", type: "uint8" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "games",
    stateMutability: "view",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [
      { name: "player", type: "address" },
      { name: "stake", type: "uint128" },
      { name: "createdAt", type: "uint64" },
      { name: "mode", type: "uint8" },
      { name: "settled", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "houseBalance",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "minStake",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// outcome codes the contract expects
export const OUTCOME_CODE = { lose: 0, draw: 1, win: 2 } as const;
export const MODE_INDEX = { normal: 0, hard: 1 } as const;
