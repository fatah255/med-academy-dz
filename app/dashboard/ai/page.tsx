import FileUpload from "@/components/FileUpload";
import OpenAI from "openai";

const Page = async () => {
  // const openai = new OpenAI({
  //   apiKey: process.env.OPENAI_API_KEY,
  //   organization: process.env.OPENAI_ORG_ID,
  // });
  const openai = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: process.env.DEEPSEEKER_API_KEY,
  });

  // const response = await openai.responses.create({
  //   model: "gpt-4.1",
  //   input: "Tell me a three sentence bedtime story about a unicorn.",
  // });
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: "You are a helpful assistant." }],
    model: "deepseek-chat",
  });
  return (
    <div>
      {JSON.stringify(completion, null, 2)}
      {/* <FileUpload /> */}
    </div>
  );
};

export default Page;
