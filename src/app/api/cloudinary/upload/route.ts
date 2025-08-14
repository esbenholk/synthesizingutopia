import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

import OpenAI from "openai";

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
    const { imageUrl, title, tags, parentIds } = await request.json();
    // Upload image to Cloudinary
    console.log("IMAGE UPLOAD", title, tags, parentIds);

    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: "utopias",
      context: {
        alt: title,
        caption: title,
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
      (m) => m.status === "rejected" && m.kind.startsWith("aws_rek")
    );

    if (!wasRejected) {
      console.log("image not rejected", wasRejected);

      const visionPrompt = `
        You will be given an image of a "Utopia" and the intended title: "${title}".

        Return ONLY minified JSON with these keys:
        {"title":"","caption":"","altText":"","extended_story":"","political_state":"","tags":[],"vibe":[],"objects":[],"scenes":[]}

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
      };

      const mergedTags = dedupLower([
        ...payload.tags,
        ...payload.vibe,
        ...payload.objects,
        ...payload.scenes,
      ]).slice(0, 25); // keep it tidy

      let mergedTagsString = mergedTags.join(",");

      if (tags != null) {
        mergedTagsString += ", " + tags;
      }
      console.log("OPENAI PAYLOAD", payload);

      await cloudinary.uploader.explicit(result.public_id, {
        type: "upload",
        tags: mergedTagsString, // or use add_tag(...) to append
        context: {
          caption: title,
          alt: payload.altText,
          ai_title: payload.title,
          ai_political_state: payload.political_state,
          ai_vibe: (payload.vibe || []).join(", "),
          ai_objects: (payload.objects || []).slice(0, 5).join(", "),
          ai_scenes: (payload.scenes || []).join(", "),
          ai_extended_story: payload.extended_story,
          parentIds: parentIds != null && parentIds,
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
      });
    } else {
      console.error("explicit image");
      return NextResponse.json(
        { error: "image does not adhere to our policy" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
