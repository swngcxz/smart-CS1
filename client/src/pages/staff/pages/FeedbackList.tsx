import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Archive, Star, MessageSquare, Calendar, Loader2 } from "lucide-react";

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

interface FeedbackListProps {
  feedbacks: FeedbackItem[];
  filter: "all" | "new";
  stats: {
    total: number;
    new: number;
    avgRating?: number;
  };
  loading?: boolean;
  showArchived?: boolean;
  onFilterChange: (filter: "all" | "new") => void;
  onArchive: (id: string) => void;
  onUnarchive?: (id: string) => void;
  onDelete: (id: string) => void;
}

const FeedbackList = ({
  feedbacks,
  filter,
  stats,
  loading = false,
  showArchived = false,
  onFilterChange,
  onArchive,
  onUnarchive,
  onDelete,
}: FeedbackListProps) => {
  const getCategoryColor = (category: string, subcategory?: string) => {
    // Use subcategory for more specific styling if available
    const displayCategory = subcategory || category;

    switch (displayCategory) {
      case "compliment":
      case "praise":
        return "bg-green-100 text-green-800 border-green-200";
      case "negative_feedback":
      case "complaint":
        return "bg-red-100 text-red-800 border-red-200";
      case "suggestion":
      case "feature":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "bug":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "neutral_feedback":
      case "general":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryDisplayName = (category: string, subcategory?: string) => {
    // Use subcategory for display if available, otherwise use category
    const displayCategory = subcategory || category;

    switch (displayCategory) {
      case "compliment":
        return "Compliment";
      case "negative_feedback":
        return "Negative";
      case "suggestion":
        return "Suggestion";
      case "praise":
        return "Praise";
      case "complaint":
        return "Complaint";
      case "feature":
        return "Feature Request";
      case "bug":
        return "Bug Report";
      case "neutral_feedback":
        return "General";
      case "general":
        return "General";
      default:
        return "General";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "reviewed":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Use feedback data directly since ratings are now stored with feedback
  const combinedData = feedbacks;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feedback List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-transparent shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-lg text-semibold">
            {showArchived ? "Archived Feedback" : "Active Feedback"}
          </CardTitle>
          {!showArchived && (
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                <Button
                  variant={filter === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onFilterChange("all")}
                  className={`text-xs px-3 py-1 h-auto ${filter === "all" ? "bg-gray-100 text-gray-900 hover:bg-gray-200" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}
                >
                  All ({stats.total})
                </Button>
                <Button
                  variant={filter === "new" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onFilterChange("new")}
                  className={`text-xs px-3 py-1 h-auto ${filter === "new" ? "bg-gray-100 text-gray-900 hover:bg-gray-200" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}
                >
                  New ({stats.new})
                </Button>
              </div>
              {stats.avgRating && stats.avgRating > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Avg Rating:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-yellow-600">{stats.avgRating.toFixed(1)}</span>
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < Math.floor(stats.avgRating!) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-[600px] overflow-y-auto space-y-4">
          {combinedData.map((feedback) => (
            <div key={feedback.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors shadow-md hover:shadow-lg">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {feedback.content.length > 50 ? `${feedback.content.substring(0, 50)}...` : feedback.content}
                    </h3>
                    <Badge className={getCategoryColor(feedback.category, feedback.subcategory)}>
                      {getCategoryDisplayName(feedback.category, feedback.subcategory)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span>{feedback.name}</span>
                    <span>{feedback.email}</span>
                    <div className="flex items-center gap-1">{formatDate(feedback.createdAt)}</div>
                    {feedback.rating && feedback.rating > 0 && (
                      <div className="flex items-center gap-1">
                        {renderStars(feedback.rating)}
                        <span className="ml-1">({feedback.rating}/5)</span>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-700">{feedback.content}</p>
                </div>

                <div className="flex gap-1 ml-4">
                  {showArchived ? (
                    <>
                      {onUnarchive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUnarchive(feedback.id)}
                          className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 p-2 h-auto"
                        >
                          <Archive className="w-4 h-4" />
                          <span className="text-xs">Unarchive</span>
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onArchive(feedback.id)}
                      className="flex items-center gap-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 p-2 h-auto"
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(feedback.id)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 p-2 h-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {combinedData.length === 0 && <div className="text-center py-8 text-gray-500">No feedback found.</div>}
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackList;
