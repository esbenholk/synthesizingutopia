import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import OpenAI from "openai";

const CLOUDINARY_CONTEXT_MAX_CHARS = 1000;

// -----------------------------------------------------
// CONFIG
// -----------------------------------------------------

/**
 * Your old AWS Rekognition configuration ignored:
 *
 * - suggestive
 * - violence
 * - visually disturbing
 * - rude gestures
 * - drugs
 * - tobacco
 * - alcohol
 * - gambling
 *
 * So we DON'T simply reject everything that OpenAI flags.
 *
 * Instead, we reject sexual content below.
 *
 * If you later want stricter moderation, you can change
 * this logic inside shouldRejectModeration().
 */

// -----------------------------------------------------
// OPENAI
// -----------------------------------------------------

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// -----------------------------------------------------
// CLOUDINARY
// -----------------------------------------------------

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// -----------------------------------------------------
// HELPERS
// -----------------------------------------------------

function dedupLower(arr: string[]) {
  const seen: Record<string, true> = {};
  const out: string[] = [];

  for (const t of arr) {
    const value = String(t ?? "").trim();
    const key = value.toLowerCase();

    if (key && !seen[key]) {
      seen[key] = true;
      out.push(value);
    }
  }

  return out;
}

/**
 * Splits a long string into chunks that fit within
 * Cloudinary's context value character limit.
 *
 * Tries to break on sentence boundaries where possible.
 */
function chunkText(
  text: string,
  maxLen = CLOUDINARY_CONTEXT_MAX_CHARS,
): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > maxLen) {
    const window = remaining.slice(0, maxLen);

    const lastSentence = Math.max(
      window.lastIndexOf(". "),
      window.lastIndexOf("! "),
      window.lastIndexOf("? "),
    );

    const cutAt = lastSentence > maxLen * 0.5 ? lastSentence + 1 : maxLen;

    chunks.push(remaining.slice(0, cutAt).trim());
    remaining = remaining.slice(cutAt).trim();
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks;
}

/**
 * Convert incoming tags to a predictable string array.
 *
 * Supports:
 * "foo, bar"
 *
 * or:
 * ["foo", "bar"]
 */
function normaliseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

/**
 * Convert arbitrary value to something safe for
 * Cloudinary context metadata.
 */
function toContextString(value: unknown): string {
  if (value == null) return "";

  if (Array.isArray(value)) {
    return value.join(",");
  }

  return String(value);
}

/**
 * Decide whether the image should be rejected.
 *
 * IMPORTANT:
 *
 * We're intentionally NOT using:
 *
 * moderationResult.flagged
 *
 * because that would be stricter than your previous
 * AWS Rekognition setup.
 *
 * Your previous configuration primarily rejected
 * explicit nudity while ignoring many other categories.
 */
function shouldRejectModeration(moderationResult: any): boolean {
  const categories = moderationResult?.categories as
    | Record<string, boolean>
    | undefined;

  if (!categories) {
    return false;
  }

  return Boolean(categories["sexual"] || categories["sexual/minors"]);
}

