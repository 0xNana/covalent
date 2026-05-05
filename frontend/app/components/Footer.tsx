import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-brand-border bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green to-emerald-700 shadow-soft">
                <span className="material-icons text-lg text-white">shield_lock</span>
              </div>
              <div>
                <p className="text-lg font-extrabold text-brand-dark">Covalent</p>
                <p className="text-xs text-brand-muted">Confidential fundraising on Zama</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-brand-muted">
              Public campaign discovery, private donations, and proof-verified
              aggregate reveals in one fundraising workflow.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold text-brand-dark">Product</h4>
            <ul className="space-y-3 text-sm text-brand-muted">
              <li>
                <Link href="/donate" className="transition-colors hover:text-brand-green">
                  Browse campaigns
                </Link>
              </li>
              <li>
                <Link href="/create" className="transition-colors hover:text-brand-green">
                  Start a campaign
                </Link>
              </li>
              <li>
                <Link href="/private" className="transition-colors hover:text-brand-green">
                  Private balance
                </Link>
              </li>
              <li>
                <Link href="/admin" className="transition-colors hover:text-brand-green">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold text-brand-dark">Trust</h4>
            <ul className="space-y-3 text-sm text-brand-muted">
              <li>
                <Link href="/how-it-works" className="transition-colors hover:text-brand-green">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition-colors hover:text-brand-green">
                  Privacy model
                </Link>
              </li>
              <li>
                <Link href="/help" className="transition-colors hover:text-brand-green">
                  Help & support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold text-brand-dark">Demo Flow</h4>
            <ul className="space-y-3 text-sm text-brand-muted">
              <li>
                <Link href="/faucet" className="transition-colors hover:text-brand-green">
                  1. Claim test USDT
                </Link>
              </li>
              <li>
                <Link href="/private" className="transition-colors hover:text-brand-green">
                  2. Shield to cUSDT
                </Link>
              </li>
              <li>
                <Link href="/donate" className="transition-colors hover:text-brand-green">
                  3. Donate privately
                </Link>
              </li>
              <li>
                <Link href="/admin" className="transition-colors hover:text-brand-green">
                  4. Reveal & withdraw
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-brand-border pt-6 text-center text-xs text-brand-muted">
          © 2026 Covalent. Confidential giving with proof-verified campaign totals.
        </div>
      </div>
    </footer>
  );
}
