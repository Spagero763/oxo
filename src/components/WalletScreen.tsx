"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Check, RefreshCw, ArrowUpRight, LogOut, ExternalLink, Loader2 } from "lucide-react";
import { usePrivy, useWallets, useSendTransaction } from "@privy-io/react-auth";
import { isAddress, parseEther } from "viem";
import { celoBalance } from "@/lib/celo";
import { fmtCelo, shortAddr } from "@/lib/format";
import { CELOSCAN } from "@/lib/contract";
import { play } from "@/lib/sfx";
import { cn } from "@/lib/cn";

export function WalletScreen({ onHome }: { onHome: () => void }) {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
  const address = wallets[0]?.address as `0x${string}` | undefined;

  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBal, setLoadingBal] = useState(false);
  const [copied, setCopied] = useState(false);

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoadingBal(true);
    try {
      setBalance(await celoBalance(address));
    } catch {
      setBalance(null);
    } finally {
      setLoadingBal(false);
    }
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const copy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    play("tap");
    setTimeout(() => setCopied(false), 1600);
  };

  const send = async () => {
    setErr(null);
    setTxHash(null);
    if (!isAddress(to)) {
      setErr("Enter a valid 0x address");
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setErr("Enter an amount greater than 0");
      return;
    }
    if (balance !== null && amt > balance) {
      setErr("Amount exceeds your balance");
      return;
    }
    setSending(true);
    try {
      const res = (await sendTransaction({
        to: to as `0x${string}`,
        value: parseEther(amount),
        chainId: 42220,
      })) as unknown;
      // Privy versions differ on the return shape — accept any of them.
      const hash =
        (res as { hash?: string })?.hash ??
        (res as { transactionHash?: string })?.transactionHash ??
        (typeof res === "string" ? res : null);
      setTxHash(hash);
      play("coin");
      setAmount("");
      setTo("");
      setTimeout(refresh, 3000);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? "Transaction failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex w-full max-w-md flex-col">
      <div className="flex items-center justify-between">
        <button
          onClick={onHome}
          className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-sm text-ink-dim transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Lobby
        </button>
        <span className="rounded-full glass px-3 py-1.5 text-xs font-semibold text-teal-bright">Wallet</span>
      </div>

      {!authenticated || !address ? (
        <div className="mt-10 flex flex-col items-center text-center">
          <h1 className="font-display text-3xl font-bold text-ink">Your CELO wallet</h1>
          <p className="mt-2 max-w-xs text-sm text-ink-dim">
            Sign in to create a secure embedded wallet on Celo. Fund it, play staked rounds, and withdraw any time.
          </p>
          <button
            onClick={() => {
              play("tap");
              login();
            }}
            disabled={!ready}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-void disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #a892ff, #5eead4)" }}
          >
            {ready ? "Sign in" : <Loader2 className="h-4 w-4 animate-spin" />}
          </button>
        </div>
      ) : (
        <>
          {/* balance + address */}
          <div className="mt-5 rounded-3xl glass-strong p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-widest text-ink-faint">Balance</p>
              <button onClick={refresh} className="text-ink-faint transition-colors hover:text-ink" aria-label="Refresh balance">
                <RefreshCw className={cn("h-3.5 w-3.5", loadingBal && "animate-spin")} />
              </button>
            </div>
            <p className="nums mt-1 text-3xl font-bold text-ink">
              {balance === null ? "—" : fmtCelo(balance)} <span className="text-base text-ink-faint">CELO</span>
            </p>

            <button
              onClick={copy}
              className="mt-4 flex w-full items-center justify-between rounded-2xl bg-white/[0.03] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
            >
              <div>
                <p className="text-[10px] uppercase tracking-widest text-ink-faint">Your address · tap to copy</p>
                <p className="nums text-sm font-semibold text-ink">{shortAddr(address)}</p>
              </div>
              {copied ? <Check className="h-4 w-4 text-teal-bright" /> : <Copy className="h-4 w-4 text-ink-faint" />}
            </button>
            <p className="mt-2 text-[11px] text-ink-faint">Send CELO to this address to fund your wallet.</p>
          </div>

          {/* send / withdraw */}
          <div className="mt-4 rounded-3xl glass p-5">
            <p className="text-sm font-semibold text-ink">Send / Withdraw</p>
            <p className="mt-0.5 text-xs text-ink-faint">Move CELO to any address or your external wallet.</p>

            <label className="mt-4 block text-[11px] uppercase tracking-widest text-ink-faint">To address</label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value.trim())}
              placeholder="0x…"
              spellCheck={false}
              className="mt-1.5 w-full rounded-2xl border border-line bg-void-800 px-3 py-3 font-mono text-sm text-ink outline-none transition-colors focus:border-violet/60"
            />

            <label className="mt-3 block text-[11px] uppercase tracking-widest text-ink-faint">Amount (CELO)</label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                inputMode="decimal"
                placeholder="0.00"
                className="nums w-full rounded-2xl border border-line bg-void-800 px-3 py-3 text-sm text-ink outline-none transition-colors focus:border-violet/60"
              />
              {balance !== null && (
                <button
                  onClick={() => setAmount(String(Math.max(0, balance - 0.0005)))}
                  className="shrink-0 rounded-2xl glass px-3 py-3 text-xs font-semibold text-ink-dim"
                >
                  Max
                </button>
              )}
            </div>

            {err && <p className="mt-3 text-xs text-rose">{err}</p>}
            {txHash && (
              <a
                href={`${CELOSCAN}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-bright"
              >
                Sent — view on Celoscan <ExternalLink className="h-3 w-3" />
              </a>
            )}

            <button
              onClick={send}
              disabled={sending}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-void disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #a892ff, #5eead4)" }}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
              {sending ? "Sending…" : "Send"}
            </button>
          </div>

          <button
            onClick={() => {
              play("tap");
              logout();
              onHome();
            }}
            className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-ink-faint transition-colors hover:text-rose"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </>
      )}
    </div>
  );
}
