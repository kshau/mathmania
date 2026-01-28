import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { topic, difficulty } = await request.json();

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

    const prompt = `Create a comprehensive math lesson about "${topic}" for ${
      difficulty || "Easy"
    } difficulty level.

The lesson should be written in Markdown format and include:
- A clear title (as a heading)
- Introduction explaining what the topic is
- Step-by-step explanations with examples
- Practice tips
- Key concepts to remember

Make it engaging and appropriate for students learning this topic. Use clear language and include at least 3-4 examples.

Format the response as Markdown with proper headings, lists, and code blocks where appropriate.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error generating lesson:", error);
    return NextResponse.json(
      { error: "Failed to generate lesson" },
      { status: 500 }
    );
  }
}
