import type { Metadata } from "next";
import "./globals.css";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightRail from "@/components/layout/RightRail";

export const metadata: Metadata = {
  title: "Fluent — Your Productivity System",
  description: "Pages, tasks, and finance in one place. Offline-first.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full" style={{ margin: 0 }}>
        <div style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          background: 'var(--bg-secondary)'
        }}>
          <LeftSidebar />
          <main style={{ flex: 1, overflow: 'auto' }}>
            {children}
          </main>
          <RightRail />
        </div>
      </body>
    </html>
  );
}
