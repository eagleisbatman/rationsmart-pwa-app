"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { FeedDetails, AdminFeedListResponse } from "@/lib/types";
import { AddFeedDialog } from "@/components/admin/add-feed-dialog";
import { EditFeedDialog } from "@/components/admin/edit-feed-dialog";
import { Edit, Trash2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function AdminFeedsPage() {
  const { user } = useAuthStore();
  const [feeds, setFeeds] = useState<FeedDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [editingFeed, setEditingFeed] = useState<FeedDetails | null>(null);
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    if (user?.is_admin) {
      // Reset to page 1 when search changes
      if (debouncedSearch !== search && page !== 1) {
        setPage(1);
        return;
      }
      loadFeeds();
    }
  }, [user, page, debouncedSearch]);

  const loadFeeds = async () => {
    if (!user?.is_admin) return;
    setLoading(true);
    try {
      const response: AdminFeedListResponse = await adminApi.getFeeds(
        user.id,
        page,
        20,
        undefined,
        undefined,
        undefined,
        debouncedSearch || undefined
      );
      setFeeds(response.feeds || []);
      setTotalPages(response.total_pages || 1);
    } catch (error: any) {
      toast.error(error.message || "Failed to load feeds");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (feedId: string) => {
    if (!user?.is_admin || !confirm("Are you sure you want to delete this feed?")) {
      return;
    }

    try {
      await adminApi.deleteFeed(user.id, feedId);
      toast.success("Feed deleted successfully");
      loadFeeds();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete feed");
    }
  };

  if (!user?.is_admin) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-6xl py-6">
      <EditFeedDialog
        feed={editingFeed}
        open={!!editingFeed}
        onOpenChange={(open) => !open && setEditingFeed(null)}
        onSuccess={loadFeeds}
      />
      <Card>
        <CardHeader>
          <CardTitle>Feed Management</CardTitle>
          <CardDescription>Manage feed database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Search feeds..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:max-w-sm"
            />
            <AddFeedDialog onSuccess={loadFeeds} />
          </div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {debouncedSearch ? (
                        <div className="space-y-2">
                          <p>No feeds match your search "{debouncedSearch}"</p>
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
                        <div className="space-y-2">
                          <p>No feeds found</p>
                          <AddFeedDialog onSuccess={loadFeeds} />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  feeds.map((feed) => (
                    <TableRow key={feed.feed_id}>
                      <TableCell className="font-medium">{feed.fd_name}</TableCell>
                      <TableCell>{feed.fd_type}</TableCell>
                      <TableCell>{feed.fd_category}</TableCell>
                      <TableCell>{feed.fd_country_name || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingFeed(feed)}
                            aria-label={`Edit feed ${feed.fd_name}`}
                            className="min-h-[44px] min-w-[44px]"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(feed.feed_id)}
                            aria-label={`Delete feed ${feed.fd_name}`}
                            className="min-h-[44px] min-w-[44px]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          {!loading && feeds.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="min-h-[44px]"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="min-h-[44px]"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

