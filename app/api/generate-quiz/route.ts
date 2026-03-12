import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

export async function POST(request: NextRequest) {
  try {
    const { topic, difficulty, numQuestions = 5, description = "" } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const prompt = `Create a ${numQuestions}-question multiple choice quiz about "${topic}" for ${
      difficulty || "Easy"
    } difficulty level.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": 0,
    "explanation": "A paragraph detailing why the correct answer is right, showing all work and intermediate steps used to arrive at the final answer."
  }
]

Important:
- correctAnswer should be the INDEX (0-3) of the correct option in the options array
- Include exactly ${numQuestions} questions
- Make questions appropriate for ${difficulty || "Easy"} difficulty
- Ensure exactly 4 options per question
- explanation should be A paragraph detailing why the correct answer is right, showing all work and intermediate steps used to arrive at the final answer. 3-4 sentences.
- Return ONLY the JSON array, no other text or markdown formatting${description ? `\n\nAdditional instructions: ${description}` : ""}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    let content = (completion.choices[0].message.content ?? "").trim();

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
