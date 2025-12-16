"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, MessageSquare, User, Calendar } from "lucide-react";
import { AdminFeedbackResponse, FeedbackStatsResponse } from "@/lib/types";

export default function AdminFeedbackPage() {
  const { user } = useAuthStore();
  const [feedbacks, setFeedbacks] = useState<AdminFeedbackResponse[]>([]);
  const [stats, setStats] = useState<FeedbackStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<string>("all");
  const pageSize = 20;

  useEffect(() => {
    if (user?.is_admin) {
      loadFeedbacks();
      if (page === 1) {
        loadStats();
      }
    }
  }, [user, page, filterType, filterRating]);

  const loadFeedbacks = async () => {
    if (!user?.is_admin) return;
    setLoading(true);
    try {
      const offset = (page - 1) * pageSize;
      const response = await adminApi.getAllFeedbacks(user.id, 100, 0); // Load more for filtering
      let filteredFeedbacks: AdminFeedbackResponse[] = response.feedbacks || [];

      // Apply filters
      if (filterType !== "all") {
        filteredFeedbacks = filteredFeedbacks.filter(
          (fb: AdminFeedbackResponse) => fb.feedback_type === filterType
        );
      }

      if (filterRating !== "all") {
        const ratingNum = parseInt(filterRating);
        filteredFeedbacks = filteredFeedbacks.filter(
          (fb: AdminFeedbackResponse) => fb.overall_rating === ratingNum
        );
      }
      
      // Apply pagination after filtering
      const startIndex = (page - 1) * pageSize;
      const paginatedFeedbacks = filteredFeedbacks.slice(
        startIndex,
        startIndex + pageSize
      );
      
      setFeedbacks(paginatedFeedbacks);
      setTotalCount(filteredFeedbacks.length);
    } catch (error: any) {
      toast.error(error.message || "Failed to load feedbacks");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user?.is_admin) return;
    try {
      const data = await adminApi.getFeedbackStats(user.id);
      setStats(data);
    } catch (error: any) {
      // Stats are optional, don't show error
    }
  };

  if (!user?.is_admin) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-6xl py-6 space-y-6">
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total_feedbacks}</div>
              <p className="text-xs text-muted-foreground">Total Feedbacks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.average_rating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Average Rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.recent_feedbacks}</div>
              <p className="text-xs text-muted-foreground">Last 30 Days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm space-y-1">
                {Object.entries(stats.feedback_type_distribution).map(([type, count]) => (
                  <div key={type} className="flex justify-between">
                    <span className="text-muted-foreground">{type}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Feedback</CardTitle>
          <CardDescription>View and manage user feedback</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 w-full sm:max-w-xs">
              <label className="text-sm font-medium mb-2 block">Filter by Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Defect">Defect</SelectItem>
                  <SelectItem value="Feature Request">Feature Request</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 w-full sm:max-w-xs">
              <label className="text-sm font-medium mb-2 block">Filter by Rating</label>
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="All ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(filterType !== "all" || filterRating !== "all") && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterType("all");
                    setFilterRating("all");
                    setPage(1);
                  }}
                  className="min-h-[44px] w-full sm:w-auto"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : feedbacks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No feedbacks yet</p>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <Card key={feedback.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{feedback.user_name}</span>
                        <span className="text-sm text-muted-foreground">
                          ({feedback.user_email})
                        </span>
                      </div>
                      <Badge variant="outline">{feedback.feedback_type}</Badge>
                    </div>
                    {feedback.overall_rating && (
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= feedback.overall_rating!
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-muted-foreground">
                          {feedback.overall_rating}/5
                        </span>
                      </div>
                    )}
                    {feedback.text_feedback && (
                      <div className="flex items-start gap-2 mt-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-1" />
                        <p className="text-sm">{feedback.text_feedback}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(feedback.created_at).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {!loading && feedbacks.length === 0 && (filterType !== "all" || filterRating !== "all") && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">No feedbacks match your filters</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterType("all");
                  setFilterRating("all");
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
          {!loading && feedbacks.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} feedbacks
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
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * pageSize >= totalCount}
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

