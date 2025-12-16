"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Users, Package, FileText, Upload, MessageSquare } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useEffect } from "react";

const adminMenuItems = [
  {
    title: "User Management",
    description: "Manage users and their accounts",
    icon: Users,
    href: "/admin/users",
  },
  {
    title: "Feed Management",
    description: "Manage feed database",
    icon: Package,
    href: "/admin/feeds",
  },
  {
    title: "Feed Types & Categories",
    description: "Manage feed classifications",
    icon: Package,
    href: "/admin/feed-types",
  },
  {
    title: "Bulk Upload",
    description: "Upload feeds in bulk",
    icon: Upload,
    href: "/admin/bulk-upload",
  },
  {
    title: "Feedback Management",
    description: "View and manage user feedback",
    icon: MessageSquare,
    href: "/admin/feedback",
  },
  {
    title: "Reports",
    description: "View all user reports",
    icon: FileText,
    href: "/admin/reports",
  },
];

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && !user.is_admin) {
      router.push("/cattle-info");
    }
  }, [user, router]);

  if (!user?.is_admin) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-6xl py-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
          <CardDescription>Manage the RationSmart system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.href}
                  className="cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => router.push(item.href)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </div>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

