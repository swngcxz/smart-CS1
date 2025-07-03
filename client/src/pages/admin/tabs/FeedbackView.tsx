import { useState } from "react"
import { toast } from "sonner"
import FeedbackList from "@/pages/admin/pages/FeedbackList"
import FeedbackStats from "@/pages/admin/pages/FeedbackStats"
import ArchivedView from "@/pages/admin/pages/ArchivedView"

interface FeedbackItem {
  id: number
  name: string
  email: string
  subject: string
  message: string
  rating: number
  date: string
  status: 'new' | 'archived'
  category: 'complaint' | 'suggestion' | 'compliment' | 'bug'
}

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([
    {
      id: 1,
      name: "Maria Santos",
      email: "maria.santos@email.com",
      subject: "Missed Collection Schedule",
      message: "The waste collection truck missed our street again this week. This is the third time this month. Please improve the scheduling system.",
      rating: 2,
      date: "2024-01-15",
      status: 'new',
      category: 'complaint'
    },
    {
      id: 2,
      name: "John Doe",
      email: "john.doe@email.com",
      subject: "Great Service Improvement",
      message: "I've noticed significant improvements in the waste collection efficiency in our area. The new smart bins are working great!",
      rating: 5,
      date: "2024-01-14",
      status: 'new',
      category: 'compliment'
    },
    {
      id: 3,
      name: "Lisa Chen",
      email: "lisa.chen@email.com",
      subject: "Mobile App Suggestion",
      message: "It would be great if we could get push notifications when bins are full or when collection is scheduled. Also, a map view would be helpful.",
      rating: 4,
      date: "2024-01-13",
      status: 'new',
      category: 'suggestion'
    },
    {
      id: 4,
      name: "Robert Kim",
      email: "robert.kim@email.com",
      subject: "Bin Sensor Malfunction",
      message: "The smart bin on Park Avenue seems to be showing incorrect readings. It shows 100% full but was emptied yesterday.",
      rating: 3,
      date: "2024-01-12",
      status: 'archived',
      category: 'bug'
    },
    {
      id: 5,
      name: "Sarah Wilson",
      email: "sarah.wilson@email.com",
      subject: "Excellent Route Optimization",
      message: "The new route optimization has reduced noise in our neighborhood significantly. Thank you for listening to our previous feedback!",
      rating: 5,
      date: "2024-01-11",
      status: 'new',
      category: 'compliment'
    }
  ])

  const [filter, setFilter] = useState<'all' | 'new'>('all')
  const [showArchived, setShowArchived] = useState(false)

  const deleteFeedback = (id: number) => {
    setFeedbacks(prev => prev.filter(feedback => feedback.id !== id))
    toast.success("Feedback deleted successfully")
  }

  const archiveFeedback = (id: number) => {
    setFeedbacks(prev => 
      prev.map(feedback => 
        feedback.id === id 
          ? { ...feedback, status: feedback.status === 'archived' ? 'new' : 'archived' as const }
          : feedback
      )
    )
    const feedback = feedbacks.find(f => f.id === id)
    const action = feedback?.status === 'archived' ? 'unarchived' : 'archived'
    toast.success(`Feedback ${action} successfully`)
  }

  const activeFeedbacks = feedbacks.filter(feedback => feedback.status !== 'archived')
  const archivedFeedbacks = feedbacks.filter(feedback => feedback.status === 'archived')
  
  const filteredFeedbacks = filter === 'all' 
    ? activeFeedbacks 
    : activeFeedbacks.filter(feedback => feedback.status === 'new')

  const stats = {
    total: activeFeedbacks.length,
    new: activeFeedbacks.filter(f => f.status === 'new').length,
    archived: archivedFeedbacks.length,
    avgRating: activeFeedbacks.length > 0 ? activeFeedbacks.reduce((acc, f) => acc + f.rating, 0) / activeFeedbacks.length : 0
  }

  if (showArchived) {
    return (
      <ArchivedView
        archivedFeedbacks={archivedFeedbacks}
        onBack={() => setShowArchived(false)}
        onUnarchive={archiveFeedback}
        onDelete={deleteFeedback}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
        </div>
        <button 
          onClick={() => setShowArchived(true)}
          className="text-blue-600 hover:text-red-800"
        >
          View Archived Feedback ({stats.archived})
        </button>
      </div>

      <FeedbackStats stats={stats} />

      <FeedbackList
        feedbacks={filteredFeedbacks}
        filter={filter}
        stats={stats}
        onFilterChange={setFilter}
        onArchive={archiveFeedback}
        onDelete={deleteFeedback}
      />
    </div>
  )
}

export default Feedback