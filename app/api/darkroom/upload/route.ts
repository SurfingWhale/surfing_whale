// app/api/darkroom/upload/route.ts
// A photograph for an essay or a post. See app/lib/receivePhoto.ts.
import { NextRequest } from "next/server";
import { receivePhoto } from "@/app/lib/receivePhoto";

export const POST = (req: NextRequest) => receivePhoto(req, "darkroom");
