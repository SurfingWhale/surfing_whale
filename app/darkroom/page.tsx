// app/darkroom/page.tsx
// The darkroom moved into the studio. Anything already bookmarked lands in
// the right room rather than on a 404.
import { redirect } from "next/navigation";

export default function DarkroomPage() {
  redirect("/studio");
}
