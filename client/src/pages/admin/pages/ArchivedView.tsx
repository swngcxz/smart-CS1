import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Archive, Star, Calendar, ArrowLeft } from "lucide-react"

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

interface ArchivedViewProps {
  archivedFeedbacks: FeedbackItem[]
  onBack: () => void
  onUnarchive: (id: number) => void
  onDelete: (id: number) => void
}

const ArchivedView = ({ archivedFeedbacks, onBack, onUnarchive, onDelete }: ArchivedViewProps) => {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Feedback Archived ({archivedFeedbacks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {archivedFeedbacks.map((feedback) => (
              <div key={feedback.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{feedback.subject}</h3>
                      <Badge className={getCategoryColor(feedback.category)}>
                        {feedback.category}
                      </Badge>
                      <Badge variant="secondary">Archived</Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span>{feedback.name}</span>
                      <span>{feedback.email}</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
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
                      onClick={() => onUnarchive(feedback.id)}
                      className="flex items-center gap-1"
                    >
                      <Archive className="w-4 h-4" />
                      Unarchive
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
            
            {archivedFeedbacks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No archived feedback found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ArchivedView