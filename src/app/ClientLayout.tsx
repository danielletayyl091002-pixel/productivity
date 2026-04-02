"use client";

import { useState } from "react";
import { AppProviders } from "@/contexts/AppContext";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import MobileNav from "@/components/layout/MobileNav";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <AppProviders>
      <div className="flex h-full">
        <Sidebar />
        <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
          <TopBar onMenuClick={() => setMobileNavOpen(true)} />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </AppProviders>
  );
}
