"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import DonateCard from "@/app/components/DonateCard";

export default function DonatePage() {
  const { isConnected } = useAccount();
  const [fundId, setFundId] = useState("");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Make a Donation</h1>
          <p className="mt-2 text-gray-600">
            Your donation amount is encrypted before it leaves your browser.
          </p>
        </div>

        {!isConnected && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 text-sm">
            Please connect your wallet to make a donation.
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label htmlFor="fundId" className="block text-sm font-medium text-gray-700 mb-1">
              Fund ID
            </label>
            <input
              id="fundId"
              type="number"
              min="1"
              step="1"
              value={fundId}
              onChange={(e) => setFundId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter fund ID"
              disabled={!isConnected}
              required
            />
          </div>

          {fundId && <DonateCard fundId={fundId} />}
        </div>

        <div className="mt-6 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
          <h3 className="text-sm font-semibold text-indigo-900 mb-2">How it works</h3>
          <ol className="text-sm text-indigo-800 space-y-1 list-decimal list-inside">
            <li>Enter the fund ID and your donation amount</li>
            <li>Your amount is encrypted using FHE (Fully Homomorphic Encryption)</li>
            <li>The encrypted value is stored on-chain — nobody can see your amount</li>
            <li>Only the aggregated total can be revealed by an admin</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
