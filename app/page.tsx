"use client";

import { useState } from "react";
import LivePreview from "./LivePreview";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [pageData, setPageData] = useState<any>(null);
  const [modifyPrompt, setModifyPrompt] = useState("");

  async function handleClone() {
    setLoading(true);
    setStatus("Analyzing website...");
    setGeneratedCode(null);
    try {
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeData.success) throw new Error(analyzeData.error);

      setScreenshot(analyzeData.screenshotBase64);
      setPageData(analyzeData.pageData);
      setStatus("Generating frontend code...");

      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageData: analyzeData.pageData }),
      });
      const genData = await genRes.json();
      if (!genData.success) throw new Error(genData.error);

      setGeneratedCode(genData.code);
      setStatus("Done!");
    } catch (err: any) {
      setStatus("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleModify() {
    if (!generatedCode || !modifyPrompt) return;
    setLoading(true);
    setStatus("Applying your changes...");
    try {
      const res = await fetch("/api/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentCode: generatedCode, instruction: modifyPrompt }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setGeneratedCode(data.code);
      setStatus("Changes applied!");
      setModifyPrompt("");
    } catch (err: any) {
      setStatus("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const screenshotSrc = screenshot ? "data:image/png;base64," + screenshot : "";

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">AI Website Cloning Agent</h1>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 border rounded-lg px-4 py-2"
          />
          <button
            onClick={handleClone}
            disabled={loading || !url}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? "Working..." : "Clone Website"}
          </button>
        </div>

        {status && <p className="text-sm text-gray-600 mb-6">{status}</p>}

        {screenshot && (
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Original Screenshot</h2>
            <img
              src={screenshotSrc}
              alt="Original site screenshot"
              className="border rounded-lg max-h-96 object-contain"
            />
          </div>
        )}

        {generatedCode && (
          <>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="e.g. Change the primary color to blue"
                value={modifyPrompt}
                onChange={(e) => setModifyPrompt(e.target.value)}
                className="flex-1 border rounded-lg px-4 py-2"
              />
              <button
                onClick={handleModify}
                disabled={loading || !modifyPrompt}
                className="bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
              >
                Modify
              </button>
            </div>

            <div className="mb-6">
              <h2 className="font-semibold mb-2">Live Preview</h2>
              <LivePreview code={generatedCode} />
            </div>

            <div>
              <h2 className="font-semibold mb-2">Generated Code</h2>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-[500px] text-sm">
                {generatedCode}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
}