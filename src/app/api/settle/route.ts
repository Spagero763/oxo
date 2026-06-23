import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";
import { evaluate, type Cell } from "@/lib/engine";
import { OXO_ABI, OUTCOME_CODE, MODE_INDEX } from "@/lib/oxoAbi";
import { OXO_CONTRACT } from "@/lib/contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RPC = process.env.CELO_RPC ?? "https://forno.celo.org";

type Outcome = "win" | "lose" | "draw";

/** Server-side legality check: a board that can't be reached or whose claimed
 *  result doesn't match is rejected. Stakes are tiny, but this stops the
 *  obvious "claim a win from nothing" attempts. */
function boardIsConsistent(board: Cell[], outcome: Outcome): boolean {
  if (!Array.isArray(board) || board.length !== 9) return false;
  if (!board.every((c) => c === "X" || c === "O" || c === null)) return false;
  const x = board.filter((c) => c === "X").length;
  const o = board.filter((c) => c === "O").length;
  // human is X and moves first, so X is equal to or one ahead of O
  if (!(x === o || x === o + 1)) return false;
  const ev = evaluate(board);
  if (outcome === "win") return ev.winner === "X";
  if (outcome === "lose") return ev.winner === "O";
  return ev.winner === null && board.every((c) => c !== null);
}

export async function POST(req: NextRequest) {
  const key = process.env.RELAYER_PRIVATE_KEY;
  if (!key) {
    return NextResponse.json({ error: "On-chain settlement is not configured" }, { status: 503 });
  }

  let body: { gameId?: string; mode?: "normal" | "hard"; board?: Cell[]; outcome?: Outcome; player?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const { gameId, mode, board, outcome, player } = body;
  if (!gameId || !mode || !board || !outcome || !player) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!boardIsConsistent(board, outcome)) {
    return NextResponse.json({ error: "Board does not match the claimed result" }, { status: 400 });
  }

  try {
    const publicClient = createPublicClient({ chain: celo, transport: http(RPC) });

    // confirm the game exists on-chain, matches the player/mode, and is open
    const game = (await publicClient.readContract({
      address: OXO_CONTRACT as `0x${string}`,
      abi: OXO_ABI,
      functionName: "games",
      args: [gameId as `0x${string}`],
    })) as readonly [string, bigint, bigint, number, boolean];

    const [onchainPlayer, , , onchainMode, settled] = game;
    if (onchainPlayer === "0x0000000000000000000000000000000000000000") {
      return NextResponse.json({ error: "Game not found on-chain" }, { status: 404 });
    }
    if (onchainPlayer.toLowerCase() !== player.toLowerCase()) {
      return NextResponse.json({ error: "Player mismatch" }, { status: 403 });
    }
    if (settled) {
      return NextResponse.json({ error: "Already settled" }, { status: 409 });
    }
    if (onchainMode !== MODE_INDEX[mode]) {
      return NextResponse.json({ error: "Mode mismatch" }, { status: 400 });
    }

    const account = privateKeyToAccount((key.startsWith("0x") ? key : `0x${key}`) as `0x${string}`);
    const wallet = createWalletClient({ account, chain: celo, transport: http(RPC) });

    const txHash = await wallet.writeContract({
      address: OXO_CONTRACT as `0x${string}`,
      abi: OXO_ABI,
      functionName: "settle",
      args: [gameId as `0x${string}`, OUTCOME_CODE[outcome]],
    });

    return NextResponse.json({ txHash });
  } catch (e: unknown) {
    const msg = (e as { shortMessage?: string; message?: string })?.shortMessage ?? (e as Error)?.message ?? "Settlement failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
