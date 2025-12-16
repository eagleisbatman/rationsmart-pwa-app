"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, User, Calendar, Search } from "lucide-react";
import { AdminReportItem, AdminGetAllReportsResponse } from "@/lib/types";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AdminReportsPage() {
  const { user } = useAuthStore();
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    if (user?.is_admin) {
      // Reset to page 1 when search changes
      if (debouncedSearch !== search && page !== 1) {
        setPage(1);
        return;
      }
      loadReports();
    }
  }, [user, page, debouncedSearch]);

  const loadReports = async () => {
    if (!user?.is_admin) return;
    setLoading(true);
    try {
      const response: AdminGetAllReportsResponse = await adminApi.getAllReports(
        user.id,
        page,
        20
      );
      let filteredReports = response.reports || [];
      
      // Client-side filtering for search
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        filteredReports = filteredReports.filter(
          (report) =>
            report.user_name.toLowerCase().includes(searchLower) ||
            report.user_email.toLowerCase().includes(searchLower) ||
            report.simulation_id.toLowerCase().includes(searchLower)
        );
      }
      
      setReports(filteredReports);
      setTotalPages(response.total_pages || 1);
    } catch (error: any) {
      toast.error(error.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (bucketUrl?: string) => {
    if (bucketUrl) {
      window.open(bucketUrl, "_blank");
    } else {
      toast.error("Report URL not available");
    }
  };

  if (!user?.is_admin) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-6xl py-6">
      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
          <CardDescription>View and manage all user reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user name, email, or simulation ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
          </div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : reports.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No reports yet</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Report Type</TableHead>
                    <TableHead>Simulation ID</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        {debouncedSearch ? (
                          <div className="space-y-2">
                            <p>No reports match your search "{debouncedSearch}"</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSearch("");
                                setPage(1);
                              }}
                            >
                              Clear Search
                            </Button>
                          </div>
                        ) : (
                          "No reports yet"
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report) => (
                    <TableRow key={report.report_id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{report.user_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {report.user_email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.report_type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {report.simulation_id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(report.created_at).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownload(report.bucket_url)}
                                  disabled={!report.bucket_url}
                                  aria-label={
                                    report.bucket_url
                                      ? `Download report ${report.simulation_id}`
                                      : `Report ${report.simulation_id} not available for download`
                                  }
                                  className="min-h-[44px]"
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </Button>
                              </span>
                            </TooltipTrigger>
                            {!report.bucket_url && (
                              <TooltipContent>
                                <p>Report file not available</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

