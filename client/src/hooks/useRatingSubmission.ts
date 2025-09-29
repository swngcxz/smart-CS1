export const useRatingSubmission = () => {
  const handleRate = async (rating: number) => {
    // Send rating to backend
    try {
      const api = await import('@/lib/api');
      await api.default.post('/api/ratings', {
        rating,
        userAgent: navigator.userAgent,
        ipAddress: '', // Will be captured by backend
      });
      console.log('Rating submitted successfully:', rating);
      return true;
    } catch (error) {
      console.error('Failed to submit rating:', error);
      return false;
    }
  };

  return {
    handleRate,
  };
};
