"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import WalletConnect from "./WalletConnect";
import { hasCreatedFunds } from "@/app/lib/contract";

const navLinks = [
  { href: "/", label: "Explore" },
  { href: "/donate", label: "Donate" },
  { href: "/create", label: "Start a Fund" },
  { href: "/admin", label: "Admin", creatorsOnly: true },
];

export default function Navbar() {
  const pathname = usePathname();
  const { address } = useAccount();
  const showAdmin = hasCreatedFunds(address);

  const visibleNavLinks = navLinks.filter(
    (link) => !("creatorsOnly" in link && link.creatorsOnly) || showAdmin
  );

  return (
    <nav
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-brand-border"
      aria-label="Main navigation"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="Covalent home"
          >
            <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center">
              <span
                className="material-icons text-white text-lg"
                aria-hidden="true"
              >
                favorite
              </span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-brand-dark">
              Covalent
            </span>
          </Link>

          {/* Nav Links */}
          <div
            className="hidden md:flex items-center space-x-1"
            role="menubar"
          >
            {visibleNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                aria-current={pathname === link.href ? "page" : undefined}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-brand-green-light text-brand-green font-bold"
                    : "text-brand-muted hover:text-brand-dark hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Faucet | Wallet */}
          <div className="flex items-center gap-3">
            <Link
              href="/faucet"
              aria-current={pathname === "/faucet" ? "page" : undefined}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/faucet"
                  ? "bg-brand-green-light text-brand-green font-bold"
                  : "text-brand-muted hover:text-brand-dark hover:bg-gray-50"
              }`}
              aria-label="Test USDT Faucet"
            >
              <span className="material-icons text-lg" aria-hidden="true">
                water_drop
              </span>
              <span className="hidden sm:inline">Faucet</span>
            </Link>
            <span className="text-brand-border font-light" aria-hidden="true">
              |
            </span>
            <WalletConnect />
          </div>
        </div>
      </div>
    </nav>
  );
}
