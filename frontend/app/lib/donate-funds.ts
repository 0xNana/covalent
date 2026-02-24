export interface DemoFundTheme {
  gradient: string;
  icon: string;
  badge: string;
}

export interface DemoFundMeta {
  id: number;
  title: string;
  desc: string;
  theme: DemoFundTheme;
}

export const DEMO_FUNDS: DemoFundMeta[] = [
  {
    id: 2,
    title: "Independent Journalism Fund",
    desc: "Back investigations into corruption and abuse with private donations.",
    theme: {
      gradient: "from-emerald-500 via-green-500 to-lime-400",
      icon: "article",
      badge: "Media",
    },
  },
  {
    id: 3,
    title: "Whistleblower Defense Fund",
    desc: "Cover legal support while keeping donor amounts confidential.",
    theme: {
      gradient: "from-amber-500 via-orange-500 to-rose-400",
      icon: "gavel",
      badge: "Legal",
    },
  },
  {
    id: 4,
    title: "Labor Solidarity Fund",
    desc: "Support organizing and strike relief with private, verifiable gifts.",
    theme: {
      gradient: "from-sky-500 via-blue-500 to-indigo-400",
      icon: "handshake",
      badge: "Labor",
    },
  },
];

const DEMO_FUND_LOOKUP = Object.fromEntries(
  DEMO_FUNDS.map((fund) => [fund.id, fund]),
) as Record<number, DemoFundMeta | undefined>;

export function getDemoFundMeta(fundId: number): DemoFundMeta | null {
  return DEMO_FUND_LOOKUP[fundId] ?? null;
}
