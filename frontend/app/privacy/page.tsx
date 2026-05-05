export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl space-y-3">
        <h1 className="heading-balance text-4xl font-extrabold text-brand-dark">
          Privacy Model
        </h1>
        <p className="text-sm leading-relaxed text-brand-muted">
          Covalent is designed so campaign discovery is public, but individual donation
          amounts remain encrypted during the lifetime of a campaign.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {[
          {
            title: "What stays private",
            body: "Donation amounts are encrypted before they reach the campaign contract. The running total is also stored in encrypted form during the campaign.",
          },
          {
            title: "What becomes public",
            body: "Campaign metadata, timelines, recipients, and donor counts are public. After a reveal is requested and finalized, only the aggregate campaign total becomes public.",
          },
          {
            title: "What never happens",
            body: "Covalent never reveals individual donation amounts through the campaign workflow. Reveals are proof-verified and scoped to aggregated totals.",
          },
        ].map((item) => (
          <article key={item.title} className="card p-6">
            <h2 className="text-xl font-bold text-brand-dark">{item.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-muted">{item.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
