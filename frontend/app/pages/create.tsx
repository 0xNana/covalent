"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

import { createFund } from "@/app/lib/contract";
import {
  formatFundDateTime,
  formatUsdtAmount,
  getFundShareUrl,
  getFundTheme,
  parseUsdtAmount,
} from "@/app/lib/fund-ui";

const START_DELAY_SECONDS = 60;
const SECONDS_PER_DAY = 86_400;
const MS_PER_SECOND = 1_000;

const CATEGORIES = [
  "Media",
  "Legal",
  "Labor",
  "Health",
  "Civic",
  "Education",
  "Emergency",
  "Community",
];

export default function CreateFundPage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Media");
  const [goalAmount, setGoalAmount] = useState("5000");
  const [recipient, setRecipient] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdFundId, setCreatedFundId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const theme = getFundTheme(category);
  const now = Math.floor(Date.now() / MS_PER_SECOND);
  const previewStart = now + START_DELAY_SECONDS;
  const previewEnd =
    previewStart + (Number.parseInt(durationDays || "0", 10) || 0) * SECONDS_PER_DAY;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!isConnected) {
      setError("Connect your wallet before creating a campaign.");
      return;
    }

    if (!title.trim() || !recipient.trim()) {
      setError("Title and recipient address are required.");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      setError("Enter a valid recipient wallet address.");
      return;
    }

    const parsedDuration = Number.parseInt(durationDays, 10);
    if (Number.isNaN(parsedDuration) || parsedDuration < 1 || parsedDuration > 365) {
      setError("Choose a campaign duration between 1 and 365 days.");
      return;
    }

    let parsedGoalAmount: bigint;
    try {
      parsedGoalAmount = parseUsdtAmount(goalAmount);
    } catch {
      setError("Enter a valid USD goal amount using numbers only.");
      return;
    }

    if (parsedGoalAmount <= 0n) {
      setError("Goal amount must be greater than zero.");
      return;
    }

    setLoading(true);

    try {
      const startTime = Math.floor(Date.now() / MS_PER_SECOND) + START_DELAY_SECONDS;
      const endTime = startTime + parsedDuration * SECONDS_PER_DAY;
      const fundId = await createFund({
        title,
        description,
        category,
        goalAmount: parsedGoalAmount,
        recipient,
        startTime,
        endTime,
      });

      setCreatedFundId(fundId);
    } catch (createError: unknown) {
      setError(
        createError instanceof Error ? createError.message : "Failed to create fund.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (createdFundId !== null) {
    const shareUrl = getFundShareUrl(createdFundId);

    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="card p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-green-light">
            <span className="material-icons text-3xl text-brand-green">check_circle</span>
          </div>
          <h1 className="text-3xl font-extrabold text-brand-dark">Campaign Created</h1>
          <p className="mt-2 text-sm text-brand-muted">
            Your confidential campaign is live and ready to share.
          </p>

          <div className="mt-8 grid gap-4 rounded-2xl border border-brand-border bg-gray-50 p-5 text-left sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-muted">
                Fund ID
              </p>
              <p className="mt-1 text-4xl font-black text-brand-green">{createdFundId}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-muted">
                Share URL
              </p>
              <p className="mt-1 break-all text-sm font-medium text-brand-dark">{shareUrl}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              }}
              className="btn-outline px-6 py-3 text-sm"
            >
              {copied ? "Campaign Link Copied" : "Copy Campaign Link"}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/fund/${createdFundId}`)}
              className="btn-primary px-6 py-3 text-sm"
            >
              View Campaign Page
            </button>
            <button
              type="button"
              onClick={() => router.push(`/admin?fund=${createdFundId}`)}
              className="btn-primary px-6 py-3 text-sm"
            >
              Open Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-2xl space-y-2">
        <h1 className="heading-balance text-3xl font-extrabold text-brand-dark">
          Start a Confidential Campaign
        </h1>
        <p className="text-sm leading-relaxed text-brand-muted">
          Define a real campaign identity, set a goal, and publish a shareable
          campaign page that still keeps donation amounts private.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <form onSubmit={handleSubmit} className="card space-y-5 p-6 sm:p-8">
          {!isConnected && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              Connect a wallet on Sepolia to create a campaign.
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-semibold text-brand-dark"
              >
                Campaign Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                autoComplete="off"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="input-field"
                placeholder="Support independent reporting in West Africa…"
                disabled={loading || !isConnected}
                required
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-semibold text-brand-dark"
              >
                Category
              </label>
              <select
                id="category"
                name="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="input-field pr-10"
                disabled={loading || !isConnected}
              >
                {CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="goal"
                className="mb-2 block text-sm font-semibold text-brand-dark"
              >
                Goal Amount (USDT)
              </label>
              <input
                id="goal"
                name="goal_amount"
                type="number"
                min="1"
                step="0.01"
                inputMode="decimal"
                autoComplete="off"
                value={goalAmount}
                onChange={(event) => setGoalAmount(event.target.value)}
                className="input-field"
                placeholder="5000"
                disabled={loading || !isConnected}
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-brand-dark"
              >
                Campaign Story
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                autoComplete="off"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="input-field resize-none"
                placeholder="Explain what the campaign funds, why donors need privacy, and how the recipient will use the total once revealed…"
                disabled={loading || !isConnected}
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="recipient"
                className="mb-2 block text-sm font-semibold text-brand-dark"
              >
                Recipient Wallet Address
              </label>
              <input
                id="recipient"
                name="recipient"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                className="input-field font-mono text-sm"
                placeholder="0x…"
                disabled={loading || !isConnected}
                required
              />
              <p className="mt-1 text-xs text-brand-muted">
                This wallet receives the confidential funds after the campaign total is revealed.
              </p>
            </div>

            <div>
              <label
                htmlFor="duration"
                className="mb-2 block text-sm font-semibold text-brand-dark"
              >
                Duration (days)
              </label>
              <input
                id="duration"
                name="duration_days"
                type="number"
                min="1"
                max="365"
                inputMode="numeric"
                autoComplete="off"
                value={durationDays}
                onChange={(event) => setDurationDays(event.target.value)}
                className="input-field"
                disabled={loading || !isConnected}
              />
            </div>

            <div className="rounded-2xl border border-brand-border bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-muted">
                Launch Window
              </p>
              <p className="mt-1 text-sm font-semibold text-brand-dark">
                Opens {formatFundDateTime(previewStart)}
              </p>
              <p className="mt-1 text-xs text-brand-muted">
                Ends {formatFundDateTime(previewEnd)}
              </p>
            </div>
          </div>

          {error && (
            <div
              aria-live="polite"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isConnected}
            className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating Campaign…
              </>
            ) : (
              <>
                <span className="material-icons">campaign</span>
                Publish Campaign
              </>
            )}
          </button>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-brand-border bg-white shadow-card">
            <div className={`relative h-40 bg-gradient-to-r ${theme.gradient}`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.85),transparent_35%),radial-gradient(circle_at_85%_25%,rgba(255,255,255,0.55),transparent_30%)] opacity-90" />
              <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-1 text-[11px] font-bold text-brand-dark shadow-sm">
                <span className="material-icons text-[13px]" aria-hidden="true">
                  {theme.icon}
                </span>
                {category}
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                  Campaign Preview
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-white">
                  {title.trim() || "Your campaign title"}
                </h2>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-sm leading-relaxed text-brand-muted">
                {description.trim() ||
                  "Add a campaign story so donors understand the mission, why privacy matters, and how the revealed total will be used."}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-xl border px-4 py-3 ${theme.surfaceClass}`}>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-brand-muted">
                    Goal
                  </p>
                  <p className={`mt-1 text-lg font-extrabold ${theme.accentClass}`}>
                    {(() => {
                      try {
                        return formatUsdtAmount(parseUsdtAmount(goalAmount));
                      } catch {
                        return "$0.00";
                      }
                    })()}
                  </p>
                </div>
                <div className="rounded-xl border border-brand-border bg-gray-50 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-brand-muted">
                    Privacy
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-dark">
                    Amount hidden until reveal
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
