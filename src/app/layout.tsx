import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#050505",
  // viewport-fit=cover ensures the app fills the full screen on notched phones (iPhone X+)
  // and the bottom nav sits correctly above the home indicator
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "tvtrac | Track Your Shows Seamlessly",
  description: "tvtrac helps you never lose track of where you left off.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  // iOS Safari PWA behaviour
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "tvtrac",
    startupImage: ["/apple-touch-icon.png"],
  },
  // Open Graph for link previews
  openGraph: {
    type: "website",
    title: "tvtrac | Track Your Shows Seamlessly",
    description: "tvtrac helps you never lose track of where you left off.",
    siteName: "tvtrac",
  },
};

import { GoogleAuthProvider } from "@/components/auth/GoogleAuthProvider";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { BottomNav } from "@/components/layout/BottomNav";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.pwaDeferredPrompt = null;
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                window.pwaDeferredPrompt = e;
                window.dispatchEvent(new Event('pwa-prompt-ready'));
              });
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-50 outline-none">
        <GoogleAuthProvider>
          <ReduxProvider>
            <QueryProvider>
              {children}
              <BottomNav />
              {/* PWA install prompt — appears after 3s if app is installable */}
              <InstallPrompt />
            </QueryProvider>
          </ReduxProvider>
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
