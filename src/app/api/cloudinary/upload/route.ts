import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

import OpenAI from "openai";

const CLOUDINARY_CONTEXT_MAX_CHARS = 1000;

function dedupLower(arr: string[]) {
  const seen: Record<string, true> = {};
  const out: string[] = [];
  for (const t of arr) {
    const k = t.trim().toLowerCase();
    if (k && !seen[k]) {
      seen[k] = true;
      out.push(t.trim());
    }
  }
  return out;
}

/**
 * Splits a long string into chunks that fit within Cloudinary's context value
 * character limit. Tries to break on sentence boundaries (". ") where possible,
 * otherwise falls back to hard-cutting at the limit.
 */
function chunkText(
  text: string,
  maxLen = CLOUDINARY_CONTEXT_MAX_CHARS,
): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > maxLen) {
    // Try to find a sentence boundary within the allowed window
    const window = remaining.slice(0, maxLen);
    const lastSentence = Math.max(
      window.lastIndexOf(". "),
      window.lastIndexOf("! "),
      window.lastIndexOf("? "),
    );

    const cutAt =
      lastSentence > maxLen * 0.5
        ? lastSentence + 1 // include the punctuation, cut before the space
        : maxLen; // no good boundary found – hard cut

    chunks.push(remaining.slice(0, cutAt).trim());
    remaining = remaining.slice(cutAt).trim();
  }

  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const {
      imageUrl,
      title,
      tags,
      parentIds,
      folder = "utopias",
      zoneHint,
      intimacyHint,
    } = await request.json();

    // Pre-process title: chunk it immediately so every Cloudinary write is safe
    const titleChunks = chunkText(
      typeof title === "string" ? title.trim() : "",
    );
    const titleFirst = titleChunks[0] ?? "";
    if (titleChunks.length > 1) {
      console.log(
        `Title too long (${title.length} chars) — split into ${titleChunks.length} chunks`,
      );
    }

    // Upload image to Cloudinary
    console.log("IMAGE UPLOAD", title, tags, parentIds, imageUrl);

    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: folder,
      context: {
        alt: titleFirst,
        caption: titleFirst,
        parentIds: parentIds != null ? parentIds.toString() : "",
      },
      moderation:
        "aws_rek:" +
        "explicit_nudity:0.7:" +
        "hate_symbols:0.6:" +
        "suggestive:ignore:" +
        "violence:ignore:" +
        "visually_disturbing:ignore:" +
        "rude_gestures:ignore:" +
        "drugs:ignore:" +
        "tobacco:ignore:" +
        "alcohol:ignore:" +
        "gambling:ignore",
    });

    // moderation check
    const moderationArr = (result as any).moderation as
      | {
          status: string;
          kind: string;
          info?: Record<string, any>;
        }[]
      | undefined;

    const wasRejected = moderationArr?.some(
      (m) => m.status === "rejected" && m.kind.startsWith("aws_rek"),
    );

    if (!wasRejected) {
      console.log("image not rejected", wasRejected);

      const visionPrompt = `
        You will be given an image of a "Utopia" and the intended title: "${title}".

        Return ONLY minified JSON with these keys:
        {"title":"","caption":"","altText":"","extended_story":"","political_state":"","tags":[],"vibe":[],"objects":[],"scenes":[],"zoneofinterest":"","intimacylevel":""}

        Rules:
        - "title": ≤ 7 words, aligned with "${title}" (refine if needed).
        - "caption": ≤ 2 sentences, start with "in our utopia there is".
        - "altText": ≤ 15 words, describing neutrally the image. 
        - "extended_story": ≤ 3 sentences fiction inside the image. imagine you are telling are story set in the image".
        - "political_state": a short, neutral description that fits the image (e.g., "communal eco-city", "technocratic meritocracy").
        - "tags": up to 12 short tags (nouns/adjectives; no hashtags/emojis).
        - "vibe": up to 3 mood words.
        - "objects": up to 8 concrete things visible.
        - "scenes": up to 4 scene/place words.
        - "zoneofinterest": ${zoneHint ? `user chose "${zoneHint}", use exactly that` : `pick exactly ONE of: zoneofinterest1 (Ecology), zoneofinterest2 (Governance), zoneofinterest3 (Economy), zoneofinterest4 (Infrastructure), zoneofinterest5 (Culture), zoneofinterest6 (Social), zoneofinterest7 (Technology) — whichever best fits the image`}.
        - "intimacylevel": ${intimacyHint ? `user chose "${intimacyHint}", use exactly that` : `pick exactly ONE of: intimacylevel1 (Personal/Intimate), intimacylevel2 (Social/Communal), intimacylevel3 (Global/Civilisational) — based on the scale of the depicted scene`}.
        - No extra text; JSON only.`;

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: visionPrompt,
            },
            { type: "image_url", image_url: { url: imageUrl } }, // URL or base64 data URL
          ],
        },
      ];
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        temperature: 0.3,
        response_format: { type: "json_object" }, // ensures pure JSON
        max_tokens: 400, // keep costs low
      });

      console.log("openai answers", completion);

      const raw = completion.choices[0]?.message?.content ?? "{}";

      let ai;
      try {
        ai = JSON.parse(raw);
      } catch {
        ai = {};
      }

      const payload = {
        title: String(ai?.title ?? title ?? "").trim(),
        caption: String(ai?.caption ?? "").trim(),
        altText: String(ai?.altText ?? "").trim(),
        extended_story: String(ai?.extended_story ?? "").trim(),
        political_state: String(ai?.political_state ?? "").trim(),
        tags: Array.isArray(ai?.tags) ? ai.tags.map(String) : [],
        vibe: Array.isArray(ai?.vibe) ? ai.vibe.map(String) : [],
        objects: Array.isArray(ai?.objects) ? ai.objects.map(String) : [],
        scenes: Array.isArray(ai?.scenes) ? ai.scenes.map(String) : [],
        // ✦ USER HINT TAKES PRECEDENCE over AI suggestion for zone/intimacy
        zoneofinterest: String(zoneHint ?? ai?.zoneofinterest ?? "")
          .trim()
          .toLowerCase(),
        intimacylevel: String(intimacyHint ?? ai?.intimacylevel ?? "")
          .trim()
          .toLowerCase(),
      };

      const mergedTags = dedupLower([
        ...payload.tags,
        ...payload.vibe,
        ...payload.objects,
        ...payload.scenes,
        ...(payload.zoneofinterest ? [payload.zoneofinterest] : []),
        ...(payload.intimacylevel ? [payload.intimacylevel] : []),
      ]).slice(0, 27); // bumped to 27 to fit zone + intimacy

      let mergedTagsString = mergedTags.join(",");

      if (tags != null) {
        mergedTagsString += ", " + tags;
      }
      console.log("OPENAI PAYLOAD", payload);

      // Build title context from the already-chunked title (computed at top of POST)
      const titleContext: Record<string, string> = { caption: titleFirst };
      for (let i = 1; i < titleChunks.length; i++) {
        titleContext[`title_continuation_${i}`] = titleChunks[i];
      }

      await cloudinary.uploader.explicit(result.public_id, {
        type: "upload",
        tags: mergedTagsString, // or use add_tag(...) to append
        context: {
          // Title: first chunk goes to `caption`, overflows to title_continuation_N keys
          ...titleContext,
          alt: payload.altText,
          ai_title: payload.title,
          ai_political_state: payload.political_state,
          ai_vibe: (payload.vibe || []).join(", "),
          ai_objects: (payload.objects || []).slice(0, 5).join(", "),
          ai_scenes: (payload.scenes || []).join(", "),
          ai_extended_story: payload.extended_story,
          parentIds: parentIds != null ? parentIds : "",
          zone_of_interest: payload.zoneofinterest,
          intimacy_level: payload.intimacylevel,
        },
      });

      return NextResponse.json({
        url: result.secure_url,
        publicId: result.public_id,
        title: title,
        alt: payload.altText,
        ai_title: payload.title,
        ai_political_state: payload.political_state,
        ai_vibe: (payload.vibe || []).join(", "),
        ai_objects: (payload.objects || []).slice(0, 5).join(", "),
        ai_scenes: (payload.scenes || []).join(", "),
        ai_extended_story: payload.extended_story,
        tags: mergedTags.concat(tags),
        parentIds: parentIds != null && parentIds,
        title_chunks: titleChunks.length,
      });
    } else {
      console.error("explicit image");
      return NextResponse.json(
        { error: "image does not adhere to our policy" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}
