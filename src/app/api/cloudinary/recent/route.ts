import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { describe } from "node:test";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type Image = {
  id: string;
  url: string;
  title: string;
  tags: string[];
  date: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const skip = parseInt(url.searchParams.get("skip") || "0", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const folder = url.searchParams.get("folder") || "utopias"; // ← don't parseInt

  try {
    const res = await cloudinary.search
      .expression(`folder="${folder}"`) // ← Cloudinary query syntax
      .sort_by("created_at", "desc")
      .with_field("context") // context.custom
      .with_field("metadata") // structured metadata
      .with_field("tags")
      .max_results(skip + limit) // crude paging; consider next_cursor later
      .execute();

    const seen = new Set<string>(); // de-dupe by asset_id or public_id
    const pick = (obj: any, kCamel: string, kSnake: string) =>
      obj?.[kCamel] ?? obj?.[kSnake] ?? null;

    const images: Image[] = (res.resources || [])
      .slice(skip, skip + limit)
      .map((r: any) => {
        const cx = r.context?.custom ?? r.context ?? {}; // some SDKs put values under context.custom
        const md = r.metadata ?? {};

        const aiTitle =
          pick(cx, "aiTitle", "ai_title") ?? pick(md, "aiTitle", "ai_title");

        return {
          id: r.asset_id,
          url: r.secure_url,
          title:
            pick(cx, "caption", "caption") ??
            pick(md, "title", "title") ??
            r.public_id?.split("/").pop() ??
            "Untitled",
          tags: (r.tags || []).filter(Boolean),
          date: r.created_at,
          description:
            pick(cx, "alt", "alt") ?? pick(md, "description", "description"),
          aiCaption:
            pick(cx, "aiCaption", "ai_caption") ??
            pick(md, "aiCaption", "ai_caption"),
          aiTitle, // used for filtering below
          aiVibe:
            pick(cx, "aiVibe", "ai_vibe") ?? pick(md, "aiVibe", "ai_vibe"),
          aiPolitics:
            pick(cx, "aiPolitics", "ai_political_state") ??
            pick(md, "aiPolitics", "ai_political_state"),
          aiObjects:
            pick(cx, "aiObjects", "ai_objects") ??
            pick(md, "aiObjects", "ai_objects"),
          aiStory:
            pick(cx, "aiStory", "ai_extended_story") ??
            pick(md, "aiStory", "ai_extended_story"),
          parentIds: cx?.parentIds ?? md?.parentIds ?? null,
        };
      })
      // 1) require aiTitle
      .filter((img: any) => !!img.aiTitle)
      // 2) de-dupe (optional but handy if you have duplicates)
      .filter((img: any) => {
        const key = img.id; // or use `${img.title}|${img.url}` if asset_id isn't unique for you
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    return NextResponse.json(images);
  } catch (error) {
    console.error("Cloudinary fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent images" },
      { status: 500 }
    );
  }
}