// -----------------------------------------------------
// ROUTE
// -----------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      imageUrl,
      title,
      tags,
      parentIds,
      folder = "utopias",
      zoneHint,
      intimacyHint,
    } = body;

    // -------------------------------------------------
    // BASIC VALIDATION
    // -------------------------------------------------

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        {
          error: "Missing imageUrl",
        },
        {
          status: 400,
        },
      );
    }

    const rawTitle = typeof title === "string" ? title.trim() : "";

    // -------------------------------------------------
    // PREPARE TITLE FOR CLOUDINARY
    // -------------------------------------------------

    const titleChunks = chunkText(rawTitle);
    const titleFirst = titleChunks[0] ?? "";

    if (titleChunks.length > 1) {
      console.log(
        `Title too long (${rawTitle.length} chars) — split into ${titleChunks.length} chunks`,
      );
    }

    console.log("IMAGE RECEIVED", rawTitle, tags, parentIds);

    // =================================================
    // 1. OPENAI IMAGE MODERATION
    // =================================================

    console.log("Running OpenAI moderation...");

    const moderation = await openai.moderations.create({
      model: "omni-moderation-latest",

      input: [
        {
          type: "image_url",
          image_url: {
            url: imageUrl,
          },
        },
      ],
    });

    const moderationResult = moderation.results?.[0];

    console.log("MODERATION RESULT", moderationResult);

    // -------------------------------------------------
    // REJECT IMAGE IF NECESSARY
    // -------------------------------------------------

    const rejected = shouldRejectModeration(moderationResult);

    if (rejected) {
      console.error(
        "Image rejected by moderation",
        moderationResult?.categories,
      );

      return NextResponse.json(
        {
          error: "image does not adhere to our policy",
        },
        {
          status: 400,
        },
      );
    }

    console.log("Image passed moderation.");

    // =================================================
    // 2. UPLOAD IMAGE TO CLOUDINARY
    // =================================================

    console.log("Uploading to Cloudinary...");

    const result = await cloudinary.uploader.upload(imageUrl, {
      folder,

      context: {
        alt: titleFirst,
        caption: titleFirst,

        parentIds: toContextString(parentIds),
      },

      /**
       * NO moderation property here anymore.
       *
       * Previously you had:
       *
       * moderation: "aws_rek:..."
       *
       * That is what caused:
       *
       * "You don't have an active subscription
       * for Rekognition AI Moderation"
       */
    });

    console.log("Cloudinary upload successful:", result.public_id);

    // =================================================
    // 3. ANALYSE IMAGE WITH OPENAI
    // =================================================

    const visionPrompt = `
You will be given an image of a "Utopia" and the intended title:

"${rawTitle}"

Return ONLY minified JSON with these keys:

{
  "title":"",
  "caption":"",
  "altText":"",
  "extended_story":"",
  "political_state":"",
  "tags":[],
  "vibe":[],
  "objects":[],
  "scenes":[],
  "zoneofinterest":"",
  "intimacylevel":""
}

Rules:

- "title": ≤ 7 words, aligned with "${rawTitle}" (refine if needed).

- "caption": ≤ 2 sentences and start with:
  "in our utopia there is"

- "altText": ≤ 15 words, neutrally describing the image.

- "extended_story": ≤ 3 sentences of fiction taking place inside the image.
  Imagine you are telling a story set in the depicted world.

- "political_state":
  A short, neutral description that fits the image.
  Examples:
  "communal eco-city"
  "technocratic meritocracy"

- "tags":
  Up to 12 short tags.
  Nouns/adjectives only.
  No hashtags or emojis.

- "vibe":
  Up to 3 mood words.

- "objects":
  Up to 8 concrete things visibly present.

- "scenes":
  Up to 4 scene/place words.

- "zoneofinterest":
  ${
    zoneHint
      ? `The user chose "${zoneHint}". Use exactly "${zoneHint}".`
      : `
Pick exactly ONE of:

zoneofinterest1 (Ecology)
zoneofinterest2 (Governance)
zoneofinterest3 (Economy)
zoneofinterest4 (Infrastructure)
zoneofinterest5 (Culture)
zoneofinterest6 (Social)
zoneofinterest7 (Technology)

Choose whichever best fits the image.
`
  }

- "intimacylevel":
  ${
    intimacyHint
      ? `The user chose "${intimacyHint}". Use exactly "${intimacyHint}".`
      : `
Pick exactly ONE of:

intimacylevel1 (Personal/Intimate)
intimacylevel2 (Social/Communal)
intimacylevel3 (Global/Civilisational)

