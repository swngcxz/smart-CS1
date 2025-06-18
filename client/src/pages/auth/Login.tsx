import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Recycle } from "lucide-react";
import { useNavigate } from "react-router-dom";
type LoginProps = {
  onOpenRegister?: () => void;
  onClose?: () => void;
};

const Login = ({ onOpenRegister, onClose }: LoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const handleGoogleSignIn = () => {
    console.log("Google Sign In clicked");
    alert("Google Sign In clicked - Demo only");
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Login Successful",
      description: "Welcome back!",
    });

    console.log("Email login submitted", { email, password });
    navigate("/admin");
  };

  return (
    <Card className="w-full max-w-md relative bg-white dark:bg-slate-900">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-2xl font-bold text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white z-10"
      >
        ×
      </button>

      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Recycle className="w-8 h-8 text-green-600" />
          <span className="text-xl font-bold text-green-800 dark:text-green-400">ECOBIN</span>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</CardTitle>
        <CardDescription className="dark:text-gray-400">
          Sign in to access your waste monitoring dashboard
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button
          onClick={handleGoogleSignIn}
          variant="outline"
          className="w-full flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-slate-800"
        >
          {/* Google SVG */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full dark:bg-gray-600" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-2 text-muted-foreground dark:text-gray-400">
              Or continue with
            </span>
          </div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="dark:text-gray-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="dark:bg-slate-800 dark:text-white dark:border-gray-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="dark:text-gray-300">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="dark:bg-slate-800 dark:text-white dark:border-gray-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
          >
            Sign In
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link to="/forgot-password" className="text-green-600 hover:underline dark:text-green-400">
            Forgot your password?
          </Link>
        </div>

        <div className="text-center text-sm">
          Don’t have an account?{" "}
          <button onClick={onOpenRegister} className="text-green-600 hover:underline dark:text-green-400">
            Sign up
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Login;
