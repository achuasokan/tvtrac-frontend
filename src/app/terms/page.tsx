import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — tvtrac.",
  description: "Read the Terms of Service for using the tvtrac application.",
};

const LAST_UPDATED = "August 20, 2026";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: [
      "By accessing or using tvtrac. (\"the Service\"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.",
      "You must be at least 13 years old to use tvtrac. By using the Service, you represent that you meet this requirement.",
    ],
  },
  {
    title: "2. Description of Service",
    content: [
      "tvtrac is a personal entertainment tracking application that allows you to track TV shows, movies, watch statuses, ratings, and personal watchlists.",
      "Show and movie metadata is sourced from TMDB (The Movie Database). tvtrac is not affiliated with, endorsed by, or connected to any streaming platform.",
      "The Service is provided as-is. Features may change, be added, or removed at any time.",
    ],
  },
  {
    title: "3. Your Account",
    content: [
      "You sign in using your Google account. You are responsible for maintaining the security of your Google credentials.",
      "You are responsible for all activity that occurs under your account.",
      "You may not share your account with others or use another person's account without permission.",
      "We reserve the right to suspend or terminate accounts that violate these Terms.",
    ],
  },
  {
    title: "4. Acceptable Use",
    content: [
      "You agree not to misuse the Service — including attempting to access systems, data, or accounts you are not authorized to access.",
      "You agree not to use the Service for any unlawful purpose or in violation of any applicable laws.",
      "You agree not to attempt to reverse-engineer, scrape, or disrupt the Service.",
      "You agree not to upload content that is offensive, defamatory, or violates any third-party rights (e.g. profile photos).",
    ],
  },
  {
    title: "5. Intellectual Property",
    content: [
      "tvtrac and its original content, features, and design are owned by tvtrac. and protected by copyright laws.",
      "Show and movie data, posters, and metadata are provided by TMDB. (See the TMDB Attribution section below for more details).",
      "You retain your rights in content and information you provide to the Service, subject to the rights and licenses necessary for us to operate the Service."
    ],
  },
  {
    title: "6. Disclaimers",
    content: [
      'The Service is provided on an "as is" and "as available" basis without warranties of any kind.',
      "We do not guarantee that the Service will be uninterrupted, error-free, or that data will never be lost.",
      "tvtrac is a personal tracking tool and does not provide access to any streaming content.",
    ],
  },
  {
    title: "7. Limitation of Liability",
    content: [
      "To the fullest extent permitted by law, tvtrac shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.",
      "Our total liability to you for any claim arising from the Service shall not exceed the amount you paid us in the last 12 months (if any).",
    ],
  },
  {
    title: "8. Termination",
    content: [
      "You may stop using the Service at any time. You may request deletion of your account and data by contacting us.",
      "We reserve the right to suspend or terminate your access if you violate these Terms, with or without prior notice.",
    ],
  },
  {
    title: "9. Changes to Terms",
    content: [
      "We may update these Terms from time to time. We will notify you of significant changes by updating the 'Last Updated' date.",
      "Continued use of the Service after changes constitutes your acceptance of the updated Terms.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="flex-1 min-h-screen bg-[#050505] pb-32">
      {/* Header */}
      <div className="w-full border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-5 py-10 sm:py-14">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors mb-8 tracking-wide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back to tvtrac.
          </Link>

          <div className="flex items-start gap-4">
            <div
              className="mt-1 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Terms of Service</h1>
              <p className="text-sm text-zinc-500 mt-1">Last updated: {LAST_UPDATED}</p>
            </div>
          </div>

          <p className="mt-6 text-sm text-zinc-400 leading-relaxed">
            Please read these Terms of Service carefully before using tvtrac. These terms govern your access
            to and use of the tvtrac application and services.
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
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* Contact */}
        <section className="rounded-2xl p-5" style={{ background: "rgba(45,212,191,0.05)", border: "1px solid rgba(45,212,191,0.12)" }}>
          <h2 className="text-base font-semibold text-white mb-2 tracking-tight">11. Contact Us</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            For questions about these Terms, contact us at{" "}
            <a
              href="mailto:legal@tvtrac.fun"
              className="underline underline-offset-2 transition-colors"
              style={{ color: "#2dd4bf" }}
            >
              legal@tvtrac.fun
            </a>
            .
          </p>
        </section>

        {/* TMDB Attribution */}
        <section className="rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left" style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex-shrink-0 mt-1">
            {/* Official TMDB Logo */}
            <img 
              src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_1-5bdc75aaebeb75dc7ae79426ddd9be3b2be1e342510f8202baf6bffa71d7f5c4.svg" 
              alt="TMDB Logo" 
              width={60} 
              height={60} 
            />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white mb-1 tracking-tight">TMDB Attribution</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              tvtrac uses the{" "}
              <a 
                href="https://www.themoviedb.org/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#2dd4bf] hover:underline font-medium"
              >
                TMDB
              </a>{" "}
              API for show and movie data, posters, and metadata. However, this product is not endorsed or certified by TMDB.
            </p>
          </div>
        </section>

        {/* Footer nav */}
        <div className="flex items-center gap-4 pt-4 border-t border-white/[0.06]">
          <Link href="/privacy" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Privacy Policy →
          </Link>
        </div>
      </div>
    </main>
  );
}
