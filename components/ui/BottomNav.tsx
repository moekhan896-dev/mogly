"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  // Don't show on certain pages
  const hideOn = [
    "/",
    "/auth",
    "/scan/capture",
    "/privacy",
    "/terms",
    "/results",
  ];
  
  const shouldHide = hideOn.some((path) => {
    if (path === "/results") {
      // Hide on results page only if not logged in - handled by client in results page
      return pathname.startsWith(path) && !pathname.includes("/results/");
    }
    return pathname === path || pathname.startsWith(path);
  });

  // For results page, we check client-side in results component
  // For now, show on /dashboard, /routine, /coach, /profile
  const showPages = ["/dashboard", "/routine", "/coach", "/profile"];
  const shouldShow = showPages.some((page) => pathname.startsWith(page));

  if (!shouldShow) {
    return null;
  }

  const tabs = [
    { icon: "📸", label: "Scan", href: "/scan/capture" },
    { icon: "📋", label: "Routine", href: "/routine" },
    { icon: "💬", label: "Coach", href: "/coach" },
    { icon: "👤", label: "Profile", href: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-primary border-t border-white/[0.06] z-50 backdrop-blur-sm">
      <div className="flex items-center justify-around max-w-[480px] mx-auto py-3">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href === "/scan/capture" && pathname.startsWith("/scan"));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 relative ${
                isActive
                  ? "text-accent-green"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-accent-green to-cyan-500 rounded-full" />
              )}
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
