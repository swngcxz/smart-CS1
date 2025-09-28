import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useForgotPassword } from "@/hooks/useForgotPassword";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function PasswordResetOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { verifyOtp, resetPassword, resendOtp, loading, error } = useForgotPassword();

  // Get email from location state
  const email = location.state?.email;
  
  // Each digit is a separate input
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState<number>(RESEND_SECONDS);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<'otp' | 'password'>('otp');
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      toast({
        title: "Error",
        description: "No email found. Please request password reset again.",
        variant: "destructive",
      });
      navigate('/forgot-password');
    }
  }, [email, navigate, toast]);

  // Start countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helpers
  const focusInput = (index: number) => {
    const el = inputsRef.current[index];
    el?.focus();
    el?.select();
  };

  const handleChange = (index: number, value: string) => {
    // Accept only digits
    const v = value.replace(/\D/g, "");
    if (!v) {
      // Clear current
      setDigits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }

    const chars = v.split("");
    setDigits((prev) => {
      const next = [...prev];
      next[index] = chars[0]; // First digit goes here
      // If user pasted/typed multiple digits, spread into subsequent boxes
      for (let i = 1; i < chars.length && index + i < OTP_LENGTH; i++) {
        next[index + i] = chars[i];
      }
      return next;
    });

    // Move focus appropriately
    const nextIndex = Math.min(index + chars.length, OTP_LENGTH - 1);
    focusInput(nextIndex);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        // Clear current
        setDigits((prev) => {
          const next = [...prev];
          next[index] = "";
          return next;
        });
      } else if (index > 0) {
        // Move to previous
        focusInput(index - 1);
        setDigits((prev) => {
          const next = [...prev];
          next[index - 1] = "";
          return next;
        });
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!text) return;

    const arr = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < text.length; i++) arr[i] = text[i];
    setDigits(arr);
    // Move focus to last filled
    const last = Math.max(text.length - 1, 0);
    focusInput(last);
  };

  const canVerify = digits.every((d) => d.length === 1);
  const code = digits.join("");

  const handleVerifyOtp = async () => {
    if (!email) return;

    const result = await verifyOtp(email, code);
    
    if (result.success) {
      toast({
        title: "OTP Verified",
        description: "Please set your new password.",
      });
      setStep('password');
    } else {
      toast({
        title: "Invalid OTP",
        description: result.error || "Please check the code and try again.",
        variant: "destructive",
      });
      // Clear OTP inputs
      setDigits(Array(OTP_LENGTH).fill(""));
      focusInput(0);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || !email) return;
    
    const result = await resendOtp(email);
    
    if (result.success) {
      setDigits(Array(OTP_LENGTH).fill(""));
      focusInput(0);
      setSecondsLeft(RESEND_SECONDS);
      toast({
        title: "New code sent",
        description: "We've sent a fresh code to your email.",
      });
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleSetPassword = async () => {
    if (!email || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    const result = await resetPassword(email, code, newPassword);
    
    if (result.success) {
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset. You can now log in.",
      });
      navigate('/login');
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  if (!email) {
    return null; // Will redirect in useEffect
  }

  if (step === 'password') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">Set New Password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-2 relative">
              <label className="text-sm font-medium">New Password</label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <div className="space-y-2 relative">
              <label className="text-sm font-medium">Confirm Password</label>
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <Button 
              onClick={handleSetPassword}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? "Setting Password..." : "Set Password"}
            </Button>

            <div className="text-center text-sm">
              <button
                onClick={() => setStep('otp')}
                className="text-green-600 hover:underline"
              >
                Back to OTP verification
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Verify Code</CardTitle>
          <CardDescription>
            Enter the 6-digit code we sent to<br />
            <span className="font-medium">{email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* OTP Inputs */}
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <Input
                key={i}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digits[i] ?? ""}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                ref={(el) => (inputsRef.current[i] = el)}
                className="w-12 h-12 text-center text-lg"
                aria-label={`Digit ${i + 1}`}
                disabled={loading}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={!canVerify || loading}
              onClick={handleVerifyOtp}
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>

            <button
              type="button"
              onClick={handleResend}
              disabled={secondsLeft > 0 || loading}
              className="w-full text-sm text-green-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : "Resend Code"}
            </button>

            <div className="text-center text-sm">
              <button
                onClick={() => navigate('/login')}
                className="text-green-700 hover:underline"
              >
                Back to Login
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
