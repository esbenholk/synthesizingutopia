import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const limitNumber = parseInt(url.searchParams.get("limit") || "10", 10);
    const cursor = url.searchParams.get("cursor");
    const folders = url.searchParams.get("folders");
    const folder = url.searchParams.get("folder");

    const qs = new URLSearchParams();
    qs.set("limit", String(limitNumber));

    if (cursor) qs.set("cursor", cursor);

    // Prefer multiple folders, but keep single-folder support
    if (folders) {
      qs.set("folders", folders);
    } else if (folder) {
      qs.set("folder", folder);
    }

    const recentImagesResponse = await fetch(
      `${process.env.BASE_URL}/api/cloudinary/recent?${qs.toString()}`,
      { cache: "no-store" }
    );

    const data = await recentImagesResponse.json();

    if (!recentImagesResponse.ok) {
      throw new Error(data?.error || "Recent fetch failed");
    }

    return NextResponse.json({
      items: data.items || [],
      nextCursor: data.next_cursor || data.nextCursor || null,
    });
  } catch (error) {
    console.error("Wrapper error:", error);

    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}