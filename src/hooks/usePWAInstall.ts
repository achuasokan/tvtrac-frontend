"use client";

import { useState, useEffect } from "react";

// The event type for beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Add the property to the global Window interface
declare global {
  interface Window {
    pwaDeferredPrompt: BeforeInstallPromptEvent | null;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if the event already fired before React hydrated
    if (typeof window !== "undefined") {
      if (window.pwaDeferredPrompt) {
        setDeferredPrompt(window.pwaDeferredPrompt);
      }

      // Listen for the custom event fired from the <head> script
      const handleReady = () => {
        setDeferredPrompt(window.pwaDeferredPrompt);
      };

      window.addEventListener("pwa-prompt-ready", handleReady);
      return () => {
        window.removeEventListener("pwa-prompt-ready", handleReady);
      };
    }
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        // Clear it once installed
        if (typeof window !== "undefined") {
          window.pwaDeferredPrompt = null;
        }
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.error("Failed to prompt install", err);
    }
  };

  return {
    isInstallable: !!deferredPrompt,
    promptInstall,
  };
}
