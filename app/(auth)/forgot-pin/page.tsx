"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/endpoints";
import { toast } from "sonner";

const forgotPinSchema = z.object({
  email_id: z.string().email("Invalid email address"),
});

type ForgotPinFormValues = z.infer<typeof forgotPinSchema>;

export default function ForgotPinPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<ForgotPinFormValues>({
    resolver: zodResolver(forgotPinSchema),
    defaultValues: {
      email_id: "",
    },
  });

  const onSubmit = async (data: ForgotPinFormValues) => {
    setIsLoading(true);
    try {
      const response = await authApi.resetPin(data);
      if (response.success) {
        toast.success(response.message || "PIN reset instructions sent to your email");
        router.push("/login");
      } else {
        toast.error(response.message || "Failed to reset PIN");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Forgot PIN</CardTitle>
          <CardDescription>
            Enter your email to receive PIN reset instructions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Instructions"}
              </Button>
            </form>
          </Form>
          <div className="text-center">
            <Button
              variant="link"
              className="text-sm"
              onClick={() => router.push("/login")}
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

