"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Tv, Film, Search, Bookmark, User } from "lucide-react";

const BRAND_COLOR = "#2dd4bf"; // Neon Teal (Green + Blue mix)

const navItems = [
  { name: "Shows", href: "/shows", icon: Tv, match: "/shows" },
  { name: "Movies", href: "/movies", icon: Film, match: "/movies" },
  { name: "Discover", href: "/discover", icon: Search, match: "/discover" },
  { name: "My List", href: "/lists", icon: Bookmark, match: "/lists" },
  { name: "Profile", href: "/profile", icon: User, match: "/profile" },
];

// Typewriter text — types in when becoming active, static when inactive
function TypewriterLabel({ text, isActive }: { text: string; isActive: boolean }) {
  const letters = Array.from(text);

  if (!isActive) {
    return (
      <span className="text-[10px] font-medium tracking-wide text-zinc-500 transition-colors duration-200 group-hover:text-zinc-200">
        {text}
      </span>
    );
  }

  return (
    <motion.span
      key={`active-${text}`}
      className="flex text-[10px] font-bold tracking-wide"
      style={{ color: BRAND_COLOR }}
    >
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.15, ease: "easeOut" }}
          className="inline-block"
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </motion.span>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

  if (isLoading || !user) {
    return null;
  }

  const isItemActive = (match: string, currentPath: string) => {
    if (match === "/discover" || match === "/profile") {
      return currentPath === match;
    }
    return currentPath.startsWith(match);
  };

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 bg-gradient-to-t from-black via-black/60 to-transparent pt-8 pb-safe pointer-events-none">
      <div className="max-w-md mx-auto flex items-center justify-around px-4 py-3 pointer-events-auto">
        {navItems.map((item) => {
          const isActive = isItemActive(item.match, pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="group relative flex flex-col items-center justify-center gap-1.5 cursor-pointer min-w-[52px]"
            >
              {/* Icon with hover: scale + brighten, active: scale + brand color */}
              <motion.div
                whileHover={!isActive ? { scale: 1.15, color: "#e4e4e7" } : {}}
                animate={{
                  scale: isActive ? 1.15 : 1,
                  color: isActive ? BRAND_COLOR : "#52525b",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="relative flex items-center justify-center"
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 0 : 1.8}
                  style={{
                    fill: isActive ? BRAND_COLOR : "none",
                    transition: "fill 0.25s ease",
                  }}
                />
              </motion.div>

              {/* Label — always visible */}
              <div className="h-3.5 flex items-center justify-center">
                <TypewriterLabel text={item.name} isActive={isActive} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
