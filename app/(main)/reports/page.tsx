"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { reportApi } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { UserReportItem } from "@/lib/types";
import { FileText, Download, Trash2 } from "lucide-react";

export default function ReportsPage() {
  const { user } = useAuthStore();
  const [reports, setReports] = useState<UserReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user]);

  const loadReports = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await reportApi.getUserReports(user.id);
      setReports(response.reports || []);
    } catch (error: any) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (report: UserReportItem) => {
    if (!report.bucket_url) {
      toast.error("Report URL not available");
      return;
    }

    try {
      // For mobile devices, try to download directly
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // On mobile, create a temporary link and trigger download
        const link = document.createElement("a");
        link.href = report.bucket_url;
        link.download = `report-${report.simulation_id || report.report_id}.pdf`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // On desktop, open in new tab
        window.open(report.bucket_url, "_blank");
      }
    } catch (error) {
      // Fallback: open in new tab
      window.open(report.bucket_url, "_blank");
    }
  };

  const handleDelete = async (reportId: string) => {
    // Delete logic would go here - backend doesn't have delete endpoint yet
    toast.info("Delete functionality coming soon");
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-6">
      <Card>
        <CardHeader>
          <CardTitle>Saved Reports</CardTitle>
          <CardDescription>
            View and manage your saved feed formulation reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reports saved yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.report_id || report.simulation_id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {report.report_type} - {report.simulation_id}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(report.report_created_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDownload(report)}
                          title="Download PDF"
                          className="min-h-[44px] min-w-[44px] touch-manipulation"
                          aria-label="Download PDF report"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(report.report_id)}
                          title="Delete report"
                          className="min-h-[44px] min-w-[44px] touch-manipulation"
                          aria-label="Delete report"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

