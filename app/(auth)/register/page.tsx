"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4 safe-area-inset">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center px-4 sm:px-6 pt-6">
          <CardTitle className="text-xl sm:text-2xl font-bold">Register</CardTitle>
          <CardDescription className="text-sm">
            Create a new account to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6 pb-6">
          <RegisterForm />
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button
              variant="link"
              className="p-0 h-auto text-primary min-h-[44px] touch-manipulation"
              onClick={() => router.push("/login")}
            >
              Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

