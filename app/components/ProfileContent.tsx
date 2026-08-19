// app/components/ProfileContent.tsx
// Swaps the page body to match the role. The switch itself is the pair of
// portraits in the hero (AvatarPicker); this only reads the shared mode.
"use client";

import { type ReactNode } from "react";
import { useProfileMode } from "./ProfileMode";

export function ProfileContent({
  analystContent,
  captureContent,
}: {
  analystContent: ReactNode;
  captureContent: ReactNode;
}) {
  const { mode } = useProfileMode();
  return <>{mode === "analyst" ? analystContent : captureContent}</>;
}
