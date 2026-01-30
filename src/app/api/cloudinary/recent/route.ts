import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const pick = (obj: any, kCamel: string, kSnake: string) =>
  obj?.[kCamel] ?? obj?.[kSnake] ?? null;

function escapeCloudinaryValue(v: string) {
  return v.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// ✅ Split ONLY on commas so multi-word tags (e.g. "cute dog") stay intact.
function parseSearchToTags(raw: string | null) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const folder = url.searchParams.get("folder") || "utopias";
  const cursor = url.searchParams.get("cursor") || undefined;

  const sortParam = (url.searchParams.get("sort") || "asc").toLowerCase();
  const sortOrder = sortParam === "desc" ? "desc" : "asc";

  const searchRaw = url.searchParams.get("search");
  const tags = parseSearchToTags(searchRaw);

  try {
    const folderExpr = `folder="${escapeCloudinaryValue(folder)}"`;

    const tagsExpr =
      tags.length > 0
        ? ` AND (${tags
            .map((t) => `tags="${escapeCloudinaryValue(t)}"`)
            .join(" OR ")})`
        : "";

    const expression = `${folderExpr}${tagsExpr}`;

    let q = cloudinary.search
      .expression(expression)
      .sort_by("created_at", sortOrder)
      .with_field("context")
      .with_field("metadata")
      .with_field("tags")
      .max_results(limit);

    if (cursor) q = q.next_cursor(cursor);

    const res = await q.execute();

    const items = (res.resources || []).map((r: any) => {
      // Cloudinary can return context as either object or { custom: ... }
      const cx = r.context?.custom ?? r.context ?? {};
      const md = r.metadata ?? {};

      const aiTitle =
        pick(cx, "aiTitle", "ai_title") ?? pick(md, "aiTitle", "ai_title");

      const title =
        pick(cx, "caption", "caption") ??
        pick(md, "title", "title") ??
        r.public_id?.split("/").pop() ??
        "Untitled";

      const alt =
        pick(cx, "alt", "alt") ?? pick(md, "description", "description");

      // ✅ NEW fields from context
      const parentIds = pick(cx, "parentIds", "parentIds"); // stringified JSON in your example
      const aiStory =
        pick(cx, "aiStory", "ai_extended_story") ??
        pick(cx, "ai_extended_story", "ai_extended_story");
      const aiPolitics =
        pick(cx, "aiPolitics", "ai_political_state") ??
        pick(cx, "ai_political_state", "ai_political_state");

      return {
        id: r.asset_id ?? r.public_id,
        public_id: r.public_id,
        url: r.secure_url ?? r.url,
        created_at: r.created_at,
        tags: r.tags ?? [],
        title,
        aiTitle,
        alt,

        // ✅ include these in client payload
        parentIds,
        aiStory, // corresponds to ai_extended_story
        aiPolitics, // corresponds to ai_political_state
      };
    });

    return NextResponse.json({
      items,
      nextCursor: res.next_cursor ?? null,
      sortOrder,
    });
  } catch (error) {
    console.error("Cloudinary fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 },
    );
  }
}
