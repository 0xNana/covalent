"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Providers = dynamic(() => import("./providers"), { ssr: false });
const Navbar = dynamic(() => import("./components/Navbar"), { ssr: false });
const Footer = dynamic(() => import("./components/Footer"), { ssr: false });
const WalletConnect = dynamic(() => import("./components/WalletConnect"), {
  ssr: false,
});
const NetworkBanner = dynamic(() => import("./components/NetworkBanner"), {
  ssr: false,
});

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const storedValue = window.localStorage.getItem("covalent_sidebar_collapsed");
    if (storedValue === "true") {
      setSidebarCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "covalent_sidebar_collapsed",
      String(sidebarCollapsed),
    );
  }, [sidebarCollapsed]);

  return (
    <Providers>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-dark focus:shadow-soft"
      >
        Skip to main content
      </a>
      <div className="min-h-screen bg-brand-bg-warm">
        <Navbar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
        <div
          className={`transition-[padding] duration-200 ease-linear md:min-h-screen ${
            sidebarCollapsed ? "md:pl-24" : "md:pl-[18rem]"
          }`}
        >
          <header className="sticky top-0 z-30 hidden border-b border-brand-border bg-white/85 backdrop-blur-xl md:block">
            <div className="flex min-h-16 items-center justify-end px-6 py-3 lg:px-8">
              <WalletConnect />
            </div>
          </header>
          <NetworkBanner />
          <main id="main-content">{children}</main>
          <Footer />
        </div>
      </div>
    </Providers>
  );
}
