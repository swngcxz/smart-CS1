import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Archive, Star, MessageSquare, Calendar } from "lucide-react"

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

interface FeedbackListProps {
  feedbacks: FeedbackItem[]
  filter: 'all' | 'new'
  stats: {
    total: number
    new: number
  }
  onFilterChange: (filter: 'all' | 'new') => void
  onArchive: (id: number) => void
  onDelete: (id: number) => void
}

const FeedbackList = ({ feedbacks, filter, stats, onFilterChange, onArchive, onDelete }: FeedbackListProps) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'complaint': return 'bg-red-100 text-red-800'
      case 'suggestion': return 'bg-blue-100 text-blue-800'
      case 'compliment': return 'bg-green-100 text-green-800'
      case 'bug': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            Active Feedback
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => onFilterChange('all')}
            >
              All ({stats.total})
            </Button>
            <Button 
              variant={filter === 'new' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => onFilterChange('new')}
            >
              New ({stats.new})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {feedbacks.map((feedback) => (
            <div key={feedback.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{feedback.subject}</h3>
                    <Badge className={getCategoryColor(feedback.category)}>
                      {feedback.category}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span>{feedback.name}</span>
                    <span>{feedback.email}</span>
                    <div className="flex items-center gap-1">
                      {feedback.date}
                    </div>
                    <div className="flex items-center gap-1">
                      {renderStars(feedback.rating)}
                      <span className="ml-1">({feedback.rating}/5)</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700">{feedback.message}</p>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onArchive(feedback.id)}
                    className="flex items-center gap-1"
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onDelete(feedback.id)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {feedbacks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No feedback found for the selected filter.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default FeedbackList