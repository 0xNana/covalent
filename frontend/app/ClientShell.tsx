"use client";

import dynamic from "next/dynamic";

const Providers = dynamic(() => import("./providers"), { ssr: false });
const Navbar = dynamic(() => import("./components/Navbar"), { ssr: false });
const Footer = dynamic(() => import("./components/Footer"), { ssr: false });

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </Providers>
  );
}
