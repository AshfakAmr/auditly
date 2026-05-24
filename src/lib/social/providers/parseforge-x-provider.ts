import "server-only";

import { createHash } from "node:crypto";
import { ApifyClient } from "apify-client";

import type {
  FetchPostsInput,
  RawPost,
  SocialProvider,
} from "@/lib/social/types";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function getByPath(item: UnknownRecord, path: string): unknown {
  if (path in item) return item[path];

  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as UnknownRecord)[key];
  }, item);
}

function getString(item: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = getByPath(item, key);

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
}

function getNumber(item: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = getByPath(item, key);

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value.replaceAll(",", ""));

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

function createFallbackId(
  text: string,
  postedAt: string,
  profileHandle: string,
) {
  return createHash("sha256")
    .update(`${profileHandle}:${postedAt}:${text}`)
    .digest("hex")
    .slice(0, 24);
}

function getIdFromUrl(url: string) {
  const match = url.match(/status\/(\d+)/);
  return match?.[1] ?? "";
}

function parseDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString();
}

function mapParseForgeItemToRawPost(
  itemValue: unknown,
  profileHandle: string,
): RawPost | null {
  const item = asRecord(itemValue);

  const text = getString(item, ["fullText", "text", "postText"]);

  const url = getString(item, ["url", "twitterUrl", "postUrl"]);

  const createdAt = getString(item, [
    "createdAt",
    "timestamp",
    "scrapedTimestamp",
  ]);

  const postedAt = parseDate(createdAt);

  if (!text || !postedAt) {
    return null;
  }

  const directId = getString(item, [
    "id",
    "postId",
    "conversationId",
    "tweetId",
  ]);

  const id =
    directId ||
    getIdFromUrl(url) ||
    createFallbackId(text, postedAt, profileHandle);

  const likeCount = getNumber(item, [
    "likeCount",
    "favoriteCount",
    "favouriteCount",
  ]);

  const commentCount = getNumber(item, [
    "replyCount",
    "commentCount",
    "comments",
  ]);

  const retweetCount = getNumber(item, ["retweetCount", "repostCount"]);
  const quoteCount = getNumber(item, ["quoteCount"]);
  const repostCount = retweetCount + quoteCount;

  const viewCount = getNumber(item, ["viewCount", "views", "impressionCount"]);

  return {
    id,
    platform: "X",
    profileHandle,
    url: url || `https://x.com/${profileHandle}/status/${id}`,
    text,
    postedAt,
    likeCount,
    commentCount,
    repostCount,
    viewCount: viewCount || undefined,
    raw: itemValue,
  };
}

export class ParseForgeXProvider implements SocialProvider {
  name = "apify:parseforge/x-com-scraper" as const;
  platform = "X" as const;

  async fetchPosts(input: FetchPostsInput): Promise<RawPost[]> {
    const token = process.env.APIFY_TOKEN;

    if (!token) {
      throw new Error("APIFY_TOKEN is missing. Add it to your .env file.");
    }

    const actorId =
      process.env.APIFY_X_PARSEFORGE_ACTOR_ID ?? "parseforge/x-com-scraper";

    const limit = input.limit ?? Number(process.env.APIFY_POST_LIMIT ?? 10);

    const client = new ApifyClient({
      token,
    });

    const run = await client.actor(actorId).call({
      startUrls: [
        {
          url: input.profileUrl,
        },
      ],
      maxItems: limit,
    });

    if (!run.defaultDatasetId) {
      throw new Error("ParseForge actor did not return a dataset.");
    }

    const { items } = await client
      .dataset(run.defaultDatasetId)
      .listItems({ limit });

    if (items.length === 0) {
      throw new Error("ParseForge returned zero posts.");
    }

    const posts = items
      .map((item) => mapParseForgeItemToRawPost(item, input.profileHandle))
      .filter((post): post is RawPost => Boolean(post))
      .sort(
        (a, b) =>
          new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
      );

    if (posts.length === 0) {
      throw new Error("ParseForge returned posts, but none were usable.");
    }

    return posts;
  }
}
