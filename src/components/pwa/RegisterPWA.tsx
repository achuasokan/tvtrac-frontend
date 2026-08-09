"use client";

import { useEffect } from "react";

export function RegisterPWA() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        console.log(
          "[PWA] Serwist Service Worker registered with scope:",
          registration.scope
        );
      } catch (error) {
        console.error(
          "[PWA] Serwist Service Worker registration error:",
          error
        );
      }
    };

    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);

      return () => {
        window.removeEventListener("load", registerSW);
      };
    }
  }, []);

  return null;
}