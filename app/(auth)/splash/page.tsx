"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { BrandIcon, Logo } from "@/components/icons";

export default function SplashPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.push("/cattle-info");
      } else {
        router.push("/welcome");
      }
    }, 2000); // 2 second splash screen

    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary">
      <div className="text-center">
        <div className="mb-8">
          <div className="flex flex-col items-center gap-4 mb-4">
            <BrandIcon size={80} color="current" className="text-white" />
            <Logo size="xl" variant="text" className="text-white" />
          </div>
          <p className="text-primary-foreground/80">Feed Formulation System</p>
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
      </div>
    </div>
  );
}