Choose based on the scale of the depicted scene.
`
  }

No extra text.
Return valid JSON only.
`.trim();

    // =================================================
    // 4. GPT IMAGE ANALYSIS
    // =================================================

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",

      messages: [
        {
          role: "user",

          content: [
            {
              type: "text",
              text: visionPrompt,
            },

            {
              type: "image_url",

              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],

      response_format: {
        type: "json_object",
      },

      max_completion_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    console.log("OPENAI RAW IMAGE ANALYSIS", raw);

    // =================================================
    // 5. PARSE GPT RESPONSE
    // =================================================

    let ai: any;

    try {
      ai = JSON.parse(raw);
    } catch (error) {
      console.error("Could not parse OpenAI JSON:", error);

      ai = {};
    }

    const payload = {
      title: String(ai?.title ?? rawTitle ?? "").trim(),

      caption: String(ai?.caption ?? "").trim(),

      altText: String(ai?.altText ?? "").trim(),

      extended_story: String(ai?.extended_story ?? "").trim(),

      political_state: String(ai?.political_state ?? "").trim(),

      tags: Array.isArray(ai?.tags) ? ai.tags.map(String) : [],

      vibe: Array.isArray(ai?.vibe) ? ai.vibe.map(String) : [],

      objects: Array.isArray(ai?.objects) ? ai.objects.map(String) : [],

      scenes: Array.isArray(ai?.scenes) ? ai.scenes.map(String) : [],

      // User hint always wins
      zoneofinterest: String(zoneHint ?? ai?.zoneofinterest ?? "")
        .trim()
        .toLowerCase(),

      // User hint always wins
      intimacylevel: String(intimacyHint ?? ai?.intimacylevel ?? "")
        .trim()
        .toLowerCase(),
    };

    console.log("OPENAI PAYLOAD", payload);

    // =================================================
    // 6. BUILD TAG LIST
    // =================================================

    const incomingTags = normaliseTags(tags);

    const mergedTags = dedupLower([
      ...payload.tags,
      ...payload.vibe,
      ...payload.objects,
      ...payload.scenes,

      ...(payload.zoneofinterest ? [payload.zoneofinterest] : []),

      ...(payload.intimacylevel ? [payload.intimacylevel] : []),

      ...incomingTags,
    ]).slice(0, 30);

    console.log("MERGED TAGS", mergedTags);

    // =================================================
    // 7. BUILD CLOUDINARY CONTEXT
    // =================================================

    const titleContext: Record<string, string> = {
      caption: titleFirst,
    };

    // Store overflow title chunks
    for (let i = 1; i < titleChunks.length; i++) {
      titleContext[`title_continuation_${i}`] = titleChunks[i];
    }

    // =================================================
    // 8. UPDATE CLOUDINARY ASSET METADATA
    // =================================================

    await cloudinary.uploader.explicit(result.public_id, {
      type: "upload",

      tags: mergedTags,

      context: {
        ...titleContext,

        alt: payload.altText,

        ai_title: payload.title,

        ai_political_state: payload.political_state,

        ai_vibe: payload.vibe.join(", "),

        ai_objects: payload.objects.slice(0, 5).join(", "),

        ai_scenes: payload.scenes.join(", "),

        ai_extended_story: payload.extended_story,

        parentIds: toContextString(parentIds),

        zone_of_interest: payload.zoneofinterest,

        intimacy_level: payload.intimacylevel,
      },
    });

    console.log("Cloudinary metadata updated.");

    // =================================================
    // 9. RETURN RESULT
    // =================================================

    return NextResponse.json({
      url: result.secure_url,

      publicId: result.public_id,

      title: rawTitle,

      alt: payload.altText,

      ai_title: payload.title,

      ai_political_state: payload.political_state,

      ai_vibe: payload.vibe.join(", "),

      ai_objects: payload.objects.slice(0, 5).join(", "),

      ai_scenes: payload.scenes.join(", "),

      ai_extended_story: payload.extended_story,

      tags: mergedTags,

      parentIds: parentIds ?? null,

      zoneofinterest: payload.zoneofinterest,

      intimacylevel: payload.intimacylevel,

      title_chunks: titleChunks.length,

      moderation: {
        passed: true,
      },
    });
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);

    return NextResponse.json(
      {
        error: "Failed to upload image",

        details: error?.message ?? "Unknown error",
      },
      {
        status: 500,
      },
    );
  }
}
