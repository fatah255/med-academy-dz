import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
});

export const { signIn, signUp, useSession, signOut } = authClient;
