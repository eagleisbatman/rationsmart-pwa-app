"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CattleInfoForm } from "@/components/cattle-info/cattle-info-form";

export default function CattleInfoPage() {
  return (
    <div className="container mx-auto max-w-4xl py-4 md:py-6 px-4">
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl">Cattle Information</CardTitle>
          <CardDescription className="text-sm">
            Enter details about your cattle to generate feed recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6">
          <CattleInfoForm />
        </CardContent>
      </Card>
    </div>
  );
}

