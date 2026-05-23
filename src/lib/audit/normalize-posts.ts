import type { MediaType, NormalizedPost, RawPost } from "@/lib/social/types";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function detectMediaType(rawPost: RawPost): MediaType {
  const raw = asRecord(rawPost.raw);
  const media = raw.media;

  if (Array.isArray(media) && media.length > 0) {
    const mediaText = JSON.stringify(media).toLowerCase();

    if (media.length > 1) return "carousel";
    if (mediaText.includes("video")) return "video";
    if (mediaText.includes("photo") || mediaText.includes("image")) return "image";

    return "image";
  }

  const text = rawPost.text.toLowerCase();

  if (text.includes("http://") || text.includes("https://")) return "link";

  return "text";
}

function getFirstLine(text: string) {
  return (
    text
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean) ?? text.trim()
  );
}

export function normalizePosts(rawPosts: RawPost[]): NormalizedPost[] {
  return rawPosts
    .map((post) => {
      const likeCount = post.likeCount ?? 0;
      const commentCount = post.commentCount ?? 0;
      const repostCount = post.repostCount ?? 0;
      const totalEngagement = likeCount + commentCount + repostCount;

      return {
        id: post.id,
        platform: post.platform,
        profileHandle: post.profileHandle,
        url: post.url,
        text: post.text.trim(),
        firstLine: getFirstLine(post.text),
        postedAt: new Date(post.postedAt).toISOString(),
        mediaType: detectMediaType(post),
        engagement: {
          likeCount,
          commentCount,
          repostCount,
          viewCount: post.viewCount,
          totalEngagement,
        },
        raw: post.raw,
      } satisfies NormalizedPost;
    })
    .sort(
      (a, b) =>
        new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
    );
}