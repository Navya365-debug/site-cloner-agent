import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    // Take a full-page screenshot as base64
    const screenshotBuffer = await page.screenshot({ fullPage: true });
    const screenshotBase64 = screenshotBuffer.toString("base64");

    // Extract structural + style data
    const pageData = await page.evaluate(() => {
      const getStyles = (el: Element) => {
        const s = window.getComputedStyle(el);
        return {
          color: s.color,
          backgroundColor: s.backgroundColor,
          fontFamily: s.fontFamily,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
        };
      };

      const title = document.title;
      const bodyText = document.body.innerText.slice(0, 5000);

      const headings = Array.from(document.querySelectorAll("h1, h2, h3")).map((h) => ({
        tag: h.tagName,
        text: h.textContent?.trim().slice(0, 200),
      }));

      const navLinks = Array.from(document.querySelectorAll("nav a, header a")).map(
        (a) => a.textContent?.trim()
      ).filter(Boolean).slice(0, 20);

      const images = Array.from(document.querySelectorAll("img")).map((img) => ({
        src: img.src,
        alt: img.alt,
      })).slice(0, 15);

      const buttons = Array.from(document.querySelectorAll("button, a.button, .btn")).map(
        (b) => b.textContent?.trim()
      ).filter(Boolean).slice(0, 15);

      const bodyStyles = getStyles(document.body);

      return { title, bodyText, headings, navLinks, images, buttons, bodyStyles };
    });

    await browser.close();

    return NextResponse.json({
      success: true,
      screenshotBase64,
      pageData,
    });
  } catch (error: any) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze website" },
      { status: 500 }
    );
  }
}