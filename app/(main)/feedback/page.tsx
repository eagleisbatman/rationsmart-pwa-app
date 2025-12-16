"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { feedbackApi } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import { Feedback, SubmitFeedbackRequest } from "@/lib/types";

export default function FeedbackPage() {
  const { user } = useAuthStore();
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState(0);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadFeedbacks();
    }
  }, [user]);

  const loadFeedbacks = async () => {
    if (!user) return;
    try {
      const response = await feedbackApi.getUserFeedbacks(user.id);
      setFeedbacks(response.feedbacks || []);
    } catch (error: any) {
      toast.error("Failed to load feedbacks");
    }
  };

  const handleSubmit = async () => {
    if (!feedbackText.trim()) {
      toast.error("Please enter your feedback");
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      const feedbackData: SubmitFeedbackRequest = {
        feedback_type: "General",
        text_feedback: feedbackText,
        overall_rating: rating || undefined,
      };
      await feedbackApi.submitFeedback(user.id, feedbackData);
      toast.success("Feedback submitted successfully");
      setFeedbackText("");
      setRating(0);
      loadFeedbacks();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit Feedback</CardTitle>
          <CardDescription>
            Share your thoughts and suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Feedback</Label>
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Enter your feedback..."
              rows={5}
            />
          </div>
          <div className="space-y-2">
            <Label>Rating (optional)</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <Button
                  key={num}
                  variant={rating === num ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRating(num)}
                >
                  {num}
                </Button>
              ))}
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Submit Feedback"}
          </Button>
        </CardContent>
      </Card>

      {feedbacks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Feedbacks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div key={feedback.id} className="border rounded p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {feedback.feedback_type}
                    </span>
                    {feedback.overall_rating && (
                      <span className="text-sm text-muted-foreground">
                        {feedback.overall_rating}/5 ⭐
                      </span>
                    )}
                  </div>
                  {feedback.text_feedback && (
                    <p className="mb-2">{feedback.text_feedback}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(feedback.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

