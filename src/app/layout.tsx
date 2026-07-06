import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "tvtrac | Track Your Shows Seamlessly",
  description: "tvtrac helps you never lose track of where you left off.",
};

import { GoogleAuthProvider } from "@/components/auth/GoogleAuthProvider";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import { BottomNav } from "@/components/layout/BottomNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-50">
        <GoogleAuthProvider>
          <ReduxProvider>
            {children}
            <BottomNav />
          </ReduxProvider>
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
