import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { MobileNav } from "@/components/MobileNav";
import { PRODUCTS } from "@/lib/products";
import { getProductRepos } from "@/lib/local";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Whitebox",
  description: "AI agent ops dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const localRepos = getProductRepos();
  const productGroups = PRODUCTS.map(p => ({
    id: p.id,
    name: p.name,
    color: p.color,
    boardNumber: p.boardNumber,
    repos: p.repos.map(r => ({
      name: r.name,
      url: `https://github.com/${r.owner}/${r.name}`,
    })),
  }));

  const projectsForNav = localRepos.map(r => ({ name: r.name, url: `https://github.com/${r.owner}/${r.name}` }));

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`} style={{ margin: 0, background: "#111111" }}>
        <LanguageProvider>
          <MobileNav productGroups={productGroups} projects={projectsForNav} />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
