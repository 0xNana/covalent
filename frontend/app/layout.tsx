import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./styles/globals.css";
import ClientShell from "./ClientShell";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Covalent | Give Privately, Make a Difference",
  description:
    "The fundraising platform where your donations are completely private. Support causes you believe in — nobody sees how much you gave.",
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
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        {/* Zama FHE SDK — loaded via CDN to avoid bundling 1.28 MB + WASM */}
        <script
          src="https://cdn.zama.org/relayer-sdk-js/0.4.0/relayer-sdk-js.umd.cjs"
          type="text/javascript"
        />
      </head>
      <body
        className={`${manrope.variable} ${jetbrains.variable} font-display bg-brand-bg-warm text-brand-body min-h-screen`}
      >
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
