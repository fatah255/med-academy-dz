"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

const VerifyRequest = () => {
  const [otp, setOtp] = useState("");
  const [emailPending, startEmailTransition] = useTransition();
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";

  const handleVerify = () => {
    startEmailTransition(async () => {
      await authClient.signIn.emailOtp({
        otp,
        email,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Email verified successfully, redirecting...");
            router.push("/");
          },
          onError: (error) => {
            console.error(error);
            toast.error("Failed to verify email, please try again.");
          },
        },
      });
    });
  };

  return (
    <Card className="w-full flex flex-col gap-4">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Please verify your email</CardTitle>
        <CardDescription>
          We have sent a verification email to your inbox. Please check your
          email and paste the code
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center space-y-3 mb-4">
          <InputOTP value={otp} onChange={(v) => setOtp(v)} maxLength={6}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <p className="text-sm text-muted-foreground text-center my-4 ">
          Enter the code sent to your email
        </p>
        <Button
          onClick={handleVerify}
          disabled={emailPending}
          className="w-full"
        >
          Verify
        </Button>
      </CardContent>
    </Card>
  );
};

export default VerifyRequest;
