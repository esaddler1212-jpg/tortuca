import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ClerkShell } from "@/components/ClerkShell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tortuca — Short Film Streaming",
    template: "%s | Tortuca",
  },
  description:
    "Stream award-winning short films. Festival favorites, emerging directors, and stories under twenty minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <ClerkShell>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </ClerkShell>
      </body>
    </html>
  );
}
