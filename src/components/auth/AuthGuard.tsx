"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchCurrentUser } from "@/store/slices/authSlice";

const PUBLIC_PATHS = ["/", "/offline"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  // 1. Fetch current user from backend on initial mount
  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  // 2. Client-side Route Protection
  useEffect(() => {
    if (!isLoading) {
      // If user is NOT logged in and trying to access a protected route -> redirect to login
      if (!user && !isPublicPath) {
        router.replace("/");
      }
      // If user IS logged in and sitting on the login page -> redirect to discover
      if (user && isPublicPath && pathname === "/") {
        router.push("/discover");
      }
    }
  }, [user, isLoading, isPublicPath, pathname, router]);

  // Show a full-screen sleek loader while checking authentication state
  if (isLoading && !isPublicPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Prevent rendering protected content if unauthenticated
  if (!user && !isPublicPath) {
    return null;
  }

  return <>{children}</>;
}
