"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";

import type { FundData } from "@/app/lib/contract";
import { listFunds } from "@/app/lib/contract";
import { getFundPhase } from "@/app/lib/fund-ui";
import FundCard from "./FundCard";

type PhaseFilter = "all" | "active" | "upcoming" | "ended";

export default function FundDirectory({
  title,
  subtitle,
  selectedFundId,
  onSelectFund,
  limit,
  compact = false,
  showControls = true,
}: {
  title: string;
  subtitle: string;
  selectedFundId?: string;
  onSelectFund?: (fundId: string) => void;
  limit?: number;
  compact?: boolean;
  showControls?: boolean;
}) {
  const [funds, setFunds] = useState<FundData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>("all");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let cancelled = false;

    async function loadFunds() {
      try {
        setLoading(true);
        setError(null);
        const nextFunds = await listFunds();
        if (!cancelled) {
          setFunds(nextFunds);
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load live funds.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFunds();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedQuery = deferredSearch.trim().toLowerCase();
  const visibleFunds = funds.filter((fund) => {
    const matchesPhase =
      phaseFilter === "all" || getFundPhase(fund) === phaseFilter;
    const matchesQuery =
      !normalizedQuery ||
      fund.title.toLowerCase().includes(normalizedQuery) ||
      fund.description.toLowerCase().includes(normalizedQuery) ||
      fund.category.toLowerCase().includes(normalizedQuery) ||
      String(fund.id).includes(normalizedQuery);

    return matchesPhase && matchesQuery;
  });

  const renderedFunds = limit ? visibleFunds.slice(0, limit) : visibleFunds;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="heading-balance text-2xl font-extrabold text-brand-dark">
            {title}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-brand-muted">
            {subtitle}
          </p>
        </div>

        {showControls && (
          <div className="grid w-full gap-3 md:w-auto md:min-w-[22rem] md:grid-cols-[minmax(0,1fr)_auto]">
            <label className="block">
              <span className="sr-only">Search funds</span>
              <input
                type="search"
                name="fund_search"
                autoComplete="off"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title, category, or fund ID…"
                className="input-field w-full"
              />
            </label>
            <label className="block">
              <span className="sr-only">Filter by campaign status</span>
              <select
                name="fund_phase"
                value={phaseFilter}
                onChange={(event) => setPhaseFilter(event.target.value as PhaseFilter)}
                className="input-field w-full pr-10 md:min-w-[10rem]"
              >
                <option value="all">All Campaigns</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="ended">Ended</option>
              </select>
            </label>
          </div>
        )}
      </div>

      {loading && (
        <div
          className={`grid gap-5 ${
            compact
              ? "grid-cols-[repeat(auto-fit,minmax(min(100%,16.75rem),1fr))]"
              : "grid-cols-[repeat(auto-fit,minmax(min(100%,19rem),1fr))]"
          }`}
          aria-live="polite"
        >
          {Array.from({ length: limit ?? 3 }, (_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-card"
            >
              <div className="h-36 animate-pulse bg-gray-100" />
              <div className="space-y-3 p-5">
                <div className="h-6 animate-pulse rounded bg-gray-100" />
                <div className="h-16 animate-pulse rounded bg-gray-50" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-16 animate-pulse rounded bg-gray-50" />
                  <div className="h-16 animate-pulse rounded bg-gray-50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div
          aria-live="polite"
          className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {!loading && !error && renderedFunds.length === 0 && (
        <div className="rounded-2xl border border-dashed border-brand-border bg-white p-8 text-center shadow-card">
          <p className="text-lg font-bold text-brand-dark">No funds match that view.</p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">
            Create a new confidential campaign or broaden your filters to explore
            what is already live onchain.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link href="/create" className="btn-primary px-5 py-3 text-sm">
              Start a Fund
            </Link>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPhaseFilter("all");
              }}
              className="btn-outline px-5 py-3 text-sm"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {!loading && !error && renderedFunds.length > 0 && (
        <div
          className={`grid gap-5 ${
            compact
              ? "grid-cols-[repeat(auto-fit,minmax(min(100%,16.75rem),1fr))]"
              : "grid-cols-[repeat(auto-fit,minmax(min(100%,19rem),1fr))]"
          }`}
        >
          {renderedFunds.map((fund) => (
            <FundCard
              key={fund.id}
              fund={fund}
              compact={compact}
              selected={selectedFundId === String(fund.id)}
              onSelect={
                onSelectFund ? (fundId) => onSelectFund(String(fundId)) : undefined
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
