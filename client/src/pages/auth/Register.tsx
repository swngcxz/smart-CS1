import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import React, { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Eye, EyeOff } from "lucide-react";

import { Recycle } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

type RegisterProps = {
  onOpenLogin?: () => void;
  onClose?: () => void;
};
const Register = ({ onClose, onOpenLogin }: RegisterProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleGoogleSignUp = () => {
    window.location.href = 'http://localhost:8000/auth/google';
  };

  const { signup, loading } = useAuth();
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    try {
      await signup(name, email, password);
    } catch (error) {
      // Error handling is done in the context
      console.error('Signup failed:', error);
    }
  };

  return (
    <Card className="w-full max-w-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
      <CardHeader className="relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl font-bold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
        >
          ×
        </button>

        <div className="flex items-center justify-center gap-2 mb-4">
          <img src="../public/logo-final2.png" alt="EcoBin Logo" className="w-8 h-8 align-middle" />
          <span className="text-xl font-bold text-green-800 dark:text-green-400">ECOBIN</span>
        </div>

       <CardTitle className="pt-4 text-2xl font-bold text-gray-900 dark:text-white">
Create Account</CardTitle>

      </CardHeader>

      <CardContent className="space-y-4">
        <Button
          onClick={handleGoogleSignUp}
          variant="outline"
          className="w-full flex items-center justify-center gap-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
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
            <span className="bg-white dark:bg-gray-900 px-2 text-muted-foreground dark:text-gray-400">
              Or continue with
            </span>
          </div>
        </div>

        <form onSubmit={handleEmailRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="dark:text-gray-300">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="dark:text-gray-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
     <div className="space-y-2 relative">
  <Label htmlFor="password" className="dark:text-gray-300">
    Password
  </Label>
  <Input
    id="password"
    type={showPassword ? "text" : "password"}
    placeholder="Create a password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 pr-10"
  />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-9 text-gray-500 dark:text-gray-300 hover:text-gray-700"
  >
    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
  </button>
</div>

<div className="space-y-2 relative">
  <Label htmlFor="confirmPassword" className="dark:text-gray-300">
    Confirm Password
  </Label>
  <Input
    id="confirmPassword"
    type={showConfirmPassword ? "text" : "password"}
    placeholder="Confirm your password"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 pr-10"
  />
  <button
    type="button"
    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
    className="absolute right-3 top-9 text-gray-500 dark:text-gray-300 hover:text-gray-700"
  >
    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
  </button>
</div>

          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="text-center text-sm">
          Already have an account?{" "}
          <button onClick={onOpenLogin} className="text-green-600 dark:text-green-400 hover:underline">
            Sign in
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Register;
