import { useState, useEffect } from "react";
import { toast } from "sonner";
import FeedbackList from "@/pages/staff/pages/FeedbackList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFeedback } from "@/hooks/useFeedback";
import { ArrowLeft, Star, Loader2, Plus, MessageSquare } from "lucide-react";
import api from "@/lib/api";

interface FeedbackItem {
  id: string;
  content: string;
  name: string;
  email: string;
  userId?: string;
  rating?: number | null;
  timestamp: string;
  createdAt: string;
  status: "pending" | "reviewed" | "resolved";
  category: "general" | "bug" | "feature" | "complaint" | "praise";
  subcategory?: string;
  sentiment?: "positive" | "negative" | "suggestion" | "neutral";
  sentimentConfidence?: number;
  topics?: string[];
  userAgent?: string;
  ipAddress?: string;
}

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [filter, setFilter] = useState<"all" | "new">("all");
  const [showArchived, setShowArchived] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Feedback submission form state
  const [feedback, setFeedback] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [wordCount, setWordCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  
  const { fetchFeedback, fetchStats, submitFeedback } = useFeedback();

  // Word count validation
  const minWords = 10;
  const maxLength = 500;
  const isTooShort = wordCount < minWords;
  const isTooLong = feedback.length > maxLength;
  const isValidLength = wordCount >= minWords && feedback.length <= maxLength;

  // Update word count
  useEffect(() => {
    const words = feedback.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [feedback]);

  // Fetch feedback data (ratings are now included in feedback)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch feedback data (now includes ratings)
        const feedbackResponse = await api.get("/api/feedback");
        setFeedbacks(feedbackResponse.data.feedback || []);
      } catch (err: any) {
        setError(err?.response?.data?.error || "Failed to load feedback data");
        console.error("Error loading feedback data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const deleteFeedback = async (id: string) => {
    try {
      await api.delete(`/api/feedback/${id}`);
      setFeedbacks((prev) => prev.filter((feedback) => feedback.id !== id));
      toast.success("Feedback deleted successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to delete feedback");
    }
  };

  const archiveFeedback = async (id: string) => {
    try {
      await api.put(`/api/feedback/${id}/archive`);
      setFeedbacks((prev) =>
        prev.map((feedback) => (feedback.id === id ? { ...feedback, status: "resolved" as const } : feedback))
      );
      toast.success("Feedback archived successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to archive feedback");
    }
  };

  const unarchiveFeedback = async (id: string) => {
    try {
      await api.put(`/api/feedback/${id}/unarchive`);
      setFeedbacks((prev) =>
        prev.map((feedback) => (feedback.id === id ? { ...feedback, status: "pending" as const } : feedback))
      );
      toast.success("Feedback unarchived successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to unarchive feedback");
    }
  };

  // Render stars for rating
  const renderStars = () => {
    return [...Array(5)].map((_, i) => {
      const value = i + 1;
      return (
        <Star
          key={i}
          className={`h-6 w-6 cursor-pointer ${
            value <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
          }`}
          onClick={() => setRating(value)}
        />
      );
    });
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isTooShort || isTooLong || rating === 0) {
      toast.error(`Please provide at least ${minWords} words, no more than ${maxLength} characters, and a rating.`);
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitFeedback({
        content: feedback,
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        rating
      });

      if (result.success) {
        toast.success("Feedback submitted successfully!");
        setFeedback("");
        setName("");
        setEmail("");
        setRating(0);
        setWordCount(0);
        setShowSubmitForm(false);
        
        // Refresh feedback list
        const feedbackResponse = await api.get("/api/feedback");
        setFeedbacks(feedbackResponse.data.feedback || []);
      } else {
        toast.error(result.message || "Failed to submit feedback");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate filtered feedback - only show active (non-resolved) feedback
  const activeFeedbacks = feedbacks.filter((feedback) => feedback.status !== "resolved");
  const filteredFeedbacks =
    filter === "all" ? activeFeedbacks : activeFeedbacks.filter((feedback) => feedback.status === "pending");

  // Calculate stats to match original design
  const totalActive = activeFeedbacks.length;
  const newFeedbacks = activeFeedbacks.filter((f) => f.status === "pending").length;
  const archivedFeedbacks = feedbacks.filter((f) => f.status === "resolved").length;

  // Calculate average rating from feedback data (ratings are now stored with feedback)
  const feedbackWithRatings = feedbacks.filter((f) => f.rating && f.rating > 0);
  const avgRating =
    feedbackWithRatings.length > 0
      ? feedbackWithRatings.reduce((acc, f) => acc + (f.rating || 0), 0) / feedbackWithRatings.length
      : 0;

  const stats = {
    total: totalActive,
    new: newFeedbacks,
    archived: archivedFeedbacks,
    avgRating: avgRating,
  };

  if (showArchived) {
    const resolvedFeedbacks = feedbacks.filter((f) => f.status === "resolved");
    const archivedStats = {
      total: resolvedFeedbacks.length,
      new: 0,
      avgRating: 0,
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowArchived(false)} 
              className="rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Archived Feedback</h1>
          </div>
        </div>

        <FeedbackList
          feedbacks={resolvedFeedbacks}
          filter="all"
          stats={archivedStats}
          loading={loading}
          showArchived={true}
          onFilterChange={() => {}}
          onArchive={() => {}}
          onUnarchive={unarchiveFeedback}
          onDelete={deleteFeedback}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowArchived(true)} 
            variant="ghost"
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-1 h-auto text-sm"
          >
            View Archived ({stats.archived})
          </Button>
        </div>
      </div>

      {/* Feedback Submission Form */}
      {showSubmitForm && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Submit New Feedback
            </CardTitle>
            <CardDescription>
              Share your feedback, suggestions, or report issues to help improve our system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              {/* Name and Email Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name (Optional)</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-3">
                <Label>Rate Your Experience</Label>
                <div className="flex space-x-1">{renderStars()}</div>
                <p className="text-sm text-gray-500">
                  {rating === 0 && "Please select a rating"}
                  {rating === 1 && "Poor - Needs significant improvement"}
                  {rating === 2 && "Fair - Below expectations"}
                  {rating === 3 && "Good - Meets expectations"}
                  {rating === 4 && "Very Good - Above expectations"}
                  {rating === 5 && "Excellent - Exceeds expectations"}
                </p>
              </div>

              {/* Feedback Textarea */}
              <div className="space-y-2">
                <Label htmlFor="feedback">Your Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Tell us about your experience, suggestions, or report any issues..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-32"
                  required
                />
                
                {/* Word Counter */}
                {wordCount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {isValidLength ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <span className="text-xs">✓ Valid feedback</span>
                        </div>
                      ) : (
                        <div className={`flex items-center gap-1 ${isTooShort ? "text-red-600" : "text-green-600"}`}>
                          <span className="text-xs">
                            {isTooShort
                              ? `Need ${minWords - wordCount} more words`
                              : isTooLong
                              ? `${feedback.length - maxLength} characters over limit`
                              : "Invalid feedback"}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className={`text-xs ${isTooShort || isTooLong ? 'text-red-500' : 'text-gray-500'}`}>
                      {wordCount} words / {feedback.length} chars
                    </span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={submitting || !isValidLength || rating === 0}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 h-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}


      <FeedbackList
        feedbacks={filteredFeedbacks}
        filter={filter}
        stats={stats}
        loading={loading}
        onFilterChange={setFilter}
        onArchive={archiveFeedback}
        onDelete={deleteFeedback}
      />
    </div>
  );
};

export default Feedback;
