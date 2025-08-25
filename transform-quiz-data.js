const fs = require("fs");
const path = require("path");

// Read the original data file
const dataPath = path.join(
  __dirname,
  "app",
  "data",
  "quizzes",
  "first",
  "Anatomie",
  "data.json"
);
const originalData = JSON.parse(fs.readFileSync(dataPath, "utf8"));

// Transform the data structure
const transformedData = originalData.data.questions
  .filter(
    (question) => question.suggestions && Array.isArray(question.suggestions)
  )
  .map((question, index) => {
    return {
      question: question.text,
      answers: question.suggestions.map((suggestion) => ({
        text: suggestion.text,
        // Note: You need to manually set isCorrect for each answer
        // Currently setting all to false - you'll need to update this
        isCorrect: false,
      })),
    };
  });

// Write the transformed data to a new file
const outputPath = path.join(
  __dirname,
  "app",
  "data",
  "quizzes",
  "first",
  "Anatomie",
  "transformed-data.json"
);
fs.writeFileSync(outputPath, JSON.stringify(transformedData, null, 2), "utf8");

console.log(`Transformation complete! 
- Original questions: ${originalData.data.questions.length}
- Questions with suggestions: ${
  originalData.data.questions.filter(
    (q) => q.suggestions && Array.isArray(q.suggestions)
  ).length
}
- Transformed questions: ${transformedData.length}
- Output file: ${outputPath}

IMPORTANT: You need to manually set the correct answers in the transformed file.
Each question has isCorrect: false for all answers - you need to update these to true for the correct answers.`);

// Also create a helper file that shows the questions with their indices for easier manual correction
const helperData = transformedData.map((item, index) => ({
  questionIndex: index,
  question: item.question,
  answers: item.answers.map((answer, answerIndex) => ({
    answerIndex,
    text: answer.text,
    isCorrect: answer.isCorrect,
  })),
}));

const helperPath = path.join(
  __dirname,
  "app",
  "data",
  "quizzes",
  "first",
  "Anatomie",
  "questions-helper.json"
);
fs.writeFileSync(helperPath, JSON.stringify(helperData, null, 2), "utf8");
