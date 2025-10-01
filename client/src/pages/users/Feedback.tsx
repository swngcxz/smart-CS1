import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { QrCode, Star, Send, MessageSquare, User, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Feedback = () => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [userName, setUserName] = useState("");
  const [binId, setBinId] = useState("TB001");
  const [submitted, setSubmitted] = useState(false);

  const handleStarClick = (starValue: number) => {
    setRating(starValue);
  };

  const handleSubmit = () => {
    if (rating === 0 || !feedback.trim()) {
      toast({
        title: "Incomplete Feedback",
        description: "Please provide both a rating and feedback message.",
        variant: "destructive",
      });
      return;
    }

    // Simulate submission
    setTimeout(() => {
      setSubmitted(true);
      toast({
        title: "Feedback Submitted!",
        description: "Thank you for helping us improve our waste management system.",
        className: "bg-green-50 border-green-200 text-green-800",
      });
    }, 1000);
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-8 w-8 cursor-pointer transition-colors duration-200 ${
          i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 hover:text-yellow-300"
        }`}
        onClick={() => handleStarClick(i + 1)}
      />
    ));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-green-200 shadow-lg">
          <CardContent className="pt-6 text-center">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
              <p className="text-gray-600">Your feedback has been submitted successfully.</p>
            </div>
            <Button onClick={() => setSubmitted(false)} className="bg-green-600 hover:bg-green-700 text-white">
              Submit Another Feedback
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8 mt-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Feedback</h1>
          <p className="text-gray-600">Help us improve our smart waste management system</p>
        </div>

        {/* QR Code Info */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <QrCode className="h-12 w-12 text-green-600" />
              <div>
                <h3 className="font-semibold text-gray-900">QR Code Scanned</h3>
                <p className="text-sm text-gray-600">Location: Main Street & 5th Ave</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Form */}
        <Card className="border-green-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-green-600" />
              <span>Share Your Experience</span>
            </CardTitle>
            <CardDescription>Your feedback helps us maintain and improve our waste collection services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Name */}
            <div className="space-y-2">
              <Label htmlFor="userName">Name (Optional)</Label>
              <Input
                id="userName"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="border-green-200 focus:border-green-500"
              />
            </div>

            {/* Rating */}
            <div className="space-y-3">
              <Label>Rate Your Experience</Label>
              <div className="flex space-x-1">{renderStars()}</div>
              <p className="text-sm text-gray-500">
                {rating === 0 && "Please select a rating"}
                {rating === 1 && "Poor - Needs significant improvement"}
                {rating === 2 && "Fair - Below expectations"}
                {rating === 3 && "Good - Meets expectations"}
                {rating === 4 && "Very Good - Above expectations"}
                {rating === 5 && "Excellent - Exceeds expectations"}
              </p>
            </div>

            {/* Feedback Text */}
            <div className="space-y-2">
              <Label htmlFor="feedback">Your Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Please share your thoughts about the waste bin condition, accessibility, or any issues you encountered..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="border-green-200 focus:border-green-500 resize-none"
              />
              <p className="text-sm text-gray-500">{feedback.length}/500 characters</p>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              className="w-full bg-green-600 hover:bg-green-700 text-white transition-colors duration-200"
              size="lg"
            >
              <Send className="h-4 w-4 mr-2" />
              Submit Feedback
            </Button>
          </CardContent>
        </Card>

        {/* Recent Feedback */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">Recent Community Feedback</CardTitle>
            <CardDescription>See what others are saying</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex space-x-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">by Anonymous</span>
                </div>
                <p className="text-sm text-gray-700">"The bin was clean and easily accessible. Great location!"</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex space-x-1">
                    {Array.from({ length: 4 }, (_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    ))}
                    <Star className="h-4 w-4 text-gray-300" />
                  </div>
                  <span className="text-sm text-gray-600">by John D.</span>
                </div>
                <p className="text-sm text-gray-700">
                  "Bin was almost full when I used it. Maybe needs more frequent collection."
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Feedback;


