import type { Metadata, Viewport } from "next";
import "./styles/globals.css";
import ClientShell from "./ClientShell";

export const metadata: Metadata = {
  title: "Covalent | Give Privately, Make a Difference",
  description:
    "The fundraising platform where your donations are completely private. Support causes you believe in — nobody sees how much you gave.",
};

export const viewport: Viewport = {
  themeColor: "#0b7a45",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        {/* FHE SDK — loaded via CDN to avoid bundling 1.28 MB + WASM */}
        <script
          src="https://cdn.zama.org/relayer-sdk-js/0.4.0/relayer-sdk-js.umd.cjs"
          type="text/javascript"
        />
      </head>
      <body className="font-display bg-brand-bg-warm text-brand-body min-h-screen overflow-x-hidden">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
