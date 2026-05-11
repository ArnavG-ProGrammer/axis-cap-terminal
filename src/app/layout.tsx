import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CurrencyProvider } from "@/components/CurrencyContext";
import AuthWrapper from "@/components/AuthWrapper";
import { AuthProvider } from "@/lib/AuthContext";
import CookieConsent from "@/components/CookieConsent";
import FeedbackWidget from "@/components/FeedbackWidget";
import Analytics from "@/components/Analytics";
import InstallPrompt from "@/components/InstallPrompt";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: '#00d4a0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: "AXIS CAP | Institutional Quantitative Terminal",
  description: "Advanced institutional financial research, DCF valuation, algorithmic backtesting, and portfolio management.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AXIS CAP",
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  },
  keywords: ["finance", "terminal", "institutional", "quantitative", "stock market", "crypto", "forex", "DCF", "backtest"],
  authors: [{ name: "Arnav Goyal" }],
  openGraph: {
    title: "AXIS CAP | Institutional Research Terminal",
    description: "Advanced institutional financial research and algorithmic backtesting.",
    url: "https://axiscap.com",
    siteName: "AXIS CAP",
    images: [
      {
        url: "/logo_transparent.png",
        width: 800,
        height: 600,
        alt: "AXIS CAP Terminal",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AXIS CAP | Institutional Terminal",
    description: "Advanced quantitative finance and algorithmic backtesting.",
    images: ["/logo_transparent.png"],
  },
  verification: {
    google: "mock_google_search_console_verification_token_here",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#000000] text-white antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <CurrencyProvider>
            <AuthWrapper>
              <Analytics />
              {children}
              <FeedbackWidget />
              <CookieConsent />
              <InstallPrompt />
            </AuthWrapper>
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
