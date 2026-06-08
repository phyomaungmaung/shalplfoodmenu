import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Gourmet Haven | Exquisite Food Menu",
  description: "Explore our curated culinary selections featuring chef-special dishes, premium desserts, and refreshing beverages.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body style={{ fontFamily: "var(--font-inter), sans-serif" }}>
        <header className="nav-header">
          <div className="container nav-container">
            <Link href="/" className="logo" style={{ display: "flex", alignItems: "center", gap: "12px" }} id="nav-logo">
              <img src="/shalpllogo.png" alt="Shalpl Logo" style={{ height: "45px", width: "auto", objectFit: "contain" }} />
              <span className="logo-accent" style={{ fontFamily: "var(--font-outfit), sans-serif" }}>Shalpl</span>Menu
            </Link>
            <nav className="nav-links">
              <Link href="/" className="nav-link" id="nav-link-home">
                Menu
              </Link>
            </nav>
          </div>
        </header>

        <main style={{ flexGrow: 1 }}>
          {children}
        </main>

        <footer className="footer">
          <div className="container">
            <p style={{ fontFamily: "var(--font-outfit), sans-serif" }}>&copy; {new Date().getFullYear()} Shalpl FoodMenu. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
