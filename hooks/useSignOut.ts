"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const useSignOut = () => {
  const router = useRouter();
  const signOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          toast.success("You have been signed out successfully.");
        },
        onError: () => {
          toast.error("Failed to sign out, please try again.");
        },
      },
    });
  };
  return signOut;
};

export default useSignOut;
