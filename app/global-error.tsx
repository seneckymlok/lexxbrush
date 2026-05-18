"use client";

import { useEffect } from "react";

// global-error replaces the root layout, so it must include <html> and <body>.
// It only fires when the root layout itself crashes - rare but catastrophic.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0A0A0A",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          padding: "0 1.5rem",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(2.5rem, 10vw, 5rem)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Something broke.
        </h1>
        <p
          style={{
            marginTop: "1.5rem",
            fontSize: "0.7rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.4)",
            maxWidth: "28rem",
          }}
        >
          A critical error stopped the page from loading. Please try again.
        </p>
        {error.digest && (
          <p
            style={{
              marginTop: "0.75rem",
              fontFamily: "monospace",
              fontSize: "0.65rem",
              letterSpacing: "0.15em",
              color: "rgba(255,255,255,0.2)",
            }}
          >
            {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: "3rem",
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.6)",
            fontSize: "0.7rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            borderBottom: "1px solid rgba(255,255,255,0.2)",
            paddingBottom: "1px",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
