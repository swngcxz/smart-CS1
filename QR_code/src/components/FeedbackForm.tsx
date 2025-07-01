
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, User, Mail } from "lucide-react";

const FeedbackForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !suggestion.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and suggestion.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Thank You!",
        description: "Your suggestion has been submitted successfully.",
      });
      
      // Reset form
      setName("");
      setEmail("");
      setSuggestion("");
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={32} className="text-green-600" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Share Your Thoughts
          </h2>
          <p className="text-lg text-gray-600">
            Help us improve our Smart Waste Management System with your valuable feedback and suggestions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 shadow-lg">
          <div className="space-y-6">
            <div className="relative">
              <User size={20} className="absolute left-3 top-3 text-green-600" />
              <input
                type="text"
                placeholder="Your Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200"
                required
              />
            </div>

            <div className="relative">
              <Mail size={20} className="absolute left-3 top-3 text-green-600" />
              <input
                type="email"
                placeholder="Your Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200"
              />
            </div>

            <div className="relative">
              <MessageSquare size={20} className="absolute left-3 top-3 text-green-600" />
              <Textarea
                placeholder="Share your suggestions, comments, or ideas to help us improve our waste management system... *"
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                className="w-full pl-12 pr-4 py-3 min-h-[120px] border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 resize-none"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-medium rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send size={20} />
                  Submit Suggestion
                </div>
              )}
            </Button>
          </div>
        </form>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Your feedback helps us create a more sustainable future for everyone.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FeedbackForm;