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
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' }
    ],
  },
  manifest: '/site.webmanifest',
};

import { GoogleAuthProvider } from "@/components/auth/GoogleAuthProvider";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { BottomNav } from "@/components/layout/BottomNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased outline-none`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-50 outline-none">
        <GoogleAuthProvider>
          <ReduxProvider>
            <QueryProvider>
              {children}
              <BottomNav />
            </QueryProvider>
          </ReduxProvider>
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
