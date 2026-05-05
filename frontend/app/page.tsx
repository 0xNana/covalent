import Link from "next/link";

import FundDirectory from "@/app/components/FundDirectory";

export default function LandingPage() {
  return (
    <>
      <header className="border-b border-brand-border bg-[radial-gradient(circle_at_top_left,rgba(2,169,92,0.14),transparent_36%),linear-gradient(180deg,#ffffff_0%,#f7fbf8_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 shadow-soft">
              <span className="material-icons text-sm" aria-hidden="true">
                verified_user
              </span>
              Private fundraising on Ethereum
            </div>
            <h1 className="heading-balance max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-brand-dark md:text-6xl">
              Private donations.
              <br />
              <span className="text-brand-green">Public campaign clarity.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-brand-muted">
              Covalent gives campaigns a clean public landing page while keeping
              contribution amounts encrypted until a reveal is explicitly requested.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/donate"
                className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-4 text-lg"
              >
                <span className="material-icons text-xl">favorite</span>
                Explore Live Funds
              </Link>
              <Link
                href="/create"
                className="btn-outline inline-flex items-center justify-center gap-2 px-8 py-4 text-lg"
              >
                <span className="material-icons text-xl">add_circle</span>
                Start a Fund
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                "Campaigns stay shareable and readable before wallet connection.",
                "Only aggregate totals are revealed after campaign close.",
              ].map((text) => (
                <div
                  key={text}
                  className="rounded-2xl border border-white/90 bg-white/80 px-4 py-4 text-sm leading-relaxed text-brand-muted shadow-soft backdrop-blur-sm"
                >
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-brand-green-light text-brand-green">
                    <span className="material-icons text-lg" aria-hidden="true">
                      check_circle
                    </span>
                  </div>
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto mt-8 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: "visibility_off",
              title: "Confidential by default",
              desc: "Amounts stay hidden while campaigns remain browsable and understandable.",
            },
            {
              icon: "verified_user",
              title: "Proof-verified reveals",
              desc: "Only combined totals become public, and only after an explicit reveal request.",
            },
            {
              icon: "dashboard_customize",
              title: "Operator-ready workflow",
              desc: "Creators get dashboards, share flows, reveal states, and withdrawal actions.",
            },
          ].map((item) => (
            <div key={item.title} className="card flex items-start gap-4 px-6 py-5">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-green-light text-brand-green">
                <span className="material-icons text-xl">{item.icon}</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-dark">{item.title}</h3>
                <p className="mt-0.5 text-xs text-brand-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-brand-border bg-white p-6 shadow-card sm:p-8">
          <FundDirectory
            title="Live Fund Directory"
            subtitle="Browse live onchain campaigns before connecting a wallet. Each fund ships with its story, goal, timeline, and private-donation flow."
            limit={3}
            compact
            showControls={false}
          />
        </div>
      </section>

      <section id="how-it-works" className="border-y border-brand-border bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="heading-balance mb-2 text-3xl font-extrabold text-brand-dark">
              How it works
            </h2>
            <p className="text-brand-muted">
              A real campaign workflow, not just a contract interaction.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-4">
            {[
              {
                step: "1",
                icon: "search",
                title: "Discover",
                desc: "Browse live campaigns and inspect the mission, goal, and timeline.",
              },
              {
                step: "2",
                icon: "water_drop",
                title: "Fund Wallet",
                desc: "Use the faucet for test USDT, then shield into a private balance.",
              },
              {
                step: "3",
                icon: "lock",
                title: "Donate",
                desc: "Encrypt the amount client-side and submit the confidential transfer onchain.",
              },
              {
                step: "4",
                icon: "verified",
                title: "Reveal Total",
                desc: "Admins request a post-campaign reveal so only the aggregate becomes public.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-green-light">
                  <span className="material-icons text-2xl text-brand-green">
                    {item.icon}
                  </span>
                </div>
                <h3 className="mb-2 font-bold text-brand-dark">{item.title}</h3>
                <p className="text-sm leading-relaxed text-brand-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="heading-balance mb-4 text-3xl font-extrabold text-brand-dark">
              Privacy should not end where fundraising begins
            </h2>
            <p className="mb-6 leading-relaxed text-brand-muted">
              Most donation rails force a tradeoff between transparency and donor
              dignity. Covalent keeps campaign discovery public while preserving
              confidential contribution amounts until a reveal is requested.
            </p>
            <ul className="space-y-3">
              {[
                "Campaign pages stay public and shareable without exposing donor amounts.",
                "Campaign data is portable across browsers and devices.",
                "Only aggregate totals can be revealed, never individual contributions.",
              ].map((text) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="material-icons mt-0.5 text-lg text-brand-green">
                    check_circle
                  </span>
                  <span className="text-sm text-brand-body">{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-8 text-center">
            <div className="mb-2 font-mono text-6xl font-black tracking-[0.3em] text-brand-dark">
              ********
            </div>
            <p className="mb-6 text-sm text-brand-muted">
              While a campaign is active, this is what the public sees instead of
              your amount.
            </p>
            <div className="rounded-lg bg-brand-green-light p-4">
              <p className="text-sm font-bold text-brand-green">
                Confidential giving. Public accountability at reveal time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[28px] bg-brand-green p-10 text-center text-white md:p-14">
          <h2 className="heading-balance mb-3 text-3xl font-extrabold md:text-4xl">
            Ready to launch or back a confidential campaign?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/80">
            Explore live campaigns, claim test USDT, shield into a private balance,
            and complete the entire donation lifecycle from one product surface.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/donate"
              className="rounded-lg bg-white px-8 py-4 text-center font-bold text-brand-green transition-colors hover:bg-gray-50"
            >
              Browse Campaigns
            </Link>
            <Link
              href="/faucet"
              className="rounded-lg border border-white/30 bg-white/15 px-8 py-4 text-center font-bold text-white transition-colors hover:bg-white/25"
            >
              Claim Test USDT
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
