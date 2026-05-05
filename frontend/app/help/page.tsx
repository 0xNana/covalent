import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl space-y-3">
        <h1 className="heading-balance text-4xl font-extrabold text-brand-dark">
          Help & Support
        </h1>
        <p className="text-sm leading-relaxed text-brand-muted">
          The fastest path through the demo product is faucet, shield, donate, then
          reveal through the dashboard. Use the notes below if something blocks you.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {[
          {
            title: "Wrong network",
            body: "If your wallet is not on Sepolia, use the network banner at the top of the app to switch before trying donations or admin actions.",
          },
          {
            title: "No test funds",
            body: "Visit the faucet page to claim test USDT, then open Private Balance to shield it into cUSDT before donating.",
          },
          {
            title: "Can’t reveal yet",
            body: "Reveal requests only open after the campaign end time. The dashboard surfaces the state once a campaign is eligible.",
          },
          {
            title: "Need the full flow",
            body: "Use the dashboard after the campaign closes to request a reveal, finalize it from the owner wallet, and withdraw to the recipient.",
          },
        ].map((item) => (
          <article key={item.title} className="card p-6">
            <h2 className="text-xl font-bold text-brand-dark">{item.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-muted">{item.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href="/faucet" className="btn-primary px-5 py-3 text-sm">
          Open Faucet
        </Link>
        <Link href="/private" className="btn-outline px-5 py-3 text-sm">
          Open Private Balance
        </Link>
      </div>
    </div>
  );
}
