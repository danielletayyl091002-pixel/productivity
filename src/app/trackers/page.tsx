"use client";

import Link from "next/link";
import { trackers } from "@/config/trackerRegistry";
import { cn } from "@/lib/utils";

export default function TrackersPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">All Trackers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {trackers.map((tracker) => {
          const Icon = tracker.icon;
          return (
            <Link key={tracker.id} href={tracker.href}>
              <div className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className={cn("inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white mb-3", tracker.gradient)}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{tracker.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{tracker.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
