// app/api/notion/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPageBlocks, isPublishableId } from "@/app/lib/notion";
import { FREE_BLOCKS } from "@/app/components/ProjectBlocks";
import { gateEnabled, isReader } from "@/app/lib/accessSession";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
    ) {
    try {
        const { id } = await params;

        // This route used to hand back the blocks of any page id it was given,
        // which meant every page the integration could read — including rows
        // deliberately kept off the site. It now serves only what the project
        // list itself publishes.
        if (!(await isPublishableId(id))) {
            return NextResponse.json({ error: "Not found." }, { status: 404 });
        }

        const blocks = await getPageBlocks(id);

        // With the gate on, the cut has to happen here. Sending the whole page
        // and hiding the tail in CSS would leave the gate as decoration —
        // anyone who opened the network tab would read straight past it.
        const locked = gateEnabled() && !(await isReader());
        const res = NextResponse.json({
            blocks: locked ? blocks.slice(0, FREE_BLOCKS) : blocks,
            truncated: locked && blocks.length > FREE_BLOCKS,
        });
        // Approved and not approved get different answers from one URL, so
        // this must never sit in a shared cache.
        res.headers.set("Cache-Control", "no-store");
        return res;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
