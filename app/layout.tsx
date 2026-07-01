import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import ThemeToggle from "./components/ThemeToggle";
import "./globals.css";

// Runs before paint so a stored dark preference never flashes light.
const themeInit = `try{var t=localStorage.getItem("theme");document.documentElement.classList.toggle("dark",t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))}catch(e){}`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pantry DB",
  description: "Free food sources in the Cleveland, Ohio area",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-slate-200 dark:border-slate-800">
          <nav className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6">
            <Link href="/" className="text-base font-bold sm:text-lg">
              Pantry DB
            </Link>
            <span className="hidden text-sm opacity-60 sm:inline">Free food near you — Cleveland, OH</span>
            <ThemeToggle />
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-6">{children}</main>
      </body>
    </html>
  );
}
