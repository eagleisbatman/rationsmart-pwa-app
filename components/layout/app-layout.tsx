"use client";

import { ReactNode } from "react";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { DesktopSidebar } from "./desktop-sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 pb-16 lg:pb-0">
        <DesktopSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-safe">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

