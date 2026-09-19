"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { X, Bug, Lightbulb, Sparkles, Send, Loader2 } from "lucide-react";

type FeedbackType = "bug" | "feature" | "general";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function FeedbackModal({ isOpen, onClose, onSuccess, onError }: FeedbackModalProps) {
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const feedbackMutation = useMutation({
    mutationFn: async (payload: {
      type: FeedbackType;
      message: string;
      context: {
        url?: string;
        userAgent?: string;
        screenResolution?: string;
        platform?: string;
        language?: string;
      };
    }) => {
      const res = await api.post("/feedback", payload);
      return res.data;
    },
    onSuccess: () => {
      setMessage("");
      setType("bug");
      setValidationError(null);
      setSubmissionError(null);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tvtrac_feedback_submitted", "true");
        } catch {
          // ignore
        }
      }
      onClose();
      if (onSuccess) {
        onSuccess("Thank you for your feedback!");
      }
    },
    onError: (err: any) => {
      let serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to send";

      if (err.response?.status === 429 || /minute|limit|submission/i.test(serverMsg)) {
        const match = serverMsg.match(/(\d+)\s*(?:minute|m)/i);
        serverMsg = match ? `Limit reached. Try in ${match[1]}m` : "Limit reached. Try later";
      }

      setSubmissionError(serverMsg);
      if (onError) {
        onError(serverMsg);
      }
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();

    if (!trimmed || trimmed.length < 5) {
      setValidationError("Please write at least 5 characters to help us understand.");
      return;
    }

    if (trimmed.length > 2000) {
      setValidationError("Message cannot exceed 2000 characters.");
      return;
    }

    setValidationError(null);
    setSubmissionError(null);

    // Automatically capture device & client context without bothering the user
    const context = {
      url: typeof window !== "undefined" ? window.location.pathname + window.location.search : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      screenResolution:
        typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : "",
      platform:
        typeof navigator !== "undefined"
          ? (navigator as any).userAgentData?.platform || navigator.platform || ""
          : "",
      language: typeof navigator !== "undefined" ? navigator.language : "",
    };

    feedbackMutation.mutate({
      type,
      message: trimmed,
      context,
    });
  };

  const isPending = feedbackMutation.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-28 sm:pb-4"
      onClick={onClose}
    >
      {/* Subtle Translucent Backdrop */}
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[3px] transition-opacity" />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-sm sm:max-w-md z-10 animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Authentic Frosted Glass Card with Asymmetric Chamfered Corners */}
        <div className="relative bg-black/50 sm:bg-zinc-950/50 backdrop-blur-3xl border border-white/20 rounded-tl-[28px] sm:rounded-tl-[32px] rounded-br-[28px] sm:rounded-br-[32px] rounded-tr-sm rounded-bl-sm shadow-[0_20px_60px_rgba(0,0,0,0.75)] overflow-hidden">
          {/* Brand Signature Fading Bottom Border Glow */}
          <div
            className="absolute inset-0 z-0 pointer-events-none rounded-tl-[28px] sm:rounded-tl-[32px] rounded-br-[28px] sm:rounded-br-[32px] rounded-tr-sm rounded-bl-sm border-[1.5px] border-transparent"
            style={{
              background:
                "linear-gradient(to top, rgba(217, 138, 89, 0.95) 0%, rgba(217, 138, 89, 0.3) 40%, transparent 75%) border-box",
              WebkitMask:
                "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "destination-out",
              maskComposite: "exclude",
            }}
          />

          {/* Specular Top Edge Highlight */}
          <div
            className="absolute top-0 inset-x-0 h-[1px] pointer-events-none z-10"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.45) 50%, transparent 100%)",
            }}
          />

          <div className="relative z-10 p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Send Feedback
                </h2>
                <p className="text-xs text-white/50 mt-0.5">
                  Found a bug or have an idea? Let us know!
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
                aria-label="Close modal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setType("bug")}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm border text-xs font-semibold transition-all cursor-pointer ${
                      type === "bug"
                        ? "bg-red-500/20 border-red-400/60 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                        : "bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    <Bug className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>Bug Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType("feature")}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm border text-xs font-semibold transition-all cursor-pointer ${
                      type === "feature"
                        ? "bg-amber-400/20 border-amber-400/60 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                        : "bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Feature</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType("general")}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm border text-xs font-semibold transition-all cursor-pointer ${
                      type === "general"
                        ? "bg-teal-400/20 border-teal-400/60 text-teal-200 shadow-[0_0_15px_rgba(45,212,191,0.2)]"
                        : "bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>General</span>
                  </button>
                </div>
              </div>

              {/* Message Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="feedback-message"
                    className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider"
                  >
                    Message
                  </label>
                  <span
                    className={`text-[11px] ${
                      message.length > 1900
                        ? "text-amber-400 font-bold"
                        : "text-zinc-500"
                    }`}
                  >
                    {message.length}/2000
                  </span>
                </div>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (validationError) setValidationError(null);
                    if (submissionError) setSubmissionError(null);
                  }}
                  rows={4}
                  maxLength={2000}
                  placeholder={
                    type === "bug"
                      ? "What happened? What screen were you on?"
                      : type === "feature"
                      ? "Describe the feature you'd love to see..."
                      : "Tell us what you think or how we can improve..."
                  }
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 backdrop-blur-xl transition-all resize-none"
                />
              </div>

              {/* Validation or Submission Error */}
              {(validationError || submissionError) && (
                <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5 flex items-center gap-2 animate-in fade-in">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 animate-pulse" />
                  <span className="font-medium">{validationError || submissionError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="cursor-pointer flex-1 px-4 py-2.5 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm text-sm font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || message.trim().length < 5}
                  className="cursor-pointer flex-1 px-4 py-2.5 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm text-sm font-bold bg-white hover:bg-zinc-100 text-black shadow-lg transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
