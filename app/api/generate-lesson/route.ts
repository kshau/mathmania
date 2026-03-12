import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

export async function POST(request: NextRequest) {
  try {
    const { topic, difficulty } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const content = completion.choices[0].message.content ?? "";

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error generating lesson:", error);
    return NextResponse.json(
      { error: "Failed to generate lesson" },
      { status: 500 }
    );
  }
}
