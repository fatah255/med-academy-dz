"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const useSignOut = () => {
  const router = useRouter();

  const signOut = async () => {
    try {
      // if your auth runs on the same origin, this is enough:
      await authClient.signOut();

      // if auth API is on another subdomain, send cookies:
      // await authClient.signOut({ fetchOptions: { credentials: "include" } });

      toast.success("You have been signed out successfully.");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error("Failed to sign out, please try again.");
      // Optional: console.error(err);
    }
  };

  return signOut;
};

export default useSignOut;
