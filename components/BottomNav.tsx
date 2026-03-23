"use client";

import Link from "next/link";

interface BottomNavProps {
  active: "scan" | "routine" | "coach" | "profile";
}

export function BottomNav({ active }: BottomNavProps) {
  const tabs = [
    { id: "scan", label: "Scan", icon: "📸", href: "/scan/capture" },
    { id: "routine", label: "Routine", icon: "📋", href: "/routine" },
    { id: "coach", label: "Coach", icon: "💬", href: "/coach" },
    { id: "profile", label: "Profile", icon: "👤", href: "/dashboard" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-primary/95 backdrop-blur border-t border-white/[0.06]">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex-1 flex flex-col items-center justify-center py-4 text-xs font-medium transition-colors ${
              active === tab.id
                ? "text-accent-green"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <span className="text-xl mb-1">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
