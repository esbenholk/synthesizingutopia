import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CLOUDINARY_CONTEXT_MAX_CHARS = 1000;

// =====================================================
// CLIENTS
// =====================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =====================================================
// UTILS
// =====================================================

function dedupLower(arr: string[]) {
  const seen: Record<string, true> = {};
  const out: string[] = [];

  for (const item of arr) {
    const value = String(item ?? "").trim();
    const key = value.toLowerCase();

    if (key && !seen[key]) {
      seen[key] = true;
      out.push(value);
    }
  }

  return out;
}

function chunkText(
  text: string,
  maxLen = CLOUDINARY_CONTEXT_MAX_CHARS,
): string[] {
  if (!text) return [""];

  if (text.length <= maxLen) {
    return [text];
  }

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

function contextValue(value: unknown): string {
  if (value == null) return "";

  if (Array.isArray(value)) {
    return value.map(String).join(",").slice(0, CLOUDINARY_CONTEXT_MAX_CHARS);
  }

  return String(value).slice(0, CLOUDINARY_CONTEXT_MAX_CHARS);
}

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
 * Our old AWS Rekognition setup rejected explicit nudity
 * but ignored violence, suggestive content, drugs, etc.
 *
 * Therefore we DON'T reject moderationResult.flagged,
 * because that would be substantially stricter.
 *
 * Instead we specifically reject the sexual category.
 */
function shouldRejectModeration(moderationResult: unknown): boolean {
  const result = moderationResult as {
    categories?: Record<string, boolean>;
  };

  return Boolean(result?.categories?.["sexual"]);
}

// =====================================================
// ROUTE
// =====================================================

export async function POST(request: Request) {
  // ---------------------------------------------------
  // Read the request BEFORE starting the stream.
  // ---------------------------------------------------

  let body: any;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid request body",
      },
      {
        status: 400,
      },
    );
  }

  const {
    prompt = "",
    adjectives = "",
    title = "",
    tags = "",
    parentIds,
  } = body;

  const url = new URL(request.url);

  const folder = url.searchParams.get("folder") || "utopias";

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json(
      {
        error: "Missing required field: prompt",
      },
      {
        status: 400,
      },
    );
  }

  // ===================================================
  // HEROKU STREAM
  // ===================================================

  const encoder = new TextEncoder();

  let heartbeat: ReturnType<typeof setInterval> | undefined;

  let streamClosed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // -----------------------------------------------
      // Helpers for writing safely to the stream.
      // -----------------------------------------------

      const send = (text: string) => {
        if (streamClosed) return;

        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          streamClosed = true;

          if (heartbeat) {
            clearInterval(heartbeat);
          }
        }
      };

      const finish = (data: unknown) => {
        if (heartbeat) {
          clearInterval(heartbeat);
        }

        if (streamClosed) return;

        try {
          send(JSON.stringify(data));

          controller.close();
          streamClosed = true;
        } catch (error) {
          console.error("Could not close stream:", error);
        }
      };

      // -----------------------------------------------
      // Send first byte immediately.
      //
      // Whitespace before JSON is valid JSON.
      // -----------------------------------------------

      send("\n");

      // -----------------------------------------------
      // Keep the Heroku connection alive.
      // -----------------------------------------------

      heartbeat = setInterval(() => {
        send(" \n");
      }, 15_000);

      // =================================================
      // RUN THE ACTUAL GENERATION PIPELINE
      // =================================================

      void (async () => {
        try {
          console.log("Getting ready to make image:", prompt);

          // =============================================
          // 1. EXPAND / REMIX PROMPT
          // =============================================

          console.log("Generating remixed prompt...");

          const completion = await openai.responses.create({
            model: "gpt-5-mini",

            input: `
You are an image prompt engineer.

Expand the following concept into a strong visual image-generation prompt in English.

Base concept:

"There is ${prompt}"

Desired vibe:

${adjectives}

The world should combine:

- medieval drawings
- fantasy
- post-internet graphics
- science fiction

Describe a coherent scene rather than simply listing styles.

Do not include:
- captions
- typography
- interface elements
- UI
- labels

Output ONLY the final image prompt.
                `.trim(),

            max_output_tokens: 300,
          });

          let remixedPrompt = completion.output_text
            .trim()
            .replaceAll('"', "")
            .replaceAll("** imageprompt **", "")
            .replaceAll("*", "")
            .replaceAll("Image Prompt:", "")
            .trim();

          if (!remixedPrompt) {
            // Fallback if the remix call somehow
            // returned no usable text.
            remixedPrompt = `
There is ${prompt}.

The atmosphere is ${adjectives}.

A world combining medieval drawings,
fantasy, post-internet graphics and
science fiction.

No captions, typography, UI,
interfaces or labels.
              `.trim();
          }

          console.log("Has prompt:", remixedPrompt);

          // =============================================
          // 2. GENERATE IMAGE
          // =============================================

          console.log("Starting GPT Image generation...");

          const imageGen = await openai.images.generate({
            model: "gpt-image-2",

            prompt: remixedPrompt,

            size: "1024x1024",

            quality: "medium",

            output_format: "png",

            n: 1,
          });

          console.log("Image generation finished.");

          // GPT Image returns base64.
          const b64 = imageGen.data?.[0]?.b64_json;

          if (!b64) {
            throw new Error("No b64_json returned from image generation");
          }

          const dataUrl = `data:image/png;base64,${b64}`;

          // =============================================
          // 3. MODERATE IMAGE BEFORE CLOUDINARY
          // =============================================

          console.log("Running image moderation...");

          const moderation = await openai.moderations.create({
            model: "omni-moderation-latest",

            input: [
              {
                type: "image_url",

                image_url: {
                  url: dataUrl,
                },
              },
            ],
          });

          const moderationResult = moderation.results?.[0];

          console.log("Moderation result:", moderationResult);

          const wasRejected = shouldRejectModeration(moderationResult);

          if (wasRejected) {
            console.error(
              "Image rejected by moderation.",
              moderationResult?.categories,
            );

            // IMPORTANT:
            //
            // Because we've already started streaming,
            // HTTP status is already 200.
            //
            // Therefore error state is communicated
            // inside the JSON response.
            finish({
              ok: false,

              error: "image does not adhere to our policy",

              status: 400,
            });

            return;
          }

          console.log("Image passed moderation.");

          // =============================================
          // 4. UPLOAD TO CLOUDINARY
          // =============================================

          console.log("Uploading image to Cloudinary...");

          const uploadResult = await cloudinary.uploader.upload(dataUrl, {
            folder,

            context: {
              alt: contextValue(title || prompt),

              caption: contextValue(title || prompt),

              parentIds: contextValue(parentIds),
            },

            // IMPORTANT:
            //
            // NO aws_rek moderation here.
            //
            // Moderation has already been done
            // with OpenAI.
          });

          console.log("Cloudinary upload complete:", uploadResult.public_id);

          // =============================================
          // 5. IMAGE / VISION METADATA PASS
          // =============================================

          const visionPrompt = `
You will be given an image of a "Utopia" and the intended title:

"${prompt}"

Return ONLY valid JSON with these keys:

{
  "title":"",
  "caption":"",
  "altText":"",
  "extended_story":"",
  "political_state":"",
  "tags":[],
  "vibe":[],
  "objects":[],
  "scenes":[]
}

Rules:

- "title":
  ≤ 7 words, aligned with "${prompt}".
  Refine if needed.

- "caption":
  ≤ 2 sentences.
  Start with:
  "in our utopia there is"

- "altText":
  ≤ 15 words.
  Neutrally describe the image.

- "extended_story":
  ≤ 3 sentences of fiction taking place
  inside the depicted world.

- "political_state":
  A short neutral description that fits
  the image.
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

Return valid JSON only.
No markdown.
No explanations.
            `.trim();

          console.log("Starting vision analysis...");

          const vision = await openai.chat.completions.create({
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
                      url: uploadResult.secure_url,
                    },
                  },
                ],
              },
            ],

            response_format: {
              type: "json_object",
            },

            max_completion_tokens: 800,
          });

          const raw = vision.choices[0]?.message?.content ?? "{}";

          console.log("Has JSON analysis:", raw);

          // =============================================
          // 6. PARSE AI METADATA
          // =============================================

          let ai: any = {};

          try {
            ai = JSON.parse(raw);
          } catch (error) {
            console.error("Could not parse vision JSON:", error);

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
          };

          console.log("AI metadata payload:", payload);

          // =============================================
          // 7. CREATE TAG LIST
          // =============================================

          const aiTags = dedupLower([
            ...payload.tags,
            ...payload.vibe,
            ...payload.objects,
            ...payload.scenes,
          ]).slice(0, 25);

          const userTags = normaliseTags(tags);

          const finalTags = dedupLower([...aiTags, ...userTags]).slice(0, 30);

          console.log("Final tags:", finalTags);

          // =============================================
          // 8. BUILD CLOUDINARY CAPTION CONTEXT
          // =============================================

          const captionSource = String(title || remixedPrompt).trim();

          const captionChunks = chunkText(captionSource);

          const titleContext: Record<string, string> = {
            caption: captionChunks[0] ?? "",
          };

          for (let i = 1; i < captionChunks.length; i++) {
            titleContext[`title_continuation_${i}`] = captionChunks[i];
          }

          // =============================================
          // 9. ENRICH CLOUDINARY ASSET
          // =============================================

          console.log("Updating Cloudinary metadata...");

          await cloudinary.uploader.explicit(uploadResult.public_id, {
            type: "upload",

            tags: finalTags.join(","),

            context: {
              ...titleContext,

              alt: contextValue(payload.altText),

              ai_title: contextValue(payload.title),

              ai_political_state: contextValue(payload.political_state),

              ai_vibe: contextValue(payload.vibe.join(", ")),

              ai_objects: contextValue(payload.objects.slice(0, 5).join(", ")),

              ai_scenes: contextValue(payload.scenes.join(", ")),

              ai_extended_story: contextValue(payload.extended_story),

              parentIds: contextValue(parentIds),
            },
          });

          console.log("Cloudinary metadata updated.");

          // =============================================
          // 10. FINAL RESPONSE
          // =============================================

          finish({
            ok: true,

            prompt,

            adjectives,

            remixedPrompt,

            // GPT Image models no longer return
            // the temporary OpenAI URL used by
            // the old DALL-E flow.
            openaiImageUrl: null,

            // Cloudinary
            url: uploadResult.secure_url,

            publicId: uploadResult.public_id,

            folder,

            // AI metadata
            title: title || remixedPrompt,

            alt: payload.altText,

            ai_title: payload.title,

            ai_political_state: payload.political_state,

            ai_vibe: payload.vibe.join(", "),

            ai_objects: payload.objects.slice(0, 5).join(", "),

            ai_scenes: payload.scenes.join(", "),

            ai_extended_story: payload.extended_story,

            tags: finalTags,

            parentIds: parentIds ?? null,

            moderation: {
              passed: true,
            },
          });
        } catch (error: any) {
          console.error("Generate+Upload error:", error);

          // Because streaming already started,
          // the HTTP response status is already 200.
          finish({
            ok: false,

            error: "Failed to generate and upload image",

            details: error?.message ?? "Unknown error",

            status: 500,
          });
        }
      })();
    },

    cancel() {
      streamClosed = true;

      if (heartbeat) {
        clearInterval(heartbeat);
      }

      console.log("Generate+Upload client disconnected.");
    },
  });

  return new Response(stream, {
    status: 200,

    headers: {
      "Content-Type": "application/json; charset=utf-8",

      "Cache-Control": "no-cache, no-transform",

      "X-Accel-Buffering": "no",
    },
  });
}
