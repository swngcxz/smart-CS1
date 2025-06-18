import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Star } from "lucide-react";

const FeedbackSection = () => {
  const [feedback, setFeedback] = useState("");
  const { ref, isVisible } = useScrollAnimation();

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Feedback Submitted!",
      description: "Thank you for your valuable feedback.",
    });
    setFeedback("");
  };

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "City Manager",
      content:
        "EcoSmart has transformed our waste management operations. We've seen significant cost savings and improved efficiency.",
      rating: 5,
    },
    {
      name: "Mike Chen",
      role: "Environmental Director",
      content: "The real-time monitoring and analytics have helped us reduce waste overflow incidents by 80%.",
      rating: 5,
    },
    {
      name: "Lisa Rodriguez",
      role: "Operations Manager",
      content:
        "Outstanding customer support and innovative technology. Highly recommend for any city looking to modernize.",
      rating: 5,
    },
  ];

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className={`border-green-100 dark:border-slate-700 dark:bg-slate-800 hover:shadow-lg transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 200 + 300}ms` }}
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
                <Textarea
                  name="feedback"
                  placeholder="Tell us about your experience or suggestions..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-32 border-green-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400 focus:border-green-500"
                  required
                />
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Submit Feedback
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FeedbackSection;
