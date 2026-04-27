import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CurrencyProvider } from "@/components/CurrencyContext";
import AuthWrapper from "@/components/AuthWrapper";
import { AuthProvider } from "@/lib/AuthContext";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AXIS CAP | Institutional Research Terminal",
  description: "Advanced financial research and portfolio management.",
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
              {children}
            </AuthWrapper>
          </CurrencyProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
