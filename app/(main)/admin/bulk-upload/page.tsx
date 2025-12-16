"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { adminApi } from "@/lib/api/endpoints";
import { toast } from "sonner";
import { Upload, Download, FileText, CheckCircle2, XCircle } from "lucide-react";
import { AdminBulkUploadResponse } from "@/lib/types";

export default function AdminBulkUploadPage() {
  const { user } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<AdminBulkUploadResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showAllFailed, setShowAllFailed] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file extension
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        toast.error("Please select an Excel file (.xlsx or .xls)");
        return;
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        toast.error(`File size exceeds 10MB limit. Selected file is ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        return;
      }
      
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user?.is_admin) return;

    setUploading(true);
    try {
      const result = await adminApi.bulkUploadFeeds(user.id, selectedFile);
      setUploadResult(result);
      
      if (result.success) {
        toast.success(
          `Upload completed! ${result.successful_uploads} successful, ${result.failed_uploads} failed`
        );
      } else {
        toast.error("Upload failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const [exportingStandard, setExportingStandard] = useState(false);
  const [exportingCustom, setExportingCustom] = useState(false);

  const handleExport = async () => {
    if (!user?.is_admin || exportingStandard) return;

    setExportingStandard(true);
    try {
      const result = await adminApi.exportFeeds(user.id);
      if (result.success && result.file_url) {
        window.open(result.file_url, "_blank");
        toast.success("Export started");
      } else {
        toast.error(result.message || "Failed to export feeds");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to export feeds");
    } finally {
      setExportingStandard(false);
    }
  };

  const handleExportCustom = async () => {
    if (!user?.is_admin || exportingCustom) return;

    setExportingCustom(true);
    try {
      const result = await adminApi.exportCustomFeeds(user.id);
      if (result.success && result.file_url) {
        window.open(result.file_url, "_blank");
        toast.success("Export started");
      } else {
        toast.error(result.message || "Failed to export custom feeds");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to export custom feeds");
    } finally {
      setExportingCustom(false);
    }
  };

  if (!user?.is_admin) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-4xl py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Upload Feeds</CardTitle>
          <CardDescription>
            Upload feeds in bulk via Excel file. Required columns: fd_name, fd_category, fd_type, fd_country_name
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Select an Excel file (.xlsx or .xls) to bulk import feeds
            </p>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="max-w-sm mx-auto"
              disabled={uploading}
            />
            {selectedFile && (
              <p className="mt-4 text-sm text-muted-foreground">
                Selected: {selectedFile.name}
              </p>
            )}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="mt-4"
            >
              {uploading ? "Uploading..." : "Upload File"}
            </Button>
          </div>

          {uploadResult && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                {uploadResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <h3 className="font-semibold">Upload Results</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                  <p className="text-lg font-semibold">{uploadResult.total_records}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Successful</p>
                  <p className="text-lg font-semibold text-green-600">
                    {uploadResult.successful_uploads}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-lg font-semibold text-red-600">
                    {uploadResult.failed_uploads}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Updated</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {uploadResult.updated_records}
                  </p>
                </div>
              </div>

              {uploadResult.failed_records && uploadResult.failed_records.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold">
                      Failed Records ({uploadResult.failed_records.length}):
                    </p>
                    {uploadResult.failed_records.length > 10 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllFailed(!showAllFailed)}
                      >
                        {showAllFailed ? "Show Less" : "Show All"}
                      </Button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1 border rounded p-2">
                    {(showAllFailed
                      ? uploadResult.failed_records
                      : uploadResult.failed_records.slice(0, 10)
                    ).map((record, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground py-1 border-b last:border-b-0">
                        <span className="font-medium">Row {record.row}:</span> {record.reason}
                        {record.data && (
                          <details className="mt-1 ml-4">
                            <summary className="cursor-pointer text-xs">View details</summary>
                            <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-x-auto">
                              {JSON.stringify(record.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                    {!showAllFailed && uploadResult.failed_records.length > 10 && (
                      <p className="text-xs text-muted-foreground pt-2 text-center">
                        ... and {uploadResult.failed_records.length - 10} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {uploadResult.bulk_import_log && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(uploadResult.bulk_import_log, "_blank")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Import Log
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export Feeds</CardTitle>
          <CardDescription>Export feeds to Excel file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleExport} 
              variant="outline"
              disabled={exportingStandard}
              className="min-h-[44px] w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              {exportingStandard ? "Exporting..." : "Export Standard Feeds"}
            </Button>
            <Button 
              onClick={handleExportCustom} 
              variant="outline"
              disabled={exportingCustom}
              className="min-h-[44px] w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              {exportingCustom ? "Exporting..." : "Export Custom Feeds"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

