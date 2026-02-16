import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-brand-border mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center">
                <span className="material-icons text-white text-lg">
                  favorite
                </span>
              </div>
              <span className="text-xl font-extrabold text-brand-dark">
                Covalent
              </span>
            </div>
            <p className="text-sm text-brand-muted leading-relaxed">
              The fundraising platform where your donations stay private.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-bold text-brand-dark mb-4 text-sm">
              Platform
            </h4>
            <ul className="space-y-3 text-sm text-brand-muted">
              <li>
                <Link
                  href="/donate"
                  className="hover:text-brand-green transition-colors"
                >
                  Donate
                </Link>
              </li>
              <li>
                <Link
                  href="/create"
                  className="hover:text-brand-green transition-colors"
                >
                  Start a Fund
                </Link>
              </li>
              <li>
                <Link
                  href="/private"
                  className="hover:text-brand-green transition-colors"
                >
                  Make Private
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-bold text-brand-dark mb-4 text-sm">About</h4>
            <ul className="space-y-3 text-sm text-brand-muted">
              <li>
                <span className="cursor-default">How It Works</span>
              </li>
              <li>
                <span className="cursor-default">Privacy</span>
              </li>
              <li>
                <span className="cursor-default">Security</span>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-brand-dark mb-4 text-sm">Support</h4>
            <ul className="space-y-3 text-sm text-brand-muted">
              <li>
                <span className="cursor-default">Help Center</span>
              </li>
              <li>
                <span className="cursor-default">Contact Us</span>
              </li>
              <li>
                <span className="cursor-default">Documentation</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-brand-border mt-10 pt-6 text-center text-xs text-brand-muted">
          &copy; 2026 Covalent. All rights reserved. Your privacy is our
          priority.
        </div>
      </div>
    </footer>
  );
}
