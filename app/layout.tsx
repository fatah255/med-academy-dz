import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import NavbarClient from "@/components/NavbarClient";
import { Toaster } from "sonner";
import { Toaster as HotToaster } from "react-hot-toast";
import Providers from "../components/Providers";
import "simplebar-react/dist/simplebar.min.css";
import "reactflow/dist/style.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Med Academy",
  description: "Med Academy - Your Gateway to Medical Knowledge",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased scroll-smooth`}
        >
          <main className="container mx-auto px-4 sm:px-6 lg:px-8">
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <NavbarClient />
              {children}
              <Toaster />
              <HotToaster position="top-right" />
            </ThemeProvider>
          </main>
        </body>
      </html>
    </Providers>
  );
}
