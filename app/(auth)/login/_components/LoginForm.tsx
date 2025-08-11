"use client";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import {
  Card,
  CardTitle,
  CardHeader,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, signIn, useSession } from "@/lib/auth-client"; // Adjust the import path as necessary
import { toast } from "sonner";
import { useTransition, useState, useEffect } from "react";
import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";

const LoginForm = () => {
  const [googlePending, startGoogleTransition] = useTransition();
  const [emailPending, startEmailTransition] = useTransition();
  const [email, setEmail] = useState("");
  const router = useRouter();

  async function handleGoogleSignIn() {
    startGoogleTransition(async () => {
      await signIn.social({
        provider: "google",
        callbackURL: "/",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed in with Google , you will be redirected ...");
          },
          onError: (e) => {
            console.log(e.error);
            toast.error("Failed to sign in with Google, please try again.");
          },
        },
      });
      await authClient.revokeOtherSessions();
    });
  }

  function handleEmailSignIn() {
    startEmailTransition(async () => {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Verification code sent to your email.");
            router.push(`/verify-request?email=${email}`);
          },
          onError: () => {
            toast.error("Failed to send verification code, please try again.");
          },
        },
      });
      await authClient.revokeOtherSessions();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome Back !</CardTitle>
        <CardDescription>Login using your Gmail account</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button
          disabled={googlePending}
          onClick={() => {
            handleGoogleSignIn();
          }}
          className="w-full"
          variant="outline"
        >
          {googlePending ? (
            <>
              <Loader2 className="animate-spin size-4" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              {" "}
              <FcGoogle className="mr-2 h-5 w-5" />
              Continue with Google
            </>
          )}
        </Button>
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-card px-2">Or continue with</span>
        </div>

        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="email@example.com"
            />
          </div>
          <Button disabled={emailPending} onClick={handleEmailSignIn}>
            {emailPending ? (
              <Loader2 className="animate-spin size-4" />
            ) : (
              <>
                <Send className="mr-1 h-5 w-5" />
                <span> Continue with Email</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
