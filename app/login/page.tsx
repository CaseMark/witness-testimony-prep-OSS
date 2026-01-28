"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setApiKey } from "@/lib/storage/api-key-storage";

export default function LoginPage() {
  const router = useRouter();
  const [apiKey, setApiKeyInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Early validation checks BEFORE attempting POST
    if (!apiKey.trim()) {
      setError("Please enter your Case.dev API key");
      return;
    }

    if (!apiKey.startsWith("sk_case_")) {
      setError("Invalid API key format. Case.dev API keys start with 'sk_case_'");
      return;
    }

    // Prevent duplicate requests
    if (loading) return;

    setLoading(true);
    setError(null);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      // Verify the API key works by making a server-side call
      const response = await fetch("/api/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        // Show specific error message from API
        setError(data.error || "Invalid API key");
        setLoading(false);
        return;
      }

      // Store API key in localStorage
      setApiKey(apiKey);

      // Redirect to home page
      router.push("/");
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("API key validation error:", err);

      if (err.name === 'AbortError') {
        setError("Request timed out. Please check your connection and try again.");
      } else {
        setError("Failed to validate API key. Please check your connection and try again.");
      }
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              <svg
                width="32"
                height="32"
                viewBox="0 0 144 144"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M127.927 56.3865C127.927 54.7298 126.583 53.3867 124.927 53.3865H19.6143C17.9574 53.3865 16.6143 54.7296 16.6143 56.3865V128.226C16.6143 129.883 17.9574 131.226 19.6143 131.226H124.927C126.583 131.226 127.927 129.883 127.927 128.226V56.3865ZM93.1553 32.6638C93.1553 31.007 91.8121 29.6639 90.1553 29.6638H53.4102C51.7534 29.664 50.4102 31.0071 50.4102 32.6638V47.3865H93.1553V32.6638ZM99.1553 47.3865H124.927C129.897 47.3867 133.927 51.4161 133.927 56.3865V128.226C133.927 133.197 129.897 137.226 124.927 137.226H19.6143C14.6437 137.226 10.6143 133.197 10.6143 128.226V56.3865C10.6143 51.4159 14.6437 47.3865 19.6143 47.3865H44.4102V32.6638C44.4102 27.6933 48.4397 23.664 53.4102 23.6638H90.1553C95.1258 23.6639 99.1553 27.6933 99.1553 32.6638V47.3865Z"
                  fill="#EB5600"
                />
                <path
                  d="M76.6382 70.6082C77.8098 69.4366 79.7088 69.4366 80.8804 70.6082L98.8013 88.5291C100.754 90.4817 100.754 93.6477 98.8013 95.6003L80.8804 113.521C79.7088 114.693 77.8097 114.693 76.6382 113.521C75.4667 112.35 75.4667 110.451 76.6382 109.279L93.8521 92.0642L76.6382 74.8503C75.4666 73.6788 75.4666 71.7797 76.6382 70.6082Z"
                  fill="#EB5600"
                />
                <path
                  d="M67.3618 70.6082C66.1902 69.4366 64.2912 69.4366 63.1196 70.6082L45.1987 88.5291C43.2461 90.4817 43.2461 93.6477 45.1987 95.6003L63.1196 113.521C64.2912 114.693 66.1903 114.693 67.3618 113.521C68.5333 112.35 68.5333 110.451 67.3618 109.279L50.1479 92.0642L67.3618 74.8503C68.5334 73.6788 68.5334 71.7797 67.3618 70.6082Z"
                  fill="#EB5600"
                />
              </svg>
            </div>
            <h1
              className="mb-2 text-3xl font-light tracking-tight text-foreground"
              style={{ fontFamily: "'Spectral', serif" }}
            >
              Deposition Prep Tools
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in with your Case.dev API key
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Case.dev API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && apiKey) {
                    handleLogin();
                  }
                }}
                placeholder="sk_case_..."
                disabled={loading}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally and never sent to our servers
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button
              onClick={handleLogin}
              className="w-full"
              disabled={!apiKey || loading}
            >
              {loading ? "Validating..." : "Sign In"}
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Don&apos;t have an API key?{" "}
              <a
                href="https://case.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Get one at case.dev
              </a>
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 rounded-lg border border-border bg-card/50 p-4">
          <h2 className="mb-2 text-sm font-semibold text-foreground">
            About this app
          </h2>
          <p className="text-xs text-muted-foreground">
            This is an open-source deposition preparation tool powered by Case.dev.
            All documents are securely stored in your Case.dev vault with built-in
            semantic search and RAG capabilities.
          </p>
        </div>
      </div>
    </main>
  );
}
