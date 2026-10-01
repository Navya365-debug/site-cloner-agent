import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { pageData, screenshotBase64 } = await req.json();

    if (!pageData) {
      return NextResponse.json({ error: "pageData is required" }, { status: 400 });
    }

   const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
    const prompt = `
You are an expert frontend engineer. Recreate this website's UI as a SINGLE self-contained React component using Tailwind CSS classes only (no external CSS files, no imports besides React).

Here is the extracted page data:
Title: ${pageData.title}
Body text (sample): ${pageData.bodyText?.slice(0, 1500)}
Headings: ${JSON.stringify(pageData.headings)}
Nav links: ${JSON.stringify(pageData.navLinks)}
Buttons: ${JSON.stringify(pageData.buttons)}
Images (alt text only, do not use real src): ${JSON.stringify(pageData.images?.map((i: any) => i.alt))}
Body base styles: ${JSON.stringify(pageData.bodyStyles)}

Rules:
- Output ONLY valid TSX code, no markdown fences, no explanation.
- Export a single default function component named GeneratedSite.
- Use Tailwind CSS utility classes for all styling.
- Recreate the layout structure: navbar (if nav links exist), hero/heading area, body content sections, buttons.
- Use placeholder images from https://placehold.co/600x400 instead of real image URLs.
- Make it responsive (mobile-first, use sm: md: lg: prefixes).
- Keep it clean, don't invent unrelated content.
`;

    const result = await model.generateContent(prompt);
    let code = result.response.text();

    // Strip markdown code fences if the model added them anyway
    code = code.replace(/^```(tsx|typescript|jsx|javascript)?\n?/i, "").replace(/```$/i, "").trim();

    return NextResponse.json({ success: true, code });
  } catch (error: any) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate code" },
      { status: 500 }
    );
  }
}