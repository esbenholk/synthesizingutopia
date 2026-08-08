import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // ------------------------------------------------
      // IMPORTANT:
      // Send something immediately so Heroku knows
      // the request is alive.
      //
      // Whitespace before JSON is valid JSON.
      // ------------------------------------------------

      controller.enqueue(encoder.encode("\n"));

      // Send another harmless whitespace chunk every
      // 15 seconds while OpenAI is generating.
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(" \n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15_000);

      // Run generation asynchronously inside the stream
      (async () => {
        try {
          const url = new URL(request.url);

          const prompt = url.searchParams.get("prompt") || "";

          const adjectives = url.searchParams.get("adjectives") || "";

          if (!prompt.trim()) {
            clearInterval(heartbeat);

            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  error: "Missing prompt parameter",
                }),
              ),
            );

            controller.close();
            return;
          }

          console.log("Generating image from prompt:", prompt);

          // ============================================
          // 1. REMIX / EXPAND THE PROMPT
          // ============================================

          const completion = await openai.responses.create({
            model: "gpt-5-mini",

            input: `
You are an image prompt engineer.

Expand the following concept into a strong image-generation prompt in English.

Base concept:
"There is ${prompt}"

Desired vibe:
${adjectives}

Visual style:
- medieval drawings
- fantasy
- post-internet graphics
- sci-fi
- crayola

Rules:
- do NOT include captions
- do NOT include typography
- do NOT include UI elements
- do NOT include interfaces
- output only the final image prompt
              `.trim(),
          });

          const sentence = completion.output_text
            .trim()
            .replace(/^["']|["']$/g, "");

          console.log("Remixed prompt:", sentence);

          // ============================================
          // 2. GENERATE IMAGE
          // ============================================

          const styleSuffix = `
The image should be in the style of medieval drawings,
fantasy, post-internet graphics and sci-fi.

The image must not contain captions, typography,
labels, interface elements or UI.
          `.trim();

          console.log("Starting image generation...");

          const image = await openai.images.generate({
            model: "gpt-image-2",

            prompt: `
${sentence}

${styleSuffix}
              `.trim(),

            n: 1,

            size: "1024x1024",

            quality: "medium",
          });

          console.log("Image generation finished.");

          // ============================================
          // 3. GET BASE64 IMAGE
          // ============================================

          const imageBase64 = image.data?.[0]?.b64_json;

          if (!imageBase64) {
            throw new Error("No image data returned from OpenAI");
          }

          const imageUrl = `data:image/png;base64,${imageBase64}`;

          // ============================================
          // 4. BUILD RESPONSE
          // ============================================

          const data = {
            prompt,

            remixedPrompt: sentence,

            imageUrl,

            tags: adjectives,
          };

          // Stop heartbeat before writing final JSON
          clearInterval(heartbeat);

          // The response body at this point looks like:
          //
          //
          //    <whitespace>
          //    <whitespace>
          //    {"prompt": ...}
          //
          // which is still valid JSON.

          controller.enqueue(encoder.encode(JSON.stringify(data)));

          controller.close();
        } catch (error: any) {
          clearInterval(heartbeat);

          console.error("Generation error:", error);

          // Since HTTP headers have already been sent,
          // we cannot change the HTTP status to 500 here.
          // Instead return an error object.
          try {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  error: "Failed to generate content",

                  details: error?.message || "Unknown error",
                }),
              ),
            );

            controller.close();
          } catch (streamError) {
            console.error("Could not send stream error:", streamError);
          }
        }
      })();
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
