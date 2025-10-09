import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

/**
 * Demo constants/keys
 */
const OTP_LENGTH = 6;
const OTP_STORAGE_KEY = "demo_expected_otp";
const RESEND_SECONDS = 60;

/**
 * Utility: generate 6-digit OTP (leading zeros allowed)
 */
function generateOtp(): string {
  const n = Math.floor(Math.random() * 1_000_000); // 0..999999
  return n.toString().padStart(OTP_LENGTH, "0");
}

export default function OtpVerification() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Each digit is a separate input
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState<number>(RESEND_SECONDS);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Read the expected OTP from sessionStorage (generated on mount and on resend)
  const expectedOtp = useMemo(() => sessionStorage.getItem(OTP_STORAGE_KEY) ?? "", []);

  // On mount: if no OTP exists, generate one and start timer
  useEffect(() => {
    if (!sessionStorage.getItem(OTP_STORAGE_KEY)) {
      const otp = generateOtp();
      sessionStorage.setItem(OTP_STORAGE_KEY, otp);
      // DEMO: show in console only
       
      console.log("[DEMO] Generated OTP:", otp);
      toast({
        title: "Verification code sent",
        description: "We’ve sent a 6-digit code to your email (demo).",
      });
    }

    setSecondsLeft(RESEND_SECONDS);
    const t = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleVerify = () => {
    const stored = sessionStorage.getItem(OTP_STORAGE_KEY);
    if (!stored) {
      toast({
        title: "Code expired",
        description: "Please resend a new verification code.",
        variant: "destructive",
      });
      return;
    }
    if (code === stored) {
      toast({
        title: "Verified successfully",
        description: "Your email has been confirmed.",
      });
      // Clear demo OTP
      sessionStorage.removeItem(OTP_STORAGE_KEY);
      // Navigate to your landing/home or next step
      navigate("/");
    } else {
      toast({
        title: "Invalid code",
        description: "Please check the digits and try again.",
        variant: "destructive",
      });
    }
  };

  const handleResend = () => {
    if (secondsLeft > 0) return;
    const newOtp = generateOtp();
    sessionStorage.setItem(OTP_STORAGE_KEY, newOtp);
    // DEMO: show in console only
     
    console.log("[DEMO] Resent OTP:", newOtp);

    setDigits(Array(OTP_LENGTH).fill(""));
    focusInput(0);
    setSecondsLeft(RESEND_SECONDS);
    toast({
      title: "New code sent",
      description: "We’ve sent a fresh code to your email.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Verify Code</CardTitle>
          <CardDescription>Enter the 6-digit code we sent to your email</CardDescription>
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
              />
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={!canVerify}
              onClick={handleVerify}
            >
              Verify
            </Button>

            <button
              type="button"
              onClick={handleResend}
              disabled={secondsLeft > 0}
              className="w-full text-sm text-green-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : "Resend Code"}
            </button>

           <div className="text-center text-sm">
          <Link to="/" className="text-green-700 hover:underline">
            Back to Login
          </Link>
        </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
