"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { icon: "🏠", label: "Home", href: "/dashboard" },
    { icon: "📸", label: "Scan", href: "/scan" },
    { icon: "📋", label: "Routine", href: "/routine" },
    { icon: "💬", label: "Coach", href: "/coach" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-primary border-t border-white/[0.06] px-4 py-2 pb-safe">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href === "/scan" && pathname.startsWith("/scan")) ||
            (tab.href === "/dashboard" && pathname === "/dashboard");

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? "text-accent-green"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
