import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-deep-slate border-t border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary-blue to-primary-purple">
                <span className="material-icons text-white text-xl">
                  security
                </span>
              </div>
              <span className="text-2xl font-extrabold text-white tracking-tight">
                Covalent
              </span>
            </div>
            <p className="text-slate-400 mb-6">
              The privacy-first donation platform. Give anonymously
              to causes you care about.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-bold text-white mb-6">Platform</h4>
            <ul className="space-y-4 text-slate-400">
              <li>
                <Link
                  href="/donate"
                  className="hover:text-primary-blue transition-colors"
                >
                  Donate
                </Link>
              </li>
              <li>
                <Link
                  href="/create"
                  className="hover:text-primary-blue transition-colors"
                >
                  Create Fund
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="hover:text-primary-blue transition-colors"
                >
                  Admin Panel
                </Link>
              </li>
            </ul>
          </div>

          {/* Technology */}
          <div>
            <h4 className="font-bold text-white mb-6">Technology</h4>
            <ul className="space-y-4 text-slate-400">
              <li>
                <span className="hover:text-primary-blue transition-colors cursor-default">
                  End-to-End Encryption
                </span>
              </li>
              <li>
                <span className="hover:text-primary-blue transition-colors cursor-default">
                  Blockchain Verified
                </span>
              </li>
              <li>
                <span className="hover:text-primary-blue transition-colors cursor-default">
                  Smart Contracts
                </span>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold text-white mb-6">Resources</h4>
            <ul className="space-y-4 text-slate-400">
              <li>
                <span className="hover:text-primary-blue transition-colors cursor-default">
                  Documentation
                </span>
              </li>
              <li>
                <span className="hover:text-primary-blue transition-colors cursor-default">
                  Privacy Model
                </span>
              </li>
              <li>
                <span className="hover:text-primary-blue transition-colors cursor-default">
                  Security Audit
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>&copy; 2026 Covalent Protocol. All rights reserved.</p>
          <div className="flex gap-6 font-mono text-xs opacity-70">
            <span>PRIVACY_FIRST</span>
            <span>ENCRYPTED</span>
            <span>ANONYMOUS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
