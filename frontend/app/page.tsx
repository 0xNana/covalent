import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <header className="bg-white border-b border-brand-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-brand-dark leading-tight tracking-tight mb-4">
            Give privately.
            <br />
            <span className="text-brand-green">Make a difference.</span>
          </h1>
          <p className="max-w-xl mx-auto text-lg text-brand-muted mb-8 leading-relaxed">
            Covalent is the fundraising platform where your donation amount stays
            completely private. Support the causes you care about — anonymously.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/donate"
              className="btn-primary px-8 py-4 text-lg inline-flex items-center justify-center gap-2"
            >
              <span className="material-icons text-xl">favorite</span>
              Donate Now
            </Link>
            <Link
              href="/create"
              className="btn-outline px-8 py-4 text-lg inline-block text-center"
            >
              Start a Fund
            </Link>
          </div>
        </div>
      </header>

      {/* Trust bar */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: "visibility_off",
              title: "100% Private",
              desc: "Nobody sees how much you gave — not even us",
            },
            {
              icon: "verified_user",
              title: "Verified & Secure",
              desc: "Every donation is cryptographically secured",
            },
            {
              icon: "speed",
              title: "Quick & Easy",
              desc: "Donate in seconds with your connected wallet",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="card px-6 py-5 flex items-start gap-4"
            >
              <div className="w-10 h-10 bg-brand-green-light rounded-lg flex items-center justify-center text-brand-green flex-shrink-0">
                <span className="material-icons text-xl">{item.icon}</span>
              </div>
              <div>
                <h3 className="font-bold text-brand-dark text-sm">
                  {item.title}
                </h3>
                <p className="text-xs text-brand-muted mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white py-16 border-y border-brand-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-brand-dark mb-2">
              How it works
            </h2>
            <p className="text-brand-muted">
              Three simple steps to donate privately
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              {
                step: "1",
                icon: "search",
                title: "Find a cause",
                desc: "Browse funds or enter a fund ID to find a cause you want to support.",
              },
              {
                step: "2",
                icon: "lock",
                title: "Donate privately",
                desc: "Enter your amount. It's protected before it ever reaches the blockchain.",
              },
              {
                step: "3",
                icon: "favorite",
                title: "Make an impact",
                desc: "Your donation arrives safely. Nobody knows how much you gave.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-brand-green-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-icons text-brand-green text-2xl">
                    {item.icon}
                  </span>
                </div>
                <h3 className="font-bold text-brand-dark mb-2">{item.title}</h3>
                <p className="text-sm text-brand-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why privacy matters */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-brand-dark mb-4">
              Your generosity is yours alone
            </h2>
            <p className="text-brand-muted mb-6 leading-relaxed">
              Traditional donation platforms make your contributions public.
              Covalent is different — your donation amount is hidden from
              everyone, including the platform itself.
            </p>
            <ul className="space-y-3">
              {[
                "Your donation amount is never visible on-chain",
                "Your wallet is never linked to the cause publicly",
                "Only the fund total can be revealed — never individual amounts",
              ].map((text) => (
                <li key={text} className="flex items-start gap-3">
                  <span className="material-icons text-brand-green text-lg mt-0.5">
                    check_circle
                  </span>
                  <span className="text-sm text-brand-body">{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-8 text-center">
            <div className="text-6xl font-black text-brand-dark mb-2">
              ********
            </div>
            <p className="text-brand-muted text-sm mb-6">
              This is what everyone sees when you donate.
            </p>
            <div className="bg-brand-green-light rounded-lg p-4">
              <p className="text-brand-green font-bold text-sm">
                Your amount. Your business. Always.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-brand-green rounded-2xl p-10 md:p-14 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
            Ready to give privately?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto">
            Connect your wallet and make your first private donation in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/donate"
              className="bg-white text-brand-green font-bold px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              Donate Now
            </Link>
            <Link
              href="/create"
              className="bg-white/20 text-white font-bold px-8 py-4 rounded-lg border border-white/30 hover:bg-white/30 transition-colors text-center"
            >
              Start a Fund
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
