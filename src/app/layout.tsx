import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { ensureUserInDb } from "@/lib/session";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Cafe Connect",
  description: "Rank coffee shops, share recommendations, discover great coffee.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await ensureUserInDb();

  return (
    <html lang="en">
      <body className={`${dmSans.variable} font-sans`}>
        <Nav />
        <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
