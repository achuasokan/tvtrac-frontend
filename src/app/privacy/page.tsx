import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — tvtrac.",
  description: "Learn how tvtrac collects, uses, and protects your personal data.",
};

const LAST_UPDATED = "August 20, 2026";

const sections = [
  {
    title: "1. Information We Collect",
    content: [
      "**Account Information:** When you sign in with Google, we receive your name, email address, and profile picture from Google's OAuth service. We do not receive or store your Google password.",
      "**Usage Data:** We collect data about which shows and movies you track, your watch status, ratings, and list activity. This is the core data needed to provide the service.",
      "**Device & Log Data:** We may collect basic technical data such as browser type, device type, and IP address for security and performance monitoring.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    content: [
      "To provide and operate the tvtrac service — tracking your shows, movies, and watch history.",
      "To authenticate your identity securely via Google OAuth.",
      "To personalize your experience (e.g., recommendations, your personal watchlist).",
      "To improve the app's performance, fix bugs, and develop new features.",
      "We do **not** sell, rent, or share your personal data with third-party advertisers.",
    ],
  },
  {
    title: "3. Google OAuth & Third-Party Services",
    content: [
      "tvtrac uses Google OAuth 2.0 for authentication. By signing in with Google, you agree to Google's Privacy Policy (policies.google.com/privacy).",
      "We use TMDB (The Movie Database) to fetch show and movie metadata. No personal data is sent to TMDB.",
      "Profile images may be stored via Cloudinary for optimized delivery. Only images you explicitly upload are stored.",
    ],
  },
  {
    title: "4. Data Storage & Security",
    content: [
      "We use reasonable technical and organizational measures designed to protect your information against unauthorized access, loss, misuse, or alteration. We use industry-standard encryption for data in transit (HTTPS/TLS).",
      "We retain your data for as long as your account is active. You may request deletion at any time by contacting us.",
      "While we take security seriously, no system is 100% secure. We encourage you to use a strong Google account password.",
    ],
  },
  {
    title: "5. Cookies & Local Storage",
    content: [
      "tvtrac uses an essential **HTTP-only cookie** to securely maintain your authentication session. This cookie cannot be accessed by client-side scripts.",
      "We use **localStorage** on your device solely to save your UI preferences (e.g., your trailer autoplay and data saver settings).",
      "We currently **do not use** any third-party tracking, analytics, or advertising cookies.",
      "You can clear cookies and local storage via your browser settings, though this will log you out and reset your preferences.",
    ],
  },
  {
    title: "6. Your Rights",
    content: [
      "**Access:** You can view all your data within the app (profile, watchlist, ratings).",
      "**Deletion:** You can delete your account and all associated data by contacting us.",
      "**Portability:** Contact us to request an export of your data.",
      "If you are in the EU/EEA, you have additional rights under GDPR including the right to object to processing.",
    ],
  },
  {
    title: "7. Children's Privacy",
    content: [
      "tvtrac is not directed at children under 13. We do not knowingly collect data from children. If you believe a child has provided us data, please contact us immediately.",
    ],
  },
  {
    title: "8. Changes to This Policy",
    content: [
      "We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the 'Last Updated' date at the top of this page.",
    ],
  },
];

function renderContent(text: string) {
  // Bold markdown-style **text**
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="text-slate-200 font-semibold">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function PrivacyPage() {
  return (
    <main className="flex-1 min-h-screen bg-[#050505] pb-32">
      {/* Header */}
      <div className="w-full border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-5 py-10 sm:py-14">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors mb-8 tracking-wide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            Back to tvtrac.
          </Link>

          <div className="flex items-start gap-4">
            <div
              className="mt-1 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Privacy Policy</h1>
              <p className="text-sm text-zinc-500 mt-1">Last updated: {LAST_UPDATED}</p>
            </div>
          </div>

          <p className="mt-6 text-sm text-zinc-400 leading-relaxed">
            tvtrac. ("we", "us", "our") is committed to protecting your privacy. This policy explains what data
            we collect when you use tvtrac, how we use it, and what choices you have.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-2xl mx-auto px-5 py-10 flex flex-col gap-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-base font-semibold text-white mb-4 tracking-tight">
              {section.title}
            </h2>
            <ul className="flex flex-col gap-3">
              {section.content.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-zinc-400 leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#2dd4bf" }} />
                  <span>{renderContent(item)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* Contact */}
        <section className="rounded-2xl p-5" style={{ background: "rgba(45,212,191,0.05)", border: "1px solid rgba(45,212,191,0.12)" }}>
          <h2 className="text-base font-semibold text-white mb-2 tracking-tight">9. Contact Us</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            If you have questions about this Privacy Policy or want to exercise your rights, please contact us at{" "}
            <a
              href="mailto:privacy@tvtrac.fun"
              className="underline underline-offset-2 transition-colors"
              style={{ color: "#2dd4bf" }}
            >
              privacy@tvtrac.fun
            </a>
            .
          </p>
        </section>

        {/* Footer nav */}
        <div className="flex items-center gap-4 pt-4 border-t border-white/[0.06]">
          <Link href="/terms" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Terms of Service →
          </Link>
        </div>
      </div>
    </main>
  );
}
