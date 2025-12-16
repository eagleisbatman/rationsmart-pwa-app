"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/icons";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" variant="full" />
          </div>
          <CardDescription className="text-lg">
            Dairy Cattle Nutrition Optimization System
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Create optimal feed formulations for your dairy cattle with our
            advanced nutrition optimization system.
          </p>
          <div className="space-y-2">
            <Button
              className="w-full"
              size="lg"
              onClick={() => router.push("/login")}
            >
              Login
            </Button>
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => router.push("/register")}
            >
              Register
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

