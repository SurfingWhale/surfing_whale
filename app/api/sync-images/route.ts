// app/api/sync-images/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { uploadToCloudinary } from "@/app/lib/cloudinary";
import { PROJECTS_DB } from "@/app/lib/notionIds";

const notion = new Client({ auth: process.env.NOTION_API_KEY! });

const DATABASE_ID = PROJECTS_DB();
const SYNC_SECRET = process.env.SYNC_SECRET ?? "dev-secret";

interface NotionProject {
  id: string;
  name: string;
  citationUrl: string | null;
  imageUrl: string | null;
}

interface SyncResult {
  projectId: string;
  name: string;
  status: "synced" | "skipped" | "failed";
  cloudinaryUrl?: string;
  error?: string;
}

async function getProjectsNeedingSync(): Promise<NotionProject[]> {
  const response = await (notion as any).request({
    path: `databases/${DATABASE_ID}/query`,
    method: "POST",
    body: {
      filter: {
        and: [
          { property: "Citation URL", url: { is_not_empty: true } },
          { property: "Image", files: { is_empty: true } },
        ],
      },
    },
  });

  return response.results
    .filter((page: any) => "properties" in page)
    .map((page: any) => {
      const props = page.properties;
      const nameRaw = props["Name"]?.title;
      const name = Array.isArray(nameRaw) && nameRaw.length > 0
        ? nameRaw[0].plain_text
        : "Untitled";
      const citationUrl = props["Citation URL"]?.url ?? null;
      const imageFiles = props["Image"]?.files;
      const imageUrl =
        Array.isArray(imageFiles) && imageFiles.length > 0
          ? (imageFiles[0]?.file?.url ?? imageFiles[0]?.external?.url ?? null)
          : null;
      return { id: page.id, name, citationUrl, imageUrl };
    });
}

async function updateNotionImage(pageId: string, imageUrl: string): Promise<void> {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      Image: {
        files: [
          {
            name: "project-screenshot",
            type: "external",
            external: { url: imageUrl },
          },
        ],
      },
    },
  });
}

async function screenshotUrl(url: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1280, height: 720 },
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (["media", "font", "websocket"].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, { waitUntil: "networkidle2", timeout: 30_000 });
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const buffer = await page.screenshot({ type: "jpeg", quality: 85 });
    return Buffer.from(buffer);
  } finally {
    await browser.close();
  }
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get("x-sync-secret");
  if (secret !== SYNC_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const projects = await getProjectsNeedingSync();

    if (projects.length === 0) {
      return NextResponse.json({ message: "Semua project sudah punya image.", synced: 0 });
    }

    const results: SyncResult[] = [];

    for (const project of projects) {
      if (!project.citationUrl) {
        results.push({ projectId: project.id, name: project.name, status: "skipped" });
        continue;
      }

      try {
        const buffer = await screenshotUrl(project.citationUrl);
        const slug = toSlug(project.name);
        const { secure_url } = await uploadToCloudinary(buffer, slug);
        await updateNotionImage(project.id, secure_url);
        results.push({ projectId: project.id, name: project.name, status: "synced", cloudinaryUrl: secure_url });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        results.push({ projectId: project.id, name: project.name, status: "failed", error: message });
      }
    }

    const synced = results.filter((r) => r.status === "synced").length;
    const failed = results.filter((r) => r.status === "failed").length;
    return NextResponse.json({ synced, failed, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok",
    endpoint: "POST /api/sync-images",
    hint: "Include header: x-sync-secret: <SYNC_SECRET>",
  });
}