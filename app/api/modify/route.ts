import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { currentCode, instruction } = await req.json();

    if (!currentCode || !instruction) {
      return NextResponse.json(
        { error: "currentCode and instruction are required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

    const prompt = `
You are an expert frontend engineer. Below is an existing React component (TSX + Tailwind CSS).

Apply this instruction to it: "${instruction}"

Current code:
${currentCode}

Rules:
- Output ONLY the full, updated valid TSX code, no markdown fences, no explanation.
- Keep the same component name and structure unless the instruction requires changing it.
- Only change what the instruction asks for; keep everything else the same.
- Keep using Tailwind CSS utility classes only.
- Keep it responsive.
`;

  async function generateWithRetry(model: any, prompt: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(prompt);
    } catch (err: any) {
      if (err.message?.includes("503") && i < retries - 1) {
        await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}

const result = await generateWithRetry(model, prompt);
    let code = result.response.text();

    code = code.replace(/^```(tsx|typescript|jsx|javascript)?\n?/i, "").replace(/```$/i, "").trim();

    return NextResponse.json({ success: true, code });
  } catch (error: any) {
    console.error("Modify error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to modify code" },
      { status: 500 }
    );
  }
}