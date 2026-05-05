import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl space-y-3">
        <h1 className="heading-balance text-4xl font-extrabold text-brand-dark">
          How Covalent Works
        </h1>
        <p className="text-sm leading-relaxed text-brand-muted">
          Covalent combines public campaign discovery with confidential donation
          flows. Donors can understand a campaign without exposing their contribution
          amount to the chain while it is active.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {[
          {
            title: "1. Campaign creation",
            body: "Creators publish a campaign with a title, category, goal, recipient wallet, and duration. The campaign page is immediately shareable.",
          },
          {
            title: "2. Shield into private balance",
            body: "Donors claim or bring USDT, then shield it into confidential cUSDT. The confidential token balance can be decrypted only by its owner.",
          },
          {
            title: "3. Donate with encryption",
            body: "The donation amount is encrypted client-side before submission. The campaign contract receives an encrypted amount and aggregates totals homomorphically.",
          },
          {
            title: "4. Reveal only the aggregate",
            body: "After the campaign ends, an admin can request a reveal. The contract owner finalizes a proof-verified decryption so only the combined total becomes public.",
          },
        ].map((item) => (
          <article key={item.title} className="card p-6">
            <h2 className="text-xl font-bold text-brand-dark">{item.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-muted">{item.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-[28px] bg-brand-green p-8 text-white">
        <h2 className="text-2xl font-extrabold">Try the full demo flow</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">
          Claim test USDT, shield into cUSDT, donate to a live campaign, then use the
          dashboard to request and finalize a reveal after the campaign ends.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link href="/faucet" className="rounded-lg bg-white px-5 py-3 text-sm font-bold text-brand-green">
            Claim Test USDT
          </Link>
          <Link href="/donate" className="rounded-lg border border-white/30 px-5 py-3 text-sm font-bold text-white">
            Browse Campaigns
          </Link>
        </div>
      </div>
    </div>
  );
}
