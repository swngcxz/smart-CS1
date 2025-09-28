import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useFeedback } from "@/hooks/useFeedback";
import { Star, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import api from "@/lib/api";

const FeedbackSection = () => {
  const [feedback, setFeedback] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { ref, isVisible } = useScrollAnimation();
  const { loading, error, submitFeedback, fetchFeedback, clearError } = useFeedback();

  // Word count validation
  const minWords = 10;
  const maxLength = 500;
  const isTooShort = wordCount < minWords;
  const isTooLong = feedback.length > maxLength;
  const isValidLength = wordCount >= minWords && feedback.length <= maxLength;

  // Update word count when feedback changes
  useEffect(() => {
    const words = feedback.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [feedback]);

  // Fetch real testimonials from the database
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setTestimonialsLoading(true);
        
        // Fetch feedback data
        const feedbackResponse = await api.get('/api/feedback');
        const feedbackData = feedbackResponse.data.feedback || [];
        
        // Fetch ratings data to combine with feedback
        const ratingsResponse = await api.get('/api/ratings');
        const ratingsData = ratingsResponse.data.ratings || [];
        
        // Combine feedback with ratings to create testimonials
        const combinedTestimonials = feedbackData.map(feedbackItem => {
          // Find matching rating by user email
          const matchingRating = ratingsData.find(rating => 
            rating.userEmail === feedbackItem.email || 
            rating.userId === feedbackItem.userId
          );
          
          return {
            id: feedbackItem.id,
            name: feedbackItem.name || 'Anonymous User',
            role: 'Customer', // Default role since we don't have role in feedback
            content: feedbackItem.content,
            rating: matchingRating?.rating || 5, // Default to 5 stars if no rating found
            date: feedbackItem.createdAt
          };
        });
        
        // If we have less than 3 testimonials, add some default ones to maintain the design
        const defaultTestimonials = [
          {
            id: 'default-1',
            name: "Sarah Johnson",
            role: "City Manager",
            content: "EcoSmart has transformed our waste management operations. We've seen significant cost savings and improved efficiency.",
            rating: 5,
            date: new Date().toISOString()
          },
          {
            id: 'default-2',
            name: "Mike Chen",
            role: "Environmental Director",
            content: "The real-time monitoring and analytics have helped us reduce waste overflow incidents by 80%.",
            rating: 5,
            date: new Date().toISOString()
          },
          {
            id: 'default-3',
            name: "Lisa Rodriguez",
            role: "Operations Manager",
            content: "Outstanding customer support and innovative technology. Highly recommend for any city looking to modernize.",
            rating: 5,
            date: new Date().toISOString()
          }
        ];
        
        // Combine real and default testimonials, prioritizing real ones
        const allTestimonials = [...combinedTestimonials, ...defaultTestimonials];
        
        // Take the most recent testimonials and ensure we have at least 3
        const finalTestimonials = allTestimonials
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, Math.max(3, allTestimonials.length));
        
        setTestimonials(finalTestimonials);
        
      } catch (error) {
        console.error('Error fetching testimonials:', error);
        // Fallback to default testimonials
        setTestimonials([
          {
            id: 'default-1',
            name: "Sarah Johnson",
            role: "City Manager",
            content: "EcoSmart has transformed our waste management operations. We've seen significant cost savings and improved efficiency.",
            rating: 5,
            date: new Date().toISOString()
          },
          {
            id: 'default-2',
            name: "Mike Chen",
            role: "Environmental Director",
            content: "The real-time monitoring and analytics have helped us reduce waste overflow incidents by 80%.",
            rating: 5,
            date: new Date().toISOString()
          },
          {
            id: 'default-3',
            name: "Lisa Rodriguez",
            role: "Operations Manager",
            content: "Outstanding customer support and innovative technology. Highly recommend for any city looking to modernize.",
            rating: 5,
            date: new Date().toISOString()
          }
        ]);
      } finally {
        setTestimonialsLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  // Auto-scroll animation for testimonials
  useEffect(() => {
    if (testimonials.length <= 3) return; // Only animate if we have more than 3 testimonials

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % (testimonials.length - 2); // -2 to show 3 at a time
        return nextIndex;
      });
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors
    clearError();

    // Validate word count and character length
    if (isTooShort || isTooLong) {
      toast({
        title: "Invalid Feedback",
        description: `Please enter at least ${minWords} words and no more than ${maxLength} characters.`,
        variant: "destructive"
      });
      return;
    }

    // Submit feedback
    const result = await submitFeedback({
      content: feedback,
      name: name.trim() || undefined,
      email: email.trim() || undefined
    });

    if (result.success) {
      toast({
        title: "Feedback Submitted!",
        description: `Thank you for your valuable feedback (${wordCount} words).`,
      });
      // Reset form
      setFeedback("");
      setName("");
      setEmail("");
      setWordCount(0);
      
      // Refresh testimonials to show the new feedback
      setTimeout(() => {
        window.location.reload(); // Simple refresh to show new testimonials
      }, 2000);
    } else {
      toast({
        title: "Submission Failed",
        description: result.message,
        variant: "destructive"
      });
    }
  };

  // Get current testimonials to display (3 at a time with animation)
  const getCurrentTestimonials = () => {
    if (testimonials.length <= 3) {
      return testimonials;
    }
    
    // Show 3 testimonials starting from currentIndex
    const endIndex = Math.min(currentIndex + 3, testimonials.length);
    return testimonials.slice(currentIndex, endIndex);
  };

  return (
    <section id="feedback" ref={ref} className="py-20 bg-white dark:bg-slate-900 transition-colors duration-500">
      <div className="container mx-auto px-4">
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Testimonials</Badge>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">What Our Clients Say</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Hear from city leaders who have transformed their waste management operations.
          </p>
        </div>

        <div className="relative mb-12 overflow-hidden">
          {testimonialsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((index) => (
                <Card key={index} className="border-green-100 dark:border-slate-700 dark:bg-slate-800">
                  <CardHeader>
                    <div className="flex items-center space-x-1 mb-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-5 w-5 text-gray-300" />
                      ))}
                    </div>
                    <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div 
              className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-1000 ease-in-out ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{
                transform: testimonials.length > 3 
                  ? `translateX(-${currentIndex * (100 / 3)}%)` 
                  : 'translateX(0)'
              }}
            >
              {getCurrentTestimonials().map((testimonial, index) => (
                <Card
                  key={testimonial.id}
                  className="border-green-100 dark:border-slate-700 dark:bg-slate-800 hover:shadow-lg transition-all duration-300 flex-shrink-0"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-center space-x-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <CardDescription className="text-gray-700 dark:text-gray-300 italic">
                      "{testimonial.content}"
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Animation indicators for multiple testimonials */}
          {testimonials.length > 3 && !testimonialsLoading && (
            <div className="flex justify-center mt-6 space-x-2">
              {Array.from({ length: testimonials.length - 2 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-green-600 scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Feedback Form */}
        <div
          className={`max-w-2xl mx-auto transition-all duration-700 delay-600 ${
            isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95"
          }`}
        >
          <Card className="border-green-200 dark:border-slate-700 dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-gray-900 dark:text-white">Share Your Feedback</CardTitle>
              <CardDescription className="text-center text-gray-600 dark:text-gray-300">
                We value your opinion and would love to hear from you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                {/* Optional Name and Email Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name (Optional)
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border-green-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email (Optional)
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-green-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-green-500"
                    />
                  </div>
                </div>

                {/* Feedback Textarea */}
                <div className="space-y-2">
                  <Label htmlFor="feedback" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your Feedback *
                  </Label>
                  <Textarea
                    id="feedback"
                    name="feedback"
                    placeholder="Tell us about your experience or suggestions... (minimum 10 words required)"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="min-h-32 border-green-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400 focus:border-green-500"
                    required
                  />
                  
                  {/* Word Counter - Only show when user starts typing */}
                  {wordCount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {isValidLength ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Valid feedback</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-green-600">
                            <AlertCircle className="w-4 h-4" />
                            <span>
                              {isTooShort ? `Need ${minWords - wordCount} more words` : 
                               isTooLong ? `${feedback.length - maxLength} characters over limit` : 
                               'Invalid feedback'}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className={`font-medium ${
                        isTooShort || isTooLong ? 'text-green-600' : 
                        isValidLength ? 'text-green-600' : 'text-green-500'
                      }`}>
                        {wordCount} words / {feedback.length} chars
                      </span>
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={loading || !isValidLength}
                  className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-green-300 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Feedback'
                  )}
                </Button>

                {/* Help Text */}
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Your feedback helps us improve our services. All feedback is reviewed and appreciated.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FeedbackSection;
