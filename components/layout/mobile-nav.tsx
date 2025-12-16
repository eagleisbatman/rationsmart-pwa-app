"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, Home, FileText, User, MessageSquare, Settings, HelpCircle, FileText as TermsIcon, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

const navItems = [
  { href: "/cattle-info", label: "Cattle Info", icon: Home },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();

  // Don't show on auth pages
  if (pathname?.startsWith("/login") || pathname?.startsWith("/register") || pathname?.startsWith("/welcome") || pathname?.startsWith("/splash") || pathname?.startsWith("/forgot-pin")) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background lg:hidden safe-area-inset-bottom">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Button
              key={item.href}
              variant={isActive ? "default" : "ghost"}
              size="icon"
              className="flex flex-col h-auto py-2 min-h-[44px] min-w-[44px] touch-manipulation"
              onClick={() => router.push(item.href)}
              aria-label={item.label}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Button>
          );
        })}
        {user?.is_admin && (
          <Button
            variant={pathname?.startsWith("/admin") ? "default" : "ghost"}
            size="icon"
            className="flex flex-col h-auto py-2 min-h-[44px] min-w-[44px] touch-manipulation"
            onClick={() => router.push("/admin")}
            aria-label="Admin"
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs mt-1">Admin</span>
          </Button>
        )}
      </div>
    </div>
  );
}

