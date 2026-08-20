import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GoogleAuthProvider } from "@/components/auth/GoogleAuthProvider";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { BottomNav } from "@/components/layout/BottomNav";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { RegisterPWA } from "@/components/pwa/RegisterPWA";
import { siteConfig } from "@/lib/constants/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://tvtrac-frontend.vercel.app"),
  title: siteConfig.name,
  description: siteConfig.description,
  verification: {
    google: "tI5BK4hwKuMmhx0NqXCBpW7Atpc8_1WtCFwmYSPGXLQ",
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteConfig.name,
    startupImage: ["/apple-touch-icon.png"],
  },
  openGraph: {
    type: "website",
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
};

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
        <RegisterPWA />
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
