import { useEffect, useState } from "react";

const SOURCE_FILES = import.meta.glob(
  [
    "/src/**/*.{ts,tsx,css}",
    "/index.html",
    "/vite.config.ts",
    "/tailwind.config.ts",
    "/tsconfig.json",
    "/tsconfig.app.json",
    "/tsconfig.node.json",
    "/postcss.config.js",
    "/components.json",
    "/eslint.config.js",
  ],
  { query: "?raw", import: "default" }
);

export default function SourceExport() {
  const [status, setStatus] = useState("Lade Quelldateien…");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const entries = Object.entries(SOURCE_FILES);
      const parts: string[] = [];

      for (const [path, loader] of entries) {
        try {
          const content = (await loader()) as string;
          parts.push(`\n${"=".repeat(80)}\n// FILE: ${path}\n${"=".repeat(80)}\n\n${content}`);
        } catch {
          parts.push(`\n// FILE: ${path}  [could not read]\n`);
        }
      }

      const blob = new Blob([parts.join("\n")], { type: "text/plain" });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus(`${entries.length} Dateien geladen`);
    })();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <p className="text-muted-foreground">{status}</p>
      {downloadUrl && (
        <a
          href={downloadUrl}
          download="klyma-source-code.txt"
          className="rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-90"
        >
          ⬇ klyma-source-code.txt herunterladen
        </a>
      )}
    </div>
  );
}
