"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter, useSearchParams } from "next/navigation";

import DonateCard from "@/app/components/DonateCard";
import FundDirectory from "@/app/components/FundDirectory";

export default function DonatePage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fundId, setFundId] = useState(searchParams.get("fund") ?? "");

  useEffect(() => {
    setFundId(searchParams.get("fund") ?? "");
  }, [searchParams]);

  const syncFundId = (nextFundId: string) => {
    setFundId(nextFundId);
    const nextParams = new URLSearchParams(searchParams.toString());
    if (nextFundId) {
      nextParams.set("fund", nextFundId);
    } else {
      nextParams.delete("fund");
    }
    router.replace(`/donate${nextParams.toString() ? `?${nextParams.toString()}` : ""}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="heading-balance text-3xl font-extrabold text-brand-dark">
              Explore & Donate
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-brand-muted">
              Browse live campaigns, choose one from the directory, and complete a
              private donation flow with shielding, encryption, and confidential transfer.
            </p>
          </div>

          <FundDirectory
            title="Live Campaigns"
            subtitle="Campaign pages are public and readable even before wallet connection. Donation amounts remain encrypted until a reveal is requested after the campaign ends."
            selectedFundId={fundId}
            onSelectFund={syncFundId}
          />
        </div>

        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {!isConnected && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              <div className="flex items-start gap-3">
                <span className="material-icons text-lg" aria-hidden="true">
                  account_balance_wallet
                </span>
                <p>
                  Connect a wallet on Sepolia when you are ready to donate. You can
                  still browse every campaign before connecting.
                </p>
              </div>
            </div>
          )}

          <div className="card p-5">
            <label
              htmlFor="fund-id-input"
              className="mb-2 block text-sm font-semibold text-brand-dark"
            >
              Or jump to a fund by ID
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="fund-id-input"
                name="fund_id"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                autoComplete="off"
                value={fundId}
                onChange={(event) => syncFundId(event.target.value)}
                className="input-field flex-1 font-mono"
                placeholder="Enter fund ID…"
              />
              {fundId && (
                <button
                  type="button"
                  onClick={() => router.push(`/fund/${fundId}`)}
                  className="btn-outline whitespace-nowrap px-4 py-3 text-sm sm:self-auto"
                >
                  Open
                </button>
              )}
            </div>
          </div>

          {fundId ? (
            <DonateCard fundId={fundId} />
          ) : (
            <div className="card p-8 text-center">
              <span className="material-icons text-4xl text-brand-green" aria-hidden="true">
                favorite
              </span>
              <h2 className="mt-3 text-lg font-bold text-brand-dark">
                Pick a fund to continue
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                Select a live campaign from the directory to load its private donation flow here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
