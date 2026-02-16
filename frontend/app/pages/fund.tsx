"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { getFund, getEncryptedTotal } from "@/app/lib/contract";
import FundStats from "@/app/components/FundStats";
import DonateCard from "@/app/components/DonateCard";

interface FundData {
  id: number;
  title: string;
  description: string;
  recipient: string;
  creator: string;
  startTime: number;
  endTime: number;
  active: boolean;
  donationCount: number;
  revealedTotal: number;
  revealed: boolean;
}

export default function FundPage() {
  const params = useParams();
  const fundId = params?.id as string;

  const [fund, setFund] = useState<FundData | null>(null);
  const [encryptedTotal, setEncryptedTotal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFundData = useCallback(async () => {
    if (!fundId) return;
    try {
      setLoading(true);
      const fundData = await getFund(parseInt(fundId, 10));
      setFund(fundData);

      const total = await getEncryptedTotal(parseInt(fundId, 10));
      setEncryptedTotal(total);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load fund";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fundId]);

  useEffect(() => {
    loadFundData();
  }, [loadFundData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto text-indigo-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-2 text-gray-600">Loading fund information...</p>
        </div>
      </div>
    );
  }

  if (error || !fund) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md">
          {error || "Fund not found"}
        </div>
      </div>
    );
  }

  const isActive = fund.active && Date.now() / 1000 >= fund.startTime && Date.now() / 1000 <= fund.endTime;
  const hasStarted = Date.now() / 1000 >= fund.startTime;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{fund.title}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isActive
                  ? "bg-green-100 text-green-800"
                  : !hasStarted
                    ? "bg-amber-100 text-amber-800"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              {isActive ? "Active" : !hasStarted ? "Upcoming" : "Ended"}
            </span>
          </div>
          <p className="text-gray-600">{fund.description}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Fund Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Recipient</dt>
                <dd className="text-sm font-mono text-gray-900 truncate">{fund.recipient}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Start Date</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(fund.startTime * 1000).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">End Date</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(fund.endTime * 1000).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Creator</dt>
                <dd className="text-sm font-mono text-gray-900 truncate">{fund.creator}</dd>
              </div>
            </dl>
          </div>

          <FundStats
            encryptedTotal={encryptedTotal}
            donationCount={fund.donationCount}
            revealedTotal={fund.revealedTotal}
            revealed={fund.revealed}
          />
        </div>

        {isActive && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Make a Donation</h2>
            <DonateCard fundId={fundId} onDonationComplete={loadFundData} />
          </div>
        )}

        {!isActive && !hasStarted && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-lg text-center">
            This fund has not started yet. Donations open on{" "}
            {new Date(fund.startTime * 1000).toLocaleDateString()}.
          </div>
        )}

        {!isActive && hasStarted && (
          <div className="bg-gray-50 border border-gray-200 text-gray-600 px-6 py-4 rounded-lg text-center">
            This fund is no longer accepting donations.
          </div>
        )}
      </div>
    </div>
  );
}
