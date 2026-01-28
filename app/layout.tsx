import type React from "react";
import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Navigation } from "@/components/navigation";
import { Suspense } from "react";
import { AuthProvider } from "@/contexts/auth-provider";
import { AuthGuard } from "@/components/auth-guard";
import { AccessibilityProvider } from "@/contexts/accessibility-provider";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fredoka",
});

export const metadata: Metadata = {
  title: "MathMania - Welcome to the World of Math",
  description: "Fun math learning for elementary school children",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fredoka.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <AccessibilityProvider>
              <Navigation />
              <AuthGuard>
                <main className="min-h-screen">{children}</main>
              </AuthGuard>
              <Analytics />
            </AccessibilityProvider>
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
