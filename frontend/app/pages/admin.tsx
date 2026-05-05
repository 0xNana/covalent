"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";

import FundStats from "@/app/components/FundStats";
import RevealButton from "@/app/components/RevealButton";
import {
  checkIsAdmin,
  getContractOwner,
  getEncryptedTotal,
  getFund,
  getRevealedTotal,
  isRevealRequested,
  isTokenRevealed,
  listViewerFunds,
  revealTotalWithProof,
  type FundData,
  withdrawFund,
} from "@/app/lib/contract";
import { initFHEVM, publicDecryptFundHandle } from "@/app/lib/fheClient";
import {
  formatFundDate,
  formatWalletAddress,
  getFundPhase,
} from "@/app/lib/fund-ui";

interface ManagedFund extends FundData {
  revealedTotal: bigint;
  revealed: boolean;
  revealRequested: boolean;
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [fundIdInput, setFundIdInput] = useState(searchParams.get("fund") ?? "");
  const [viewerFunds, setViewerFunds] = useState<FundData[]>([]);
  const [fund, setFund] = useState<ManagedFund | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loadingFund, setLoadingFund] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [finalizeLoading, setFinalizeLoading] = useState(false);

  const syncFundQuery = (value: string) => {
    setFundIdInput(value);
    const nextParams = new URLSearchParams(searchParams.toString());
    if (value) {
      nextParams.set("fund", value);
    } else {
      nextParams.delete("fund");
    }
    router.replace(`/admin${nextParams.toString() ? `?${nextParams.toString()}` : ""}`);
  };

  const loadViewerFunds = useCallback(async () => {
    if (!address) return;
    try {
      setLoadingList(true);
      const funds = await listViewerFunds(address);
      setViewerFunds(funds);
    } catch (listError: unknown) {
      setError(
        listError instanceof Error
          ? listError.message
          : "Failed to load your managed campaigns.",
      );
    } finally {
      setLoadingList(false);
    }
  }, [address]);

  const loadFund = useCallback(async () => {
    if (!fundIdInput || !address) return;

    try {
      setLoadingFund(true);
      setError(null);
      setFund(null);

      const fundId = Number.parseInt(fundIdInput, 10);
      const [fundData, revealed, revealRequested, revealedTotal, adminStatus, ownerAddress] =
        await Promise.all([
          getFund(fundId),
          isTokenRevealed(fundId).catch(() => false),
          isRevealRequested(fundId).catch(() => false),
          getRevealedTotal(fundId).catch(() => 0n),
          checkIsAdmin(fundId, address),
          getContractOwner(),
        ]);

      setFund({
        ...fundData,
        revealed,
        revealRequested,
        revealedTotal,
      });
      setIsAdmin(adminStatus);
      setIsOwner(ownerAddress.toLowerCase() === address.toLowerCase());
    } catch (loadError: unknown) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load campaign.",
      );
    } finally {
      setLoadingFund(false);
    }
  }, [address, fundIdInput]);

  useEffect(() => {
    if (isConnected && address) {
      loadViewerFunds();
    }
  }, [address, isConnected, loadViewerFunds]);

  useEffect(() => {
    if (searchParams.get("fund")) {
      setFundIdInput(searchParams.get("fund") ?? "");
    }
  }, [searchParams]);

  useEffect(() => {
    if (fundIdInput && address) {
      loadFund();
    }
  }, [address, fundIdInput, loadFund]);

  const handleWithdraw = async () => {
    if (!fund) return;

    try {
      setWithdrawLoading(true);
      setError(null);
      await withdrawFund(fund.id);
      await loadFund();
      await loadViewerFunds();
    } catch (withdrawError: unknown) {
      setError(
        withdrawError instanceof Error
          ? withdrawError.message
          : "Failed to withdraw funds.",
      );
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleFinalizeReveal = async () => {
    if (!fund) return;

    try {
      setFinalizeLoading(true);
      setError(null);
      await initFHEVM();
      const encryptedTotalHex = await getEncryptedTotal(fund.id);
      const { decryptedValue, decryptionProof } = await publicDecryptFundHandle(
        encryptedTotalHex,
      );
      await revealTotalWithProof(fund.id, decryptedValue, decryptionProof);
      await loadFund();
      await loadViewerFunds();
    } catch (finalizeError: unknown) {
      setError(
        finalizeError instanceof Error
          ? finalizeError.message
          : "Failed to finalize reveal.",
      );
    } finally {
      setFinalizeLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="card max-w-md p-8 text-center">
          <span className="material-icons mb-3 text-4xl text-brand-muted">
            account_balance_wallet
          </span>
          <h1 className="text-xl font-bold text-brand-dark">Connect Your Wallet</h1>
          <p className="mt-2 text-sm leading-relaxed text-brand-muted">
            Connect the campaign creator, assigned admin, or contract owner wallet to
            manage reveals and withdrawals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="card p-6">
            <h1 className="text-2xl font-extrabold text-brand-dark">Dashboard</h1>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">
              Manage campaigns you created or administer. The contract owner can
              also finalize reveals from here.
            </p>

            <label
              htmlFor="dashboard-fund-id"
              className="mt-5 block text-sm font-semibold text-brand-dark"
            >
              Open by fund ID
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="dashboard-fund-id"
                name="dashboard_fund_id"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                autoComplete="off"
                value={fundIdInput}
                onChange={(event) => syncFundQuery(event.target.value)}
                className="input-field flex-1 font-mono"
                placeholder="Enter fund ID…"
              />
              <button
                type="button"
                onClick={loadFund}
                disabled={loadingFund || !fundIdInput}
                className="btn-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingFund ? "Loading…" : "Open"}
              </button>
            </div>
          </div>

          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-dark">Your Campaigns</h2>
              <button
                type="button"
                onClick={loadViewerFunds}
                className="text-sm font-semibold text-brand-green hover:text-brand-green-hover"
              >
                Refresh
              </button>
            </div>

            {loadingList && <p className="text-sm text-brand-muted">Loading campaigns…</p>}

            {!loadingList && viewerFunds.length === 0 && (
              <div className="space-y-3 text-sm text-brand-muted">
                <p>No created or assigned campaigns found for this wallet yet.</p>
                <Link href="/create" className="text-brand-green hover:text-brand-green-hover">
                  Create your first campaign
                </Link>
              </div>
            )}

            {!loadingList && viewerFunds.length > 0 && (
              <div className="space-y-3">
                {viewerFunds.map((item) => {
                  const phase = getFundPhase(item);
                  const selected = fund?.id === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => syncFundQuery(String(item.id))}
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
                        selected
                          ? "border-brand-green bg-brand-green-light/40"
                          : "border-brand-border bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-brand-dark">{item.title}</p>
                          <p className="mt-1 text-xs text-brand-muted">
                            Ends {formatFundDate(item.endTime)}
                          </p>
                        </div>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-muted">
                          {phase}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <section className="space-y-6">
          {error && (
            <div
              aria-live="polite"
              className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {!fund && !error && (
            <div className="card p-10 text-center">
              <span className="material-icons text-4xl text-brand-green">dashboard</span>
              <h2 className="mt-3 text-xl font-bold text-brand-dark">
                Select a campaign to manage
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                Use the campaign list or enter a fund ID to load reveal and withdrawal controls.
              </p>
            </div>
          )}

          {fund && (
            <>
              <div className="card p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-muted">
                      Managing fund #{fund.id}
                    </p>
                    <h2 className="mt-1 text-2xl font-extrabold text-brand-dark">
                      {fund.title}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand-muted">
                      {fund.description || "No campaign description provided yet."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        isAdmin
                          ? "bg-brand-green-light text-brand-green"
                          : "bg-gray-100 text-brand-muted"
                      }`}
                    >
                      {isAdmin ? "Campaign Admin" : "Viewer"}
                    </span>
                    {isOwner && (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                        Contract Owner
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-4 text-sm text-brand-muted">
                  <span>Recipient {formatWalletAddress(fund.recipient)}</span>
                  <span>Creator {formatWalletAddress(fund.creator)}</span>
                  <span>Ends {formatFundDate(fund.endTime)}</span>
                  <Link
                    href={`/fund/${fund.id}`}
                    className="font-semibold text-brand-green hover:text-brand-green-hover"
                  >
                    View public campaign page
                  </Link>
                </div>
              </div>

              <FundStats
                donationCount={fund.donationCount}
                goalAmount={fund.goalAmount}
                revealedTotal={fund.revealedTotal}
                revealed={fund.revealed}
                revealRequested={fund.revealRequested}
              />

              <div className="card space-y-4 p-6">
                <h3 className="text-lg font-bold text-brand-dark">Actions</h3>

                {!fund.revealed &&
                  getFundPhase(fund) === "active" &&
                  isAdmin && (
                    <div className="rounded-2xl border border-brand-border bg-gray-50 p-4 text-sm text-brand-muted">
                      Reveal requests unlock after the campaign ends. Donations remain encrypted while the campaign is active.
                    </div>
                  )}

                {!fund.revealed &&
                  getFundPhase(fund) === "ended" &&
                  !fund.revealRequested &&
                  isAdmin && <RevealButton fundId={fund.id} onReveal={() => loadFund()} />}

                {!fund.revealed &&
                  fund.revealRequested &&
                  !isOwner && (
                    <div className="rounded-2xl border border-brand-border bg-gray-50 p-4 text-sm text-brand-muted">
                      Reveal requested. Waiting for the contract owner wallet to submit the proof-verified total.
                    </div>
                  )}

                {!fund.revealed && fund.revealRequested && isOwner && (
                  <button
                    type="button"
                    onClick={handleFinalizeReveal}
                    disabled={finalizeLoading}
                    className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {finalizeLoading ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Finalizing Reveal…
                      </>
                    ) : (
                      <>
                        <span className="material-icons">verified</span>
                        Finalize Reveal
                      </>
                    )}
                  </button>
                )}

                {fund.revealed && fund.revealedTotal > 0n && fund.active && (
                  <button
                    type="button"
                    onClick={handleWithdraw}
                    disabled={withdrawLoading}
                    className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {withdrawLoading ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Withdrawing…
                      </>
                    ) : (
                      <>
                        <span className="material-icons">account_balance</span>
                        Withdraw to Recipient
                      </>
                    )}
                  </button>
                )}

                {fund.revealed && !fund.active && (
                  <div className="rounded-2xl border border-brand-border bg-gray-50 p-4 text-sm text-brand-muted">
                    This campaign has already been withdrawn to the recipient wallet.
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
