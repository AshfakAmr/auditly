import { NextResponse } from "next/server";

import { fetchProfilePosts } from "@/lib/social/fetch-profile-posts";
import { resolveProfileUrl } from "@/lib/social/resolve-profile-url";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        message: "Debug route is disabled in production.",
      },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const input = searchParams.get("profile") ?? "@sunnewstamil";

  const resolvedProfile = resolveProfileUrl(input);

  if (resolvedProfile.platform !== "X") {
    return NextResponse.json(
      {
        ok: false,
        message: "Only X/Twitter profiles are supported for this debug route.",
      },
      { status: 400 },
    );
  }

  const result = await fetchProfilePosts({
    profileUrl: resolvedProfile.profileUrl,
    profileHandle: resolvedProfile.profileHandle,
    limit: Number(process.env.APIFY_POST_LIMIT ?? 20),
  });

  return NextResponse.json({
    ok: true,
    profile: resolvedProfile,
    providerUsed: result.providerUsed,
    count: result.rawPosts.length,
    posts: result.rawPosts.map((post) => ({
      id: post.id,
      text: post.text.slice(0, 120),
      postedAt: post.postedAt,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      repostCount: post.repostCount,
      url: post.url,
    })),
  });
}
