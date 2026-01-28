import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { topic, difficulty, numQuestions = 5 } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Create a ${numQuestions}-question multiple choice quiz about "${topic}" for ${
      difficulty || "Easy"
    } difficulty level.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": 0
  }
]

Important:
- correctAnswer should be the INDEX (0-3) of the correct option in the options array
- Include exactly ${numQuestions} questions
- Make questions appropriate for ${difficulty || "Easy"} difficulty
- Ensure exactly 4 options per question
- Return ONLY the JSON array, no other text or markdown formatting`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let content = response.text().trim();

    // Clean up the response - remove markdown code blocks if present
    content = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    try {
      const questions = JSON.parse(content);

      // Validate the structure
      if (!Array.isArray(questions)) {
        throw new Error("Response is not an array");
      }

      // Validate each question
      for (const q of questions) {
        if (
          !q.question ||
          !Array.isArray(q.options) ||
          q.options.length !== 4 ||
          typeof q.correctAnswer !== "number"
        ) {
          throw new Error("Invalid question structure");
        }
      }

      return NextResponse.json({ questions });
    } catch (parseError) {
      console.error("Error parsing quiz response:", parseError);
      console.error("Raw response:", content);
      return NextResponse.json(
        { error: "Failed to parse quiz response. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error generating quiz:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
