import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    if (!prompt) return NextResponse.json({}, { status: 400 });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      max_tokens: 60,
      messages: [
        {
          role: "user",
          content: `Given this image description: "${prompt}"

Return ONLY valid JSON with exactly these two keys:
- "zoneofinterest": exactly one of zoneofinterest1 (Ecology), zoneofinterest2 (Governance), zoneofinterest3 (Economy), zoneofinterest4 (Infrastructure), zoneofinterest5 (Culture), zoneofinterest6 (Social), zoneofinterest7 (Technology)
- "intimacylevel": exactly one of intimacylevel1 (Personal/Intimate), intimacylevel2 (Social/Communal), intimacylevel3 (Global/Civilisational)

Example: {"zoneofinterest":"zoneofinterest5","intimacylevel":"intimacylevel2"}`,
        },
      ],
    });

    const raw = completion.choices[0].message.content?.trim() ?? "{}";
    const clean = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    return NextResponse.json({
      zoneofinterest: String(result.zoneofinterest ?? "").toLowerCase(),
      intimacylevel: String(result.intimacylevel ?? "").toLowerCase(),
    });
  } catch (err) {
    console.error("classifyImage error:", err);
    return NextResponse.json({}, { status: 500 });
  }
}
