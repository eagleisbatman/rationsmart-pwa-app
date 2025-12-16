"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, FileText, User, MessageSquare, Settings } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/cattle-info", label: "Cattle Info", icon: Home },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: User },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();

  // Don't show on auth pages
  if (pathname?.startsWith("/login") || pathname?.startsWith("/register") || pathname?.startsWith("/welcome") || pathname?.startsWith("/splash") || pathname?.startsWith("/forgot-pin")) {
    return null;
  }

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r">
      <div className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Button
              key={item.href}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                isActive && "bg-primary text-primary-foreground"
              )}
              onClick={() => router.push(item.href)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
        {user?.is_admin && (
          <Button
            variant={pathname?.startsWith("/admin") ? "default" : "ghost"}
            className={cn(
              "w-full justify-start",
              pathname?.startsWith("/admin") && "bg-primary text-primary-foreground"
            )}
            onClick={() => router.push("/admin")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Admin Panel
          </Button>
        )}
      </div>
    </aside>
  );
}

