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
// TAG SEARCH
// =====================================================

// Split ONLY on commas so multi-word tags
// e.g. "cute dog" stay intact.
function parseSearchToTags(raw: string | null) {
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
// LEGACY TITLE SUPPORT
// =====================================================

/**
 * OLD assets sometimes stored the original title like:
 *
 * caption
 * title_continuation_1
 * title_continuation_2
 *
 * New assets DO NOT use this structure.
 *
 * New assets have:
 *
 * title   -> short reader-friendly title
 * caption -> "in our utopia there is..."
 *
 * So this function is only a fallback for old assets.
 */
function reassembleLegacyTitle(cx: Record<string, any>): string {
  const continuations: string[] = [];

  let i = 1;

  while (cx[`title_continuation_${i}`]) {
    continuations.push(String(cx[`title_continuation_${i}`]).trim());

    i++;
  }

  // Only interpret caption as an old title if
  // continuation fields actually exist.
  //
  // Otherwise a NEW reader-friendly caption could
  // accidentally become the title.
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
  // QUERY PARAMETERS
  // ---------------------------------------------------

  const limit = parseInt(url.searchParams.get("limit") || "10", 10);

  const foldersParam = url.searchParams.get("folders");

  const folder = url.searchParams.get("folder");

  // Build array of folders
  const folders = foldersParam
    ? foldersParam
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
    : folder
      ? [folder]
      : ["utopia", "utopias"];

  const cursor = url.searchParams.get("cursor") || undefined;

  const sortParam = (url.searchParams.get("sort") || "asc").toLowerCase();

  const sortOrder = sortParam === "desc" ? "desc" : "asc";

  const searchRaw = url.searchParams.get("search");

  const tags = parseSearchToTags(searchRaw);

  try {
    // =================================================
    // BUILD CLOUDINARY SEARCH
    // =================================================

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

    // =================================================
    // MAP CLOUDINARY -> UNITY
    // =================================================

    const items = (res.resources || []).map((r: any) => {
      // Cloudinary may return context as:
      //
      // context: {
      //   custom: {...}
      // }
      //
      // or directly as:
      //
      // context: {...}

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
        // NEW canonical key
        pick(cx, "title", "title"),

        // existing compatibility key
        aiTitle,

        pick(md, "title", "title"),

        // support old assets
        legacyTitle,

        r.public_id?.split("/").pop(),

        "Untitled",
      );

      // =============================================
      // CAPTION / DESCRIPTION
      // =============================================

      /*
       * This is the short reader-friendly text:
       *
       * "in our utopia there is..."
       */

      const caption = firstNonEmpty(
        pick(cx, "caption", "caption"),

        pick(md, "caption", "caption"),
      );

      // =============================================
      // ALT TEXT
      // =============================================

      const alt = firstNonEmpty(
        // New explicit key
        pick(cx, "altText", "altText"),

        pick(cx, "alt_text", "alt_text"),

        // Cloudinary's normal Description / alt
        pick(cx, "alt", "alt"),

        pick(md, "description", "description"),
      );

      // =============================================
      // POLITICAL STATE
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
      // ZONE + INTIMACY
      // =============================================

      const zoneOfInterest = firstNonEmpty(
        pick(cx, "zoneOfInterest", "zone_of_interest"),

        pick(md, "zoneOfInterest", "zone_of_interest"),
      );

      const intimacyLevel = firstNonEmpty(
        pick(cx, "intimacyLevel", "intimacy_level"),

        pick(md, "intimacyLevel", "intimacy_level"),
      );

      // =============================================
      // RETURN OBJECT FOR UNITY
      // =============================================

      return {
        // -------------------------------------------
        // Core Cloudinary identity
        // -------------------------------------------

        id: r.asset_id ?? r.public_id,

        public_id: r.public_id,

        url: r.secure_url ?? r.url,

        // Unity's ApiImage currently uses `date`
        date: r.created_at,

        // Preserve this too for anything else
        // consuming the endpoint.
        created_at: r.created_at,

        tags: r.tags ?? [],

        // -------------------------------------------
        // READER-FRIENDLY VALUES
        // -------------------------------------------

        title,

        /*
         * IMPORTANT:
         *
         * Unity's Description should be the CAPTION,
         * not the neutral alt and not the long prompt.
         */
        description: caption,

        /*
         * Keep these top-level too for compatibility.
         */
        caption,

        alt,

        // -------------------------------------------
        // EXISTING UNITY ApiImage FIELD NAMES
        // -------------------------------------------

        aiTitle,

        aiVibe,

        aiPolitics,

        aiObjects,

        aiStory,

        parentIds,

        // Optional but useful if ApiImage later adds it
        aiScenes,

        // -------------------------------------------
        // FULL CONTEXT FOR UNITY
        // -------------------------------------------
        //
        // THIS WAS MISSING BEFORE.
        //
        // JsonUtility can now populate
        // ApiImage.context correctly.
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

          // Keep existing aliases too

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

        // -------------------------------------------
        // Also expose these at top level
        // for other clients / debugging
        // -------------------------------------------

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
