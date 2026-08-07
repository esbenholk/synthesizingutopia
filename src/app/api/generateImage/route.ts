import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerationResult {
  prompt: string;
  remixedPrompt: string;
  imageUrl: string;
  tags: string;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const prompt = url.searchParams.get("prompt") || "";
    const adjectives = url.searchParams.get("adjectives") || "";

    if (!prompt.trim()) {
      return NextResponse.json(
        { error: "Missing prompt parameter" },
        { status: 400 },
      );
    }

    console.log("Generating image from prompt:", prompt);

    // 1) Generate a better image prompt
    const completion = await openai.responses.create({
      model: "gpt-4o-mini",
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

Rules:
- do NOT include captions
- do NOT include typography
- do NOT include UI elements
- do NOT include interfaces
- output only the final image prompt
      `.trim(),
    });

    const sentence = completion.output_text.trim().replace(/^["']|["']$/g, "");

    console.log("Remixed prompt:", sentence);

    const styleSuffix =
      "The image should be in the style of medieval drawings, fantasy, post-internet graphics, and sci-fi. Do not show captions, text, labels, or UI elements.";

    // 2) Generate the image
    // If your account does not have access to "gpt-image-2",
    // change this model name to the image model available to your account.
    const image = await openai.images.generate({
      model: "gpt-image-2",
      prompt: `${sentence}\n\n${styleSuffix}`.trim(),
      size: "1024x1024",
      quality: "medium",
      n: 1,
    });

    const imageBase64 = image.data?.[0]?.b64_json;

    if (!imageBase64) {
      throw new Error("No image data returned from OpenAI");
    }

    // Return as a data URL so it can be used directly in the frontend
    const imageUrl = `data:image/png;base64,${imageBase64}`;

    const data: GenerationResult = {
      prompt,
      remixedPrompt: sentence,
      imageUrl,
      tags: adjectives,
    };

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Generation error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate content",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
