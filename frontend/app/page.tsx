import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <header className="relative overflow-hidden pt-20 pb-24 md:pt-32 md:pb-40">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-blue/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary-purple/10 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary-blue font-bold text-sm mb-8">
            <span className="material-icons text-sm mr-2">verified_user</span>
            Privacy-First Giving
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
            Empower Change,{" "}
            <br />
            <span className="gradient-text">Protect Your Identity.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-slate-400 mb-10 leading-relaxed">
            Covalent keeps your donations completely private and secure.
            Give anonymously to causes you believe in — nobody sees how much
            you gave, not even us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/donate"
              className="px-10 py-4 gradient-btn text-white font-bold rounded-xl text-lg shadow-lg inline-block"
            >
              Explore Causes
            </Link>
            <a
              href="#how-it-works"
              className="px-10 py-4 bg-white/5 text-white font-bold rounded-xl text-lg border border-white/10 hover:bg-white/10 transition-all inline-block"
            >
              How it Works
            </a>
          </div>
        </div>
      </header>

      {/* Trust bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 mb-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-lighter-slate p-8 rounded-2xl card-shadow border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-blue/10 rounded-xl flex items-center justify-center text-primary-blue">
              <span className="material-icons">visibility_off</span>
            </div>
            <div>
              <h3 className="font-bold text-white">Full Privacy</h3>
              <p className="text-sm text-slate-400">
                Your identity stays hidden
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-purple/10 rounded-xl flex items-center justify-center text-primary-purple">
              <span className="material-icons">public</span>
            </div>
            <div>
              <h3 className="font-bold text-white">Impact Driven</h3>
              <p className="text-sm text-slate-400 font-mono">
                &#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;
                Donated
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-blue/10 rounded-xl flex items-center justify-center text-primary-blue">
              <span className="material-icons">bolt</span>
            </div>
            <div>
              <h3 className="font-bold text-white">Instant Impact</h3>
              <p className="text-sm text-slate-400">
                Fast, secure transactions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section
        id="how-it-works"
        className="bg-white/5 py-24 border-y border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-lighter-slate p-8 rounded-2xl border border-white/5 card-shadow">
                  <span className="material-icons text-primary-blue text-3xl mb-4">
                    encrypted
                  </span>
                  <h4 className="font-bold text-white mb-2">
                    End-to-End Privacy
                  </h4>
                  <p className="text-sm text-slate-400">
                    Your donation amount is hidden before it leaves your wallet.
                  </p>
                </div>
                <div className="bg-lighter-slate p-8 rounded-2xl border border-white/5 card-shadow translate-x-4">
                  <span className="material-icons text-primary-purple text-3xl mb-4">
                    settings_suggest
                  </span>
                  <h4 className="font-bold text-white mb-2">
                    Hidden Amounts
                  </h4>
                  <p className="text-sm text-slate-400">
                    We calculate totals without ever seeing individual
                    contributions.
                  </p>
                </div>
              </div>
              <div className="space-y-4 pt-12">
                <div className="bg-lighter-slate p-8 rounded-2xl border border-white/5 card-shadow">
                  <span className="material-icons text-primary-blue text-3xl mb-4">
                    analytics
                  </span>
                  <h4 className="font-bold text-white mb-2">
                    Verified Impact
                  </h4>
                  <p className="text-sm text-slate-400">
                    Recipients get funds, you get proof your donation
                    made a difference.
                  </p>
                </div>
              </div>
            </div>

            {/* Explainer */}
            <div>
              <h2 className="text-4xl font-extrabold text-white mb-6">
                How Private Donations Work
              </h2>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                Covalent uses advanced encryption so your donation amount is
                hidden at every step. We can verify that fundraising goals are
                met without ever knowing who donated or how much each person
                gave.
              </p>
              <ul className="space-y-4 mb-10">
                <li className="flex items-start gap-3">
                  <span className="material-icons text-primary-blue mt-1">
                    check_circle
                  </span>
                  <span className="text-slate-300 font-medium">
                    No one — including Covalent — can see your transaction
                    history.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-icons text-primary-blue mt-1">
                    check_circle
                  </span>
                  <span className="text-slate-300 font-medium">
                    Your wallet address is never linked to the cause in public
                    records.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-icons text-primary-blue mt-1">
                    check_circle
                  </span>
                  <span className="text-slate-300 font-medium">
                    Individual donations stay private forever — only
                    totals can be revealed.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="gradient-btn rounded-3xl p-12 relative overflow-hidden text-center md:text-left">
          <div className="absolute right-0 top-0 w-1/3 h-full bg-white/10 -skew-x-12 transform translate-x-20" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-4xl font-extrabold text-white mb-4">
                Start giving privately today
              </h2>
              <p className="text-white/90 text-lg">
                Connect your wallet, choose a cause, and donate privately
                in seconds. Your identity stays yours.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end">
              <Link
                href="/donate"
                className="bg-white text-primary-blue font-bold px-8 py-4 rounded-xl hover:bg-slate-100 transition-colors shadow-lg text-center"
              >
                Donate Now
              </Link>
              <Link
                href="/create"
                className="bg-white/10 text-white font-bold px-8 py-4 rounded-xl border border-white/20 hover:bg-white/20 transition-colors text-center"
              >
                Create a Fund
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
