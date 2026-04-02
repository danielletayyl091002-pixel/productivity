"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigation } from "@/config/navigation";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-gray-200 bg-gray-50 transition-all duration-300 h-screen sticky top-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-200">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-gray-900">Productiv</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/">
            <Sparkles className="h-6 w-6 text-blue-600 mx-auto" />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navigation.map((section, i) => (
          <div key={i}>
            {section.title && !collapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
