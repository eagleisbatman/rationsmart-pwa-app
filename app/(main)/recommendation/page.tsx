"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { recommendationApi, reportApi } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store/auth-store";
import { useFeedStore } from "@/store/feed-store";
import { useCattleInfoStore } from "@/store/cattle-info-store";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RecommendationPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { cattleInfo } = useCattleInfoStore();
  const { selectedFeeds } = useFeedStore();

  const [recommendation, setRecommendation] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  useEffect(() => {
    if (cattleInfo && selectedFeeds.length > 0 && user) {
      generateRecommendation();
    }
  }, []);

  const generateRecommendation = async () => {
    if (!user || !cattleInfo || selectedFeeds.length === 0) {
      toast.error("Please complete cattle info and select feeds");
      router.push("/cattle-info");
      return;
    }

    setLoading(true);
    try {
      const simulationId = `sim_${Date.now()}`;
      const recommendationData = {
        cattle_info: cattleInfo as any,
        feed_selection: selectedFeeds,
        simulation_id: simulationId,
        user_id: user.id,
      };

      const [recResult, evalResult] = await Promise.all([
        recommendationApi.getRecommendation(recommendationData),
        recommendationApi.getEvaluation(recommendationData),
      ]);

      setRecommendation(recResult);
      setEvaluation(evalResult);
    } catch (error: any) {
      toast.error(error.message || "Failed to generate recommendation");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!recommendation?.report_info?.report_id) {
      toast.error("Report ID not available. Please wait for recommendation to complete.");
      return;
    }

    if (!user) {
      toast.error("User not found");
      return;
    }

    try {
      const response = await reportApi.saveReport({
        report_id: recommendation.report_info.report_id,
        user_id: user.id,
      });
      
      if (response.success) {
        toast.success(response.message || "Report saved successfully");
        setSaveDialogOpen(false);
        router.push("/reports");
      } else {
        toast.error(response.error_message || response.message || "Failed to save report");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save report");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Feed Recommendation</CardTitle>
          <CardDescription>
            Recommended feed formulation for your cattle
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendation ? (
            <div className="space-y-4">
              <pre className="bg-muted p-4 rounded overflow-auto text-sm">
                {JSON.stringify(recommendation, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-muted-foreground">No recommendation available</p>
          )}
        </CardContent>
      </Card>

      {evaluation && (
        <Card>
          <CardHeader>
            <CardTitle>Feed Evaluation</CardTitle>
            <CardDescription>Evaluation of the recommended feed</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded overflow-auto text-sm">
              {JSON.stringify(evaluation, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
        {recommendation?.report_info?.report_id && (
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button>Save Report</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Report</DialogTitle>
                <DialogDescription>
                  Save this report to your reports list
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Report ID: {recommendation.report_info.report_id}
                </p>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setSaveDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveReport}>Save</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

