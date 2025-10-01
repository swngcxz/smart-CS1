import { useState } from 'react';
import api from '@/lib/api';

interface FeedbackData {
  content: string;
  name?: string;
  email?: string;
  rating?: number;
}

interface Feedback {
  id: string;
  content: string;
  name: string;
  email: string;
  userId?: string;
  rating?: number | null;
  timestamp: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'resolved';
  category: 'general' | 'bug' | 'feature' | 'complaint' | 'praise';
  subcategory?: string;
  sentiment?: 'positive' | 'negative' | 'suggestion' | 'neutral';
  sentimentConfidence?: number;
  topics?: string[];
  characterCount?: number;
}

interface FeedbackStats {
  totalFeedback: number;
  recentFeedback: number;
  averageLength: number;
}

interface UseFeedbackReturn {
  // State
  loading: boolean;
  error: string | null;
  feedback: Feedback[];
  stats: FeedbackStats | null;
  
  // Actions
  submitFeedback: (data: FeedbackData) => Promise<{ success: boolean; message: string; characterCount?: number }>;
  fetchFeedback: (limit?: number, offset?: number) => Promise<void>;
  fetchStats: () => Promise<void>;
  clearError: () => void;
}

export const useFeedback = (): UseFeedbackReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);

  const submitFeedback = async (data: FeedbackData): Promise<{ success: boolean; message: string; characterCount?: number }> => {
    setLoading(true);
    setError(null);

    try {
      // Validate content (minimum 10 words, maximum 500 characters)
      const trimmedContent = data.content.trim();
      
      // Count words
      const words = trimmedContent.split(/\s+/).filter(word => word.length > 0);
      const wordCount = words.length;
      
      if (wordCount < 10) {
        throw new Error(`Feedback must contain at least 10 words. Current: ${wordCount} words.`);
      }
      if (trimmedContent.length > 500) {
        throw new Error(`Feedback must not exceed 500 characters. Current: ${trimmedContent.length} characters.`);
      }


      const response = await api.post('/api/feedback', {
        content: trimmedContent,
        name: data.name,
        email: data.email,
        rating: data.rating
      });

      setLoading(false);
      return {
        success: true,
        message: response.data.message,
        characterCount: response.data.characterCount
      };
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to submit feedback';
      setError(errorMessage);
      setLoading(false);
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const fetchFeedback = async (limit: number = 20, offset: number = 0): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/api/feedback', {
        params: { limit, offset }
      });
      
      setFeedback(response.data.feedback);
      setLoading(false);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to fetch feedback';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const fetchStats = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/api/feedback/stats/overview');
      setStats(response.data);
      setLoading(false);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to fetch feedback stats';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    loading,
    error,
    feedback,
    stats,
    submitFeedback,
    fetchFeedback,
    fetchStats,
    clearError
  };
};
