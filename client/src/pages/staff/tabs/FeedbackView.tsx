import { useState, useEffect } from "react"
import { toast } from "sonner"
import FeedbackList from "@/pages/staff/pages/FeedbackList"
import FeedbackStats from "@/pages/staff/pages/FeedbackStats"
import { Button } from "@/components/ui/button";
import { useFeedback } from "@/hooks/useFeedback";
import { ArrowLeft } from "lucide-react";
import api from "@/lib/api";

interface FeedbackItem {
  id: string
  content: string
  name: string
  email: string
  userId?: string
  rating?: number | null
  timestamp: string
  createdAt: string
  status: 'pending' | 'reviewed' | 'resolved'
  category: 'general' | 'bug' | 'feature' | 'complaint' | 'praise'
  subcategory?: string
  sentiment?: 'positive' | 'negative' | 'suggestion' | 'neutral'
  sentimentConfidence?: number
  topics?: string[]
  userAgent?: string
  ipAddress?: string
}


const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [filter, setFilter] = useState<'all' | 'new'>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { fetchFeedback, fetchStats } = useFeedback()

  // Fetch feedback data (ratings are now included in feedback)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Fetch feedback data (now includes ratings)
        const feedbackResponse = await api.get('/api/feedback')
        setFeedbacks(feedbackResponse.data.feedback || [])
        
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
      await api.put(`/api/feedback/${id}/archive`)
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

  const unarchiveFeedback = async (id: string) => {
    try {
      await api.put(`/api/feedback/${id}/unarchive`)
      setFeedbacks(prev => 
        prev.map(feedback => 
          feedback.id === id ? { ...feedback, status: 'pending' as const } : feedback
        )
      )
      toast.success("Feedback unarchived successfully")
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to unarchive feedback')
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
  
  // Calculate average rating from feedback data (ratings are now stored with feedback)
  const feedbackWithRatings = feedbacks.filter(f => f.rating && f.rating > 0)
  const avgRating = feedbackWithRatings.length > 0 
    ? feedbackWithRatings.reduce((acc, f) => acc + (f.rating || 0), 0) / feedbackWithRatings.length 
    : 0

  const stats = {
    total: totalActive,
    new: newFeedbacks,
    archived: archivedFeedbacks,
    avgRating: avgRating
  }

  if (showArchived) {
    const resolvedFeedbacks = feedbacks.filter(f => f.status === 'resolved')
    const archivedStats = {
      total: resolvedFeedbacks.length,
      new: 0
    }
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowArchived(false)}
              className="rounded-full"
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