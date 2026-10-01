// scripts/sync-images.ts
// Run manual: npx ts-node -r tsconfig-paths/register scripts/sync-images.ts
// Atau: npx tsx scripts/sync-images.ts

import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const SYNC_SECRET = process.env.SYNC_SECRET ?? "";
if (!SYNC_SECRET) {
    console.error("❌ SYNC_SECRET is not set — the route refuses requests without it.");
    process.exit(1);
}

async function main() {
    console.log("🐳 Surfing Whale — Project Screenshot Sync");
    console.log(`📡 Hitting: ${BASE_URL}/api/sync-images`);
    console.log("─".repeat(50));

    try {
        const res = await fetch(`${BASE_URL}/api/sync-images`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-sync-secret": SYNC_SECRET,
        },
        });

        const data = await res.json();

        if (!res.ok) {
        console.error("❌ Error:", data.error);
        process.exit(1);
        }

        console.log(`✅ Synced   : ${data.synced}`);
        console.log(`❌ Failed   : ${data.failed}`);
        console.log("\n📋 Detail:");

        if (data.results) {
        for (const r of data.results) {
            const icon = r.status === "synced" ? "✅" : r.status === "skipped" ? "⏭️" : "❌";
            console.log(`  ${icon} ${r.name}`);
            if (r.url) console.log(`     → ${r.url}`);
            if (r.error) console.log(`     ⚠ ${r.error}`);
        }
        } else {
        console.log(" ", data.message);
        }
    } catch (err) {
        console.error("💥 Fetch error:", err);
        process.exit(1);
    }
    }

    main();