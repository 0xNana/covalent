"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import WalletConnect from "./WalletConnect";

const navLinks = [
  { href: "/", label: "Explore", icon: "home" },
  { href: "/donate", label: "Donate", icon: "favorite" },
  { href: "/private", label: "Private Balance", icon: "lock" },
  { href: "/create", label: "Start a Fund", icon: "add_circle" },
  { href: "/admin", label: "Dashboard", icon: "dashboard_customize" },
  { href: "/how-it-works", label: "How It Works", icon: "route" },
  { href: "/faucet", label: "Faucet", icon: "water_drop" },
];

function SidebarLink({
  href,
  label,
  icon,
  pathname,
  collapsed,
  onClick,
}: {
  href: string;
  label: string;
  icon: string;
  pathname: string;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const active = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={`group flex items-center overflow-hidden rounded-xl outline-none transition-[background-color,color,padding,width] duration-200 focus-visible:ring-2 focus-visible:ring-brand-green/30 ${
        collapsed
          ? "h-11 w-11 justify-center px-0"
          : "h-11 w-full gap-3 px-3"
      } ${
        active
          ? "bg-brand-green-light text-brand-green"
          : "text-brand-muted hover:bg-white hover:text-brand-dark"
      }`}
    >
      <span className="material-icons shrink-0 text-xl" aria-hidden="true">
        {icon}
      </span>
      <span
        className={`truncate text-sm font-semibold transition-[opacity,width,margin] duration-150 ${
          collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

export default function Navbar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-brand-border bg-white/90 backdrop-blur-xl md:hidden">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((value) => !value)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand-border text-brand-dark transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30"
            >
              <span className="material-icons" aria-hidden="true">
                {mobileOpen ? "close" : "menu"}
              </span>
            </button>

            <Link
              href="/"
              className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30"
              aria-label="Covalent home"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green to-emerald-700 shadow-soft">
                <span className="material-icons text-lg text-white" aria-hidden="true">
                  shield_lock
                </span>
              </div>
              <div>
                <p className="text-lg font-extrabold tracking-tight text-brand-dark">
                  Covalent
                </p>
              </div>
            </Link>
          </div>

          <WalletConnect />
        </div>
      </div>

      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-brand-border bg-[#fbfbf8] shadow-[0_18px_55px_rgba(15,23,42,0.08)] transition-[width] duration-200 ease-linear md:flex md:flex-col ${
          collapsed ? "md:w-24" : "md:w-[18rem]"
        }`}
        aria-label="Sidebar navigation"
      >
        <div
          className={`flex pb-3 pt-5 ${
            collapsed
              ? "flex-col items-center gap-3 px-2"
              : "items-center justify-between gap-3 px-4"
          }`}
        >
          <Link
            href="/"
            aria-label="Covalent home"
            className={`flex min-w-0 items-center gap-3 overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30 ${
              collapsed ? "justify-center" : ""
            }`}
            title={collapsed ? "Covalent home" : undefined}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green to-emerald-700 shadow-soft">
              <span className="material-icons text-lg text-white" aria-hidden="true">
                shield_lock
              </span>
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-lg font-extrabold tracking-tight text-brand-dark">
                  Covalent
                </p>
                <p className="truncate text-xs text-brand-muted">
                  Confidential fundraising on Zama
                </p>
              </div>
            ) : null}
          </Link>

          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            onClick={() => setCollapsed(!collapsed)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-border text-brand-dark transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="material-icons text-xl" aria-hidden="true">
              {collapsed ? "keyboard_tab" : "keyboard_tab_rtl"}
            </span>
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-3 pt-2">
          <div className="flex flex-1 flex-col gap-2">
            {navLinks.map((link) => (
              <SidebarLink
                key={link.href}
                href={link.href}
                label={link.label}
                icon={link.icon}
                pathname={pathname}
                collapsed={collapsed}
              />
            ))}
          </div>

        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-brand-dark/35 backdrop-blur-[2px]"
          />

          <aside className="absolute inset-y-0 left-0 flex w-[19rem] max-w-[86vw] flex-col border-r border-brand-border bg-[#fbfbf8] shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between gap-3 border-b border-brand-border px-4 py-5">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green to-emerald-700 shadow-soft">
                  <span className="material-icons text-lg text-white" aria-hidden="true">
                    shield_lock
                  </span>
                </div>
                <div>
                  <p className="text-lg font-extrabold tracking-tight text-brand-dark">
                    Covalent
                  </p>
                </div>
              </Link>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border text-brand-dark transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30"
              >
                <span className="material-icons" aria-hidden="true">
                  close
                </span>
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {navLinks.map((link) => (
                <DrawerMobileLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                  pathname={pathname}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function DrawerMobileLink({
  href,
  label,
  icon,
  pathname,
  onClick,
}: {
  href: string;
  label: string;
  icon: string;
  pathname: string;
  onClick?: () => void;
}) {
  const active = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30 ${
        active
          ? "border-brand-green bg-brand-green-light text-brand-green"
          : "border-brand-border bg-white text-brand-dark hover:bg-gray-50"
      }`}
    >
      <span className="flex items-center gap-3">
        <span className="material-icons text-lg" aria-hidden="true">
          {icon}
        </span>
        {label}
      </span>
      <span className="material-icons text-base text-brand-muted" aria-hidden="true">
        arrow_forward
      </span>
    </Link>
  );
}
