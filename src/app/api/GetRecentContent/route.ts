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

// =====================================================
// SEARCH TAGS
// =====================================================
//
// Each comma-separated search term should match an asset
// tagged with EXACTLY that tag (e.g. "broccoli figure" as
// one literal tag), not the individual words inside it.
//
// We therefore use Cloudinary's exact-match operator (=)
// rather than the tokenized operator (:). The tokenized
// operator matches any tag CONTAINING a given word, so
// tags:"broccoli" would also match a tag like
// "broccoli figure" or "chocolate broccoli" - which is why
// a naive tokenized search returned results for "broccoli"
// or "figure" individually instead of only assets tagged
// with the full literal phrase.
//
// Exact match (=) is case-sensitive, so this assumes tags
// are stored consistently (e.g. all lowercase). If you get
// zero/partial results, double check the exact casing of
// the tag in the Cloudinary Media Library.
// =====================================================

function parseSearchToTags(raw: string | null): string[] {
  if (!raw) return [];

  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// =====================================================
// STRING HELPERS
// =====================================================

function firstNonEmpty(...values: any[]): string {
  for (const value of values) {
    if (value == null) continue;

    const stringValue = String(value).trim();

    if (stringValue) return stringValue;
  }

  return "";
}

// =====================================================
// OLD TITLE FORMAT SUPPORT
// =====================================================

function reassembleLegacyTitle(cx: Record<string, any>): string {
  const continuations: string[] = [];

  let i = 1;

  while (cx[`title_continuation_${i}`]) {
    continuations.push(String(cx[`title_continuation_${i}`]).trim());

    i++;
  }

  /*
   * Only treat caption as the old title if
   * continuation fields actually exist.
   *
   * New assets use caption for:
   *
   * "in our utopia there is..."
   */

  if (continuations.length === 0) return "";

  const first = String(cx.caption ?? "").trim();

  if (!first) return "";

  return [first, ...continuations].filter(Boolean).join(" ").trim();
}

// =====================================================
// GET
// =====================================================

export async function GET(request: Request) {
  const url = new URL(request.url);

  // ---------------------------------------------------
  // LIMIT
  // ---------------------------------------------------

  const parsedLimit = parseInt(url.searchParams.get("limit") || "10", 10);

  // Cloudinary search supports up to 500/page.
  const limit = Math.min(
    500,
    Math.max(1, Number.isFinite(parsedLimit) ? parsedLimit : 10),
  );

  // ---------------------------------------------------
  // FOLDERS
  // ---------------------------------------------------

  const foldersParam = url.searchParams.get("folders");

  const folder = url.searchParams.get("folder");

  const folders = foldersParam
    ? foldersParam
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
    : folder
      ? [folder]
      : ["utopias"];

  // ---------------------------------------------------
  // CURSOR
  // ---------------------------------------------------

  const cursor = url.searchParams.get("cursor") || undefined;

  // ---------------------------------------------------
  // SORT
  // ---------------------------------------------------

  const sortParam = (url.searchParams.get("sort") || "asc").toLowerCase();

  const sortOrder = sortParam === "desc" ? "desc" : "asc";

  // ---------------------------------------------------
  // SEARCH
  // ---------------------------------------------------

  const searchRaw = url.searchParams.get("search");

  const tags = parseSearchToTags(searchRaw);

  try {
    // =================================================
    // BUILD FOLDER EXPRESSION
    // =================================================

    const folderClauses = folders.map(
      (f) => `folder="${escapeCloudinaryValue(f)}"`,
    );

    const folderExpr =
      folderClauses.length === 1
        ? folderClauses[0]
        : `(${folderClauses.join(" OR ")})`;

    // =================================================
    // BUILD TAG EXPRESSION
    // =================================================
    //
    // Use the exact-match operator (=) so a search for
    // "broccoli figure" only matches assets carrying that
    // literal tag - not assets tagged just "broccoli" or
    // just "figure" (which the tokenized `:` operator would
    // incorrectly also match, since it matches on individual
    // words inside a tag rather than the whole tag value).
    //
    // Multiple comma-separated search terms are still OR'd
    // together, e.g. "broccoli figure,banana" matches assets
    // tagged exactly "broccoli figure" OR exactly "banana".
    // =================================================

    const tagClauses = tags.map(
      (tag) => `tags="${escapeCloudinaryValue(tag)}"`,
    );

    const tagsExpr =
      tagClauses.length > 0 ? `(${tagClauses.join(" OR ")})` : "";

    // =================================================
    // FINAL EXPRESSION
    // =================================================

    const expression = tagsExpr ? `${folderExpr} AND ${tagsExpr}` : folderExpr;

    console.log("");
    console.log("======================================");
    console.log("CLOUDINARY SEARCH");
    console.log("======================================");
    console.log("folders:", folders);
    console.log("search tags (exact match):", tags);
    console.log("expression:", expression);
    console.log("limit:", limit);
    console.log("cursor:", cursor ?? "(none)");
    console.log("======================================");
    console.log("");

    // =================================================
    // CLOUDINARY QUERY
    // =================================================

    let q = cloudinary.search
      .expression(expression)
      .sort_by("created_at", sortOrder)
      .with_field("context")
      .with_field("metadata")
      .with_field("tags")
      .max_results(limit);

    if (cursor) {
      q = q.next_cursor(cursor);
    }

    const res = await q.execute();

    console.log("CLOUDINARY RESULT:", {
      returned: res.resources?.length ?? 0,

      totalCount: res.total_count ?? "unknown",

      hasNextCursor: Boolean(res.next_cursor),
    });

    // =================================================
    // MAP CLOUDINARY -> UNITY/API OBJECT
    // =================================================

    const items = (res.resources || []).map((r: any) => {
      const cx = r.context?.custom ?? r.context ?? {};

      const md = r.metadata ?? {};

      // =============================================
      // TITLE
      // =============================================

      const aiTitle = firstNonEmpty(
        pick(cx, "aiTitle", "ai_title"),

        pick(md, "aiTitle", "ai_title"),
      );

      const legacyTitle = reassembleLegacyTitle(cx);

      const title = firstNonEmpty(
        pick(cx, "title", "title"),

        aiTitle,

        pick(md, "title", "title"),

        legacyTitle,

        r.public_id?.split("/").pop(),

        "Untitled",
      );

      // =============================================
      // CAPTION / DESCRIPTION
      // =============================================

      const caption = firstNonEmpty(
        pick(cx, "caption", "caption"),

        pick(md, "caption", "caption"),
      );

      // =============================================
      // ALT
      // =============================================

      const alt = firstNonEmpty(
        pick(cx, "altText", "altText"),

        pick(cx, "alt_text", "alt_text"),

        pick(cx, "alt", "alt"),

        pick(md, "description", "description"),
      );

      // =============================================
      // POLITICS
      // =============================================

      const aiPolitics = firstNonEmpty(
        pick(cx, "politicalState", "political_state"),

        pick(cx, "aiPolitics", "ai_political_state"),

        pick(md, "politicalState", "political_state"),

        pick(md, "aiPolitics", "ai_political_state"),
      );

      // =============================================
      // VIBE
      // =============================================

      const aiVibe = firstNonEmpty(
        pick(cx, "vibe", "vibe"),

        pick(cx, "aiVibe", "ai_vibe"),

        pick(md, "vibe", "vibe"),

        pick(md, "aiVibe", "ai_vibe"),
      );

      // =============================================
      // OBJECTS
      // =============================================

      const aiObjects = firstNonEmpty(
        pick(cx, "objects", "objects"),

        pick(cx, "aiObjects", "ai_objects"),

        pick(md, "objects", "objects"),

        pick(md, "aiObjects", "ai_objects"),
      );

      // =============================================
      // SCENES
      // =============================================

      const aiScenes = firstNonEmpty(
        pick(cx, "scenes", "scenes"),

        pick(cx, "aiScenes", "ai_scenes"),

        pick(md, "scenes", "scenes"),

        pick(md, "aiScenes", "ai_scenes"),
      );

      // =============================================
      // STORY
      // =============================================

      const aiStory = firstNonEmpty(
        pick(cx, "extendedStory", "extended_story"),

        pick(cx, "aiStory", "ai_extended_story"),

        pick(md, "extendedStory", "extended_story"),

        pick(md, "aiStory", "ai_extended_story"),
      );

      // =============================================
      // PARENTS
      // =============================================

      const parentIds = firstNonEmpty(
        pick(cx, "parentIds", "parentIds"),

        pick(md, "parentIds", "parentIds"),
      );

      // =============================================
      // ZONE
      // =============================================

      const zoneOfInterest = firstNonEmpty(
        pick(cx, "zoneOfInterest", "zone_of_interest"),

        pick(md, "zoneOfInterest", "zone_of_interest"),
      );

      // =============================================
      // INTIMACY
      // =============================================

      const intimacyLevel = firstNonEmpty(
        pick(cx, "intimacyLevel", "intimacy_level"),

        pick(md, "intimacyLevel", "intimacy_level"),
      );

      // =============================================
      // RETURN
      // =============================================

      return {
        id: r.asset_id ?? r.public_id,

        public_id: r.public_id,

        url: r.secure_url ?? r.url,

        date: r.created_at,

        created_at: r.created_at,

        tags: r.tags ?? [],

        // -------------------------------------------
        // READER VALUES
        // -------------------------------------------

        title,

        description: caption,

        caption,

        alt,

        // -------------------------------------------
        // UNITY AI VALUES
        // -------------------------------------------

        aiTitle,

        aiVibe,

        aiPolitics,

        aiObjects,

        aiStory,

        aiScenes,

        parentIds,

        // -------------------------------------------
        // CONTEXT
        // -------------------------------------------

        context: {
          title,

          caption,

          alt,

          altText: alt,

          political_state: aiPolitics,

          vibe: aiVibe,

          objects: aiObjects,

          scenes: aiScenes,

          extended_story: aiStory,

          ai_title: aiTitle,

          ai_political_state: aiPolitics,

          ai_vibe: aiVibe,

          ai_objects: aiObjects,

          ai_scenes: aiScenes,

          ai_extended_story: aiStory,

          parentIds,

          zone_of_interest: zoneOfInterest,

          intimacy_level: intimacyLevel,
        },

        zoneOfInterest,

        intimacyLevel,
      };
    });

    // =================================================
    // RESPONSE
    // =================================================

    return NextResponse.json({
      items,

      nextCursor: res.next_cursor ?? null,

      sortOrder,

      totalCount: res.total_count ?? items.length,

      expression,
    });
  } catch (error) {
    console.error("Cloudinary fetch error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch images",
      },
      {
        status: 500,
      },
    );
  }
}
