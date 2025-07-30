import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast"; 

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast(); 

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Password reset requested");

    toast({
      title: "Password reset email sent",
      description: "Check your inbox for instructions.",
    });

    navigate("/verify-otp"); // Redirect to OTP verification page
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Reset Password</CardTitle>
          <CardDescription>Enter your email to receive reset instructions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" required />
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
              Send Reset Link
            </Button>
          </form>

          <div className="text-center text-sm">
            Remember your password?{" "}
            <Link to="/" className="text-green-600 hover:underline">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
