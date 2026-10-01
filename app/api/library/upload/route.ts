// app/api/library/upload/route.ts
// A photograph into the library. See app/lib/receivePhoto.ts.
import { NextRequest } from "next/server";
import { receivePhoto } from "@/app/lib/receivePhoto";

export const POST = (req: NextRequest) => receivePhoto(req, "library");
