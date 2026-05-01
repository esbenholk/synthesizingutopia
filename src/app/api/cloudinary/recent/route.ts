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

/**
 * Reassembles a title that was split across Cloudinary context keys due to
 * the 1000-char limit.
 *
 * Storage layout:
 *   caption              → first chunk (always present)
 *   title_continuation_1 → second chunk (only present if title was too long)
 *   title_continuation_2 → third chunk  … etc.
 */
function reassembleTitle(cx: Record<string, string>): string {
  const first = (cx.caption ?? "").trim();
  if (!first) return "";

  const continuations: string[] = [];
  let i = 1;
  while (cx[`title_continuation_${i}`]) {
    continuations.push(cx[`title_continuation_${i}`].trim());
    i++;
  }

  return continuations.length > 0
    ? `${first} ${continuations.join(" ")}`.trim()
    : first;
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const foldersParam = url.searchParams.get("folders");
  const folder = url.searchParams.get("folder");

  // Build array of folders
  const folders = foldersParam
    ? foldersParam.split(",").map((f) => f.trim()).filter(Boolean)
    : folder
      ? [folder]
      : ["utopias"]; // fallback
  const cursor = url.searchParams.get("cursor") || undefined;

  const sortParam = (url.searchParams.get("sort") || "asc").toLowerCase();
  const sortOrder = sortParam === "desc" ? "desc" : "asc";

  const searchRaw = url.searchParams.get("search");
  const tags = parseSearchToTags(searchRaw);

 

  try {
    const folderExpr =
    folders.length === 1
      ? `folder="${escapeCloudinaryValue(folders[0])}"`
      : `(${folders
          .map((f) => `folder="${escapeCloudinaryValue(f)}"`)
          .join(" OR ")})`;

    const tagsExpr =
      tags.length > 0
        ? ` AND (${tags
            .map((t) => `tags="${escapeCloudinaryValue(t)}"`)
            .join(" OR ")})`
        : "";

    const expression = `${folderExpr}${tagsExpr}`;


    console.log("GET CONTENT FROM", expression);

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

      // Reassemble title from caption + any title_continuation_N chunks
      const title =
        reassembleTitle(cx) ||
        pick(md, "title", "title") ||
        r.public_id?.split("/").pop() ||
        "Untitled";

      const alt =
        pick(cx, "alt", "alt") ?? pick(md, "description", "description");

      const parentIds = pick(cx, "parentIds", "parentIds");
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
        parentIds,
        aiStory,
        aiPolitics,
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
