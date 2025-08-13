import { ChargilyClient } from "@chargily/chargily-pay";

const client = new ChargilyClient({
  api_key: process.env.CHARGILY_SECRET_API_KEY!,
  mode: "test", // Change to 'live' when deploying your application
});
