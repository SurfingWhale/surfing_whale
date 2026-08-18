// app/components/ProfileContent.tsx
"use client";

import { useState, type ReactNode } from "react";

type Mode = "analyst" | "photography";

export function ProfileContent({
  analystContent,
  photographyContent,
}: {
  analystContent: ReactNode;
  photographyContent: ReactNode;
}) {
  const [mode, setMode] = useState<Mode>("analyst");

  return (
    <>
      <div className="flex justify-center py-10">
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => setMode("analyst")}
            aria-pressed={mode === "analyst"}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
              mode === "analyst"
                ? "bg-[#F8F8FF] text-black"
                : "text-white/50 hover:text-white"
            }`}
          >
            Data Analyst
          </button>
          <button
            type="button"
            onClick={() => setMode("photography")}
            aria-pressed={mode === "photography"}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
              mode === "photography"
                ? "bg-[#F8F8FF] text-black"
                : "text-white/50 hover:text-white"
            }`}
          >
            Photography
          </button>
        </div>
      </div>

      {mode === "analyst" ? analystContent : photographyContent}
    </>
  );
}
