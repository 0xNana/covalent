"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import WalletConnect from "./WalletConnect";

const navLinks = [
  { href: "/", label: "Explore" },
  { href: "/donate", label: "Donate" },
  { href: "/private", label: "Make Private" },
  { href: "/create", label: "Create Fund" },
  { href: "/admin", label: "Admin" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-50 bg-deep-slate/80 backdrop-blur-md border-b border-white/5"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" aria-label="Covalent home">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary-blue to-primary-purple">
              <span className="material-icons text-white text-xl" aria-hidden="true">security</span>
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              Covalent
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-1" role="menubar">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                aria-current={pathname === link.href ? "page" : undefined}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-primary-blue/10 text-primary-blue"
                    : "text-slate-300 hover:text-primary-blue"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Wallet */}
          <WalletConnect />
        </div>
      </div>
    </nav>
  );
}
