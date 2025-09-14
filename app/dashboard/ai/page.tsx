// import FileUpload from "@/components/FileUpload";
// import AIMessage from "./_components/MessageRender";

// const Page = async () => {
//   const response = await fetch(
//     "https://openrouter.ai/api/v1/chat/completions",
//     {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         // model: "google/gemma-3-27b-it:free",
//         model: "meta-llama/llama-3.1-405b-instruct:free",

//         messages: [
//           {
//             role: "user",
//             content: [
//               {
//                 type: "text",
//                 text: "expliquer moi cet document en francais",
//               },
//               {
//                 type: "file",
//                 file: {
//                   filename: "document.pdf",
//                   file_data:
//                     "https://medacademydz.t3.storage.dev/0167baa8-6bcc-4921-b9be-a109a331bc30-02_-_series_numeriques_cours_complet-2.pdf",
//                 },
//               },
//             ],
//           },
//         ],
//         max_tokens: 1000,

//         plugins: [
//           {
//             id: "file-parser",
//             pdf: {
//               engine: "pdf-text",
//             },
//           },
//         ],
//       }),
//     }
//   );

//   const structuredResponse = await fetch(
//     "https://openrouter.ai/api/v1/chat/completions",
//     {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         // model: "google/gemma-3-27b-it:free",
//         // model: "qwen/qwen3-coder:free",
//         // model: "tngtech/deepseek-r1t2-chimera:free",
//         model: "meta-llama/llama-3.1-405b-instruct:free",

//         messages: [
//           { role: "user", content: "What is the weather like in London?" },
//         ],
//         response_format: {
//           type: "json_schema",
//           json_schema: {
//             name: "weather",
//             strict: true,
//             schema: {
//               type: "object",
//               properties: {
//                 location: {
//                   type: "string",
//                   description: "City or location name",
//                 },
//                 temperature: {
//                   type: "number",
//                   description: "Temperature in Celsius",
//                 },
//                 conditions: {
//                   type: "string",
//                   description: "Weather conditions description",
//                 },
//               },
//               required: ["location", "temperature", "conditions"],
//               additionalProperties: false,
//             },
//           },
//         },
//       }),
//     }
//   );

//   const structuredData = await structuredResponse.json();

//   const data = await response.json();
//   console.log("Response from OpenRouter:", data);
//   const message = data.message;
//   return (
//     <div>
//       <FileUpload />
//       {JSON.stringify(structuredData.choices[0].message, null, 2)}
//       <AIMessage content={data.choices[0].message.content} />
//     </div>
//   );
// };

// export default Page;
import React from "react";

const page = () => {
  return <div>page</div>;
};

export default page;
