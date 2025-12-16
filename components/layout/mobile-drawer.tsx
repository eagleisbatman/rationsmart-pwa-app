"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  Home, 
  FileText, 
  User, 
  MessageSquare, 
  Settings, 
  HelpCircle, 
  LogOut 
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { Logo } from "@/components/icons";

const drawerNavItems = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/reports", label: "Feed Reports", icon: FileText },
  { href: "/feedback", label: "Feedback", icon: MessageSquare },
];

export function MobileDrawer() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  // Don't show on auth pages
  if (pathname?.startsWith("/login") || pathname?.startsWith("/register") || pathname?.startsWith("/welcome") || pathname?.startsWith("/splash") || pathname?.startsWith("/forgot-pin")) {
    return null;
  }

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden min-h-[44px] min-w-[44px] touch-manipulation"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Logo size="md" variant="icon" />
            <SheetTitle className="text-lg font-semibold">Menu</SheetTitle>
          </div>
          {user && (
            <div className="mt-2 text-sm text-muted-foreground">
              <p className="font-medium">{user.name}</p>
              <p className="text-xs">{user.email_id}</p>
            </div>
          )}
        </SheetHeader>
        <div className="flex flex-col h-[calc(100vh-120px)] overflow-y-auto">
          <nav className="flex-1 p-4 space-y-1">
            {/* Main Navigation */}
            <Button
              variant={pathname === "/cattle-info" ? "default" : "ghost"}
              className="w-full justify-start min-h-[44px] touch-manipulation"
              onClick={() => handleNavigation("/cattle-info")}
            >
              <Home className="mr-3 h-5 w-5" />
              Cattle Info
            </Button>

            {drawerNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "default" : "ghost"}
                  className="w-full justify-start min-h-[44px] touch-manipulation"
                  onClick={() => handleNavigation(item.href)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Button>
              );
            })}

            {/* Admin Section */}
            {user?.is_admin && (
              <>
                <div className="my-2 border-t" />
                <Button
                  variant={pathname?.startsWith("/admin") ? "default" : "ghost"}
                  className="w-full justify-start min-h-[44px] touch-manipulation"
                  onClick={() => handleNavigation("/admin")}
                >
                  <Settings className="mr-3 h-5 w-5" />
                  Admin Panel
                </Button>
              </>
            )}

            {/* Help & Support */}
            <div className="my-2 border-t" />
            <Button
              variant="ghost"
              className="w-full justify-start min-h-[44px] touch-manipulation"
              onClick={() => {
                // Help & Support - could link to help page or external URL
                window.open("https://support.rationsmart.com", "_blank");
              }}
            >
              <HelpCircle className="mr-3 h-5 w-5" />
              Help & Support
            </Button>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start min-h-[44px] touch-manipulation text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

