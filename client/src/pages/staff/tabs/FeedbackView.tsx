import { useState, useEffect } from "react"
import { toast } from "sonner"
import FeedbackList from "@/pages/staff/pages/FeedbackList"
import FeedbackStats from "@/pages/staff/pages/FeedbackStats"
import { Button } from "@/components/ui/button";
import { useFeedback } from "@/hooks/useFeedback";
import api from "@/lib/api";

interface FeedbackItem {
  id: string
  content: string
  name: string
  email: string
  userId?: string
  timestamp: string
  createdAt: string
  status: 'pending' | 'reviewed' | 'resolved'
  category: 'general' | 'bug' | 'feature' | 'complaint' | 'praise'
  userAgent?: string
  ipAddress?: string
}

interface RatingItem {
  id: string
  rating: number
  userId?: string
  userEmail?: string
  timestamp: string
  createdAt: string
  userAgent?: string
  ipAddress?: string
}

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [ratings, setRatings] = useState<RatingItem[]>([])
  const [filter, setFilter] = useState<'all' | 'new'>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { fetchFeedback, fetchStats } = useFeedback()

  // Fetch feedback and ratings data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Fetch feedback data
        const feedbackResponse = await api.get('/api/feedback')
        setFeedbacks(feedbackResponse.data.feedback || [])
        
        // Fetch ratings data
        const ratingsResponse = await api.get('/api/ratings')
        setRatings(ratingsResponse.data.ratings || [])
        
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load feedback data')
        console.error('Error loading feedback data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const deleteFeedback = async (id: string) => {
    try {
      await api.delete(`/api/feedback/${id}`)
      setFeedbacks(prev => prev.filter(feedback => feedback.id !== id))
      toast.success("Feedback deleted successfully")
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to delete feedback')
    }
  }

  const archiveFeedback = async (id: string) => {
    try {
      await api.put(`/api/feedback/${id}/status`, { status: 'resolved' })
      setFeedbacks(prev => 
        prev.map(feedback => 
          feedback.id === id ? { ...feedback, status: 'resolved' as const } : feedback
        )
      )
      toast.success("Feedback archived successfully")
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to archive feedback')
    }
  }

  // Calculate filtered feedback - only show active (non-resolved) feedback
  const activeFeedbacks = feedbacks.filter(feedback => feedback.status !== 'resolved')
  const filteredFeedbacks = filter === 'all' 
    ? activeFeedbacks 
    : activeFeedbacks.filter(feedback => feedback.status === 'pending')

  // Calculate stats to match original design
  const totalActive = activeFeedbacks.length
  const newFeedbacks = activeFeedbacks.filter(f => f.status === 'pending').length
  const archivedFeedbacks = feedbacks.filter(f => f.status === 'resolved').length
  
  // Calculate average rating from ALL ratings data (as requested)
  const avgRating = ratings.length > 0 
    ? ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length 
    : 0

  const stats = {
    total: totalActive,
    new: newFeedbacks,
    archived: archivedFeedbacks,
    avgRating: avgRating
  }

  if (showArchived) {
    const resolvedFeedbacks = feedbacks.filter(f => f.status === 'resolved')
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resolved Feedback</h1>
            <p className="text-gray-600">Previously resolved feedback items</p>
          </div>
          <Button onClick={() => setShowArchived(false)}>
            Back to Active
          </Button>
        </div>
        
        <div className="space-y-4">
          {resolvedFeedbacks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No resolved feedback found.
            </div>
          ) : (
            resolvedFeedbacks.map((feedback) => (
              <div key={feedback.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {feedback.content.length > 50 
                        ? `${feedback.content.substring(0, 50)}...` 
                        : feedback.content
                      }
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{feedback.name}</span>
                      <span>{feedback.email}</span>
                      <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => archiveFeedback(feedback.id)}
                    >
                      Reopen
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteFeedback(feedback.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
        </div>
        <Button
          onClick={() => setShowArchived(true)}
          variant="outline"
        >
          View Archived ({stats.archived})
        </Button>
      </div>

      <FeedbackStats stats={stats} loading={loading} />

      <FeedbackList
        feedbacks={filteredFeedbacks}
        ratings={ratings}
        filter={filter}
        stats={stats}
        loading={loading}
        onFilterChange={setFilter}
        onArchive={archiveFeedback}
        onDelete={deleteFeedback}
      />
    </div>
  )
}

export default Feedback