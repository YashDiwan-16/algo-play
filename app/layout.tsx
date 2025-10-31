import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Background from "@/components/background";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Navbar } from "@/components/layout/navbar";
import Provider from "@/components/Provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Algo Game Hub",
  description: "A hub for all your gaming needs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="dark" lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Background>
          <ErrorBoundary>
            <Provider>
              <Navbar
                navItems={[
                  { title: "Home", href: "/" },
                  { title: "About", href: "/about" },
                  { title: "Games", href: "/games" },
                  { title: "Editor", href: "/editor" },
                  { title: "Market Place", href: "/marketplace" },
                  { title: "Contact", href: "/contact" },
                ]}
              />
              {children}
            </Provider>
          </ErrorBoundary>
          <Toaster />
        </Background>
      </body>
    </html>
  );
}
