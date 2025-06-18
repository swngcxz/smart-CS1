import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Star } from "lucide-react"

const FeedbackSection = () => {
  const [feedback, setFeedback] = useState("");

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
      content: "EcoSmart has transformed our waste management operations. We've seen significant cost savings and improved efficiency.",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Environmental Director",
      content: "The real-time monitoring and analytics have helped us reduce waste overflow incidents by 80%.",
      rating: 5
    },
    {
      name: "Lisa Rodriguez",
      role: "Operations Manager",
      content: "Outstanding customer support and innovative technology. Highly recommend for any city looking to modernize.",
      rating: 5
    }
  ];

  return (
    <section id="feedback" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-green-100 text-green-800">Testimonials</Badge>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Hear from city leaders who have transformed their waste management operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-green-100 hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <CardDescription className="text-gray-700 italic">
                  "{testimonial.content}"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feedback Form */}
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-gray-900">Share Your Feedback</CardTitle>
              <CardDescription className="text-center">
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
                  className="min-h-32 border-green-200 focus:border-green-500"
                  required
                />
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
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
