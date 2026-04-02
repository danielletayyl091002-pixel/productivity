import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "Productiv - Your All-in-One Productivity App",
  description: "Track habits, sleep, expenses, mood, fitness, goals, and more. With built-in calendar and dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full font-sans">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
