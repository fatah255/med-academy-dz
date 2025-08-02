import { auth } from "@/lib/auth"; // path to your auth file
import { toNextJsHandler } from "better-auth/next-js";

let POST, GET;

try {
  const handlers = toNextJsHandler(auth);
  POST = handlers.POST;
  GET = handlers.GET;
} catch (e) {
  console.error("Auth Handler Error:", e);
}

// ✅ export after assignment
export { POST, GET };
