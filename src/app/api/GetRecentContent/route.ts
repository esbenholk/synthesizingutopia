import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const limitNumber = parseInt(url.searchParams.get("limit") || "10", 10);
    const cursor = url.searchParams.get("cursor"); // <- new
    const folder = url.searchParams.get("folder"); // optional

    const qs = new URLSearchParams();
    qs.set("limit", String(limitNumber));
    if (cursor) qs.set("cursor", cursor);
    if (folder) qs.set("folder", folder);

    const recentImagesResponse = await fetch(
      `${process.env.BASE_URL}/api/cloudinary/recent?${qs.toString()}`,
      { cache: "no-store" }, // helpful while debugging
    );

    const data = await recentImagesResponse.json();

    if (!recentImagesResponse.ok) {
      throw new Error(data?.error || "Recent fetch failed");
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Wrapper error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 },
    );
  }
}
