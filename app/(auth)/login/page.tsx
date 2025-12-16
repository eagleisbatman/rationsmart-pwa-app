"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4 safe-area-inset">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center px-4 sm:px-6 pt-6">
          <CardTitle className="text-xl sm:text-2xl font-bold">Login</CardTitle>
          <CardDescription className="text-sm">
            Enter your email and PIN to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6 pb-6">
          <LoginForm />
          <div className="text-center space-y-2">
            <Button
              variant="link"
              className="text-sm min-h-[44px] touch-manipulation"
              onClick={() => router.push("/forgot-pin")}
            >
              Forgot PIN?
            </Button>
            <div className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-primary min-h-[44px] touch-manipulation"
                onClick={() => router.push("/register")}
              >
                Register
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

