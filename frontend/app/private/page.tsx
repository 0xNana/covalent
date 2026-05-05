"use client";

import Link from "next/link";
import { useAccount } from "wagmi";

import TokenManager from "@/app/components/TokenManager";

export default function PrivatePage() {
  const { isConnected } = useAccount();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-3xl space-y-2">
        <h1 className="heading-balance text-3xl font-extrabold text-brand-dark">
          Private Balance Workspace
        </h1>
        <p className="text-sm leading-relaxed text-brand-muted">
          Shield public test USDT into confidential cUSDT, decrypt your own private
          balance when needed, and unshield back to public tokens after the campaign flow.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          {!isConnected && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              Connect a wallet on Sepolia to manage your private balance. You can claim
              faucet USDT first if you need test funds.
            </div>
          )}

          <TokenManager />

          <div className="card p-6">
            <h2 className="text-lg font-bold text-brand-dark">How shielding works</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: "water_drop",
                  title: "1. Public USDT",
                  desc: "Claim or fund your wallet with test USDT on Sepolia.",
                },
                {
                  icon: "encrypted",
                  title: "2. Private cUSDT",
                  desc: "Wrap into confidential balance so the amount becomes hidden onchain.",
                },
                {
                  icon: "favorite",
                  title: "3. Donate privately",
                  desc: "Use the encrypted balance directly in a confidential campaign donation.",
                },
              ].map((step) => (
                <div key={step.title} className="rounded-2xl border border-brand-border bg-gray-50 p-5 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-green-light text-brand-green">
                    <span className="material-icons text-2xl">{step.icon}</span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-brand-dark">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-muted">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-brand-dark">Suggested Flow</h2>
            <div className="mt-4 space-y-3 text-sm">
              {[
                { href: "/faucet", label: "Claim test USDT", desc: "Top up your wallet with faucet tokens." },
                { href: "/donate", label: "Browse campaigns", desc: "Pick a campaign before you shield and donate." },
                { href: "/admin", label: "Open dashboard", desc: "Reveal and withdraw after campaigns close." },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-2xl border border-brand-border px-4 py-3 transition-colors hover:bg-gray-50"
                >
                  <p className="font-semibold text-brand-dark">{item.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-brand-muted">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
