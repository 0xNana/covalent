import { ethers } from "ethers";

import type { FundData } from "@/app/lib/contract";

const USDT_DECIMALS = 6;
const DAY_IN_SECONDS = 86_400;

export interface FundTheme {
  gradient: string;
  accentClass: string;
  surfaceClass: string;
  badge: string;
  icon: string;
}

const CATEGORY_THEMES: Record<string, FundTheme> = {
  media: {
    gradient: "from-emerald-500 via-green-500 to-lime-400",
    accentClass: "text-emerald-700",
    surfaceClass: "bg-emerald-50 border-emerald-200",
    badge: "Media",
    icon: "article",
  },
  legal: {
    gradient: "from-amber-500 via-orange-500 to-rose-400",
    accentClass: "text-amber-700",
    surfaceClass: "bg-amber-50 border-amber-200",
    badge: "Legal",
    icon: "gavel",
  },
  labor: {
    gradient: "from-sky-500 via-blue-500 to-indigo-400",
    accentClass: "text-sky-700",
    surfaceClass: "bg-sky-50 border-sky-200",
    badge: "Labor",
    icon: "front_hand",
  },
  health: {
    gradient: "from-rose-500 via-pink-500 to-orange-400",
    accentClass: "text-rose-700",
    surfaceClass: "bg-rose-50 border-rose-200",
    badge: "Health",
    icon: "health_and_safety",
  },
  civic: {
    gradient: "from-violet-500 via-fuchsia-500 to-pink-400",
    accentClass: "text-violet-700",
    surfaceClass: "bg-violet-50 border-violet-200",
    badge: "Civic",
    icon: "how_to_vote",
  },
  emergency: {
    gradient: "from-red-500 via-orange-500 to-yellow-400",
    accentClass: "text-red-700",
    surfaceClass: "bg-red-50 border-red-200",
    badge: "Emergency",
    icon: "warning",
  },
  education: {
    gradient: "from-cyan-500 via-teal-500 to-emerald-400",
    accentClass: "text-cyan-700",
    surfaceClass: "bg-cyan-50 border-cyan-200",
    badge: "Education",
    icon: "school",
  },
  community: {
    gradient: "from-fuchsia-500 via-purple-500 to-indigo-400",
    accentClass: "text-fuchsia-700",
    surfaceClass: "bg-fuchsia-50 border-fuchsia-200",
    badge: "Community",
    icon: "diversity_3",
  },
};

const FALLBACK_THEME: FundTheme = {
  gradient: "from-slate-700 via-slate-600 to-slate-400",
  accentClass: "text-slate-700",
  surfaceClass: "bg-slate-50 border-slate-200",
  badge: "Confidential",
  icon: "shield_lock",
};

export function getFundTheme(category: string): FundTheme {
  const key = category.trim().toLowerCase();
  return CATEGORY_THEMES[key] ?? FALLBACK_THEME;
}

export function formatUsdtAmount(value: bigint): string {
  const amount = Number(ethers.formatUnits(value, USDT_DECIMALS));
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function parseUsdtAmount(input: string): bigint {
  const trimmed = input.trim();
  if (!trimmed) {
    return 0n;
  }
  return ethers.parseUnits(trimmed, USDT_DECIMALS);
}

export function formatWalletAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatFundDate(timestampSeconds: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(timestampSeconds * 1000);
}

export function formatFundDateTime(timestampSeconds: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestampSeconds * 1000);
}

export function getFundPhase(fund: FundData, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (nowSeconds < fund.startTime) return "upcoming" as const;
  if (fund.active && nowSeconds <= fund.endTime) return "active" as const;
  return "ended" as const;
}

export function getDaysRemaining(
  endTime: number,
  nowSeconds = Math.floor(Date.now() / 1000),
): number {
  return Math.max(0, Math.ceil((endTime - nowSeconds) / DAY_IN_SECONDS));
}

export function getFundShareUrl(fundId: number): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/fund/${fundId}`;
  }
  return `/fund/${fundId}`;
}
