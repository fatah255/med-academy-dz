import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import Providers from "@/components/Providers";
import { Toaster } from "sonner";
import { Toaster as HotToaster } from "react-hot-toast";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Med Academy DZ",
  description:
    "All-in-one medical learning platform for Algerian medical students. Courses, QCM, and clinical cases.",
  openGraph: {
    title: "Med Academy DZ",
    description:
      "All-in-one medical learning platform for Algerian medical students. Courses, QCM, and clinical cases.",
    url: "https://www.medacademydz.com",
    siteName: "Med Academy DZ",
    images: [
      {
        url: "https://www.medacademydz.com/logo.svg", // must be absolute URL
        width: 1200,
        height: 630,
        alt: "Med Academy DZ Logo",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <HotToaster position="top-right" />
          </ThemeProvider>
        </body>
      </html>
    </Providers>
  );
}
