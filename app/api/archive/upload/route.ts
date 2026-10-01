// app/api/archive/upload/route.ts
// A loose frame for the archive. See app/lib/receivePhoto.ts.
import { NextRequest } from "next/server";
import { receivePhoto } from "@/app/lib/receivePhoto";

export const POST = (req: NextRequest) => receivePhoto(req, "archive");
