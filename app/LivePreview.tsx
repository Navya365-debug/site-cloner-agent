"use client";

import { useEffect, useRef } from "react";

export default function LivePreview({ code }: { code: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current || !code) return;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react">
    ${code.replace(/import\s+.*?;?\n/g, "").replace(/export default function/g, "function")}
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(React.createElement(GeneratedSite));
  </script>
</body>
</html>
    `;

    const iframe = iframeRef.current;
    iframe.srcdoc = html;
  }, [code]);

  return (
    <iframe
      ref={iframeRef}
      title="Live Preview"
      className="w-full h-[600px] border rounded-lg bg-white"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}