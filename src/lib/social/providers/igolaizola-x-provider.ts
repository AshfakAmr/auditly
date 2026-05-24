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

function getString(item: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = item[key];

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
    const value = item[key];

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

function isReply(item: UnknownRecord) {
  const replyingTo = item.replyingTo;

  if (Array.isArray(replyingTo)) {
    return replyingTo.length > 0;
  }

  if (typeof replyingTo === "string") {
    return replyingTo.trim().length > 0;
  }

  return Boolean(replyingTo);
}

function isRetweet(item: UnknownRecord) {
  return item.isRetweet === true || Boolean(getString(item, ["retweetedBy"]));
}

function mapIgolaizolaItemToRawPost(
  itemValue: unknown,
  profileHandle: string,
): RawPost | null {
  const item = asRecord(itemValue);

  // Extra safety: even though actor input excludes these, keep code-level guard.
  if (isReply(item) || isRetweet(item)) {
    return null;
  }

  const text = getString(item, ["text", "fullText", "html"]);
  const url = getString(item, ["permalink", "url", "twitterUrl"]);
  const createdAt = getString(item, ["createdAt", "displayTime"]);

  const postedAt = parseDate(createdAt);

  if (!text || !postedAt) {
    return null;
  }

  const directId = getString(item, ["id", "postId", "tweetId"]);
  const id =
    directId ||
    getIdFromUrl(url) ||
    createFallbackId(text, postedAt, profileHandle);

  const likeCount = getNumber(item, ["likes", "likeCount", "favoriteCount"]);
  const commentCount = getNumber(item, [
    "comments",
    "replyCount",
    "commentCount",
  ]);

  const retweetCount = getNumber(item, ["retweets", "retweetCount"]);
  const quoteCount = getNumber(item, ["quotes", "quoteCount"]);
  const repostCount = retweetCount + quoteCount;

  const viewCount = getNumber(item, ["views", "viewCount", "impressionCount"]);

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

export class IgolaizolaXProvider implements SocialProvider {
  name = "apify:igolaizola/x-twitter-scraper-ppe" as const;
  platform = "X" as const;

  async fetchPosts(input: FetchPostsInput): Promise<RawPost[]> {
    const token = process.env.APIFY_TOKEN;

    if (!token) {
      throw new Error("APIFY_TOKEN is missing. Add it to your .env file.");
    }

    const actorId =
      process.env.APIFY_X_IGOLAIZOLA_ACTOR_ID ??
      "igolaizola/x-twitter-scraper-ppe";

    const limit = input.limit ?? Number(process.env.APIFY_POST_LIMIT ?? 20);

    const client = new ApifyClient({
      token,
    });

    const run = await client.actor(actorId).call({
      maxItems: limit,
      username: input.profileHandle,

      // Original posts only.
      replies: "exclude",
      retweets: "exclude",
      quotes: "exclude",
    });

    if (!run.defaultDatasetId) {
      throw new Error("Igolaizola actor did not return a dataset.");
    }

    const { items } = await client
      .dataset(run.defaultDatasetId)
      .listItems({ limit });

    if (items.length === 0) {
      throw new Error("Igolaizola returned zero posts.");
    }

    const posts = items
      .map((item) => mapIgolaizolaItemToRawPost(item, input.profileHandle))
      .filter((post): post is RawPost => Boolean(post))
      .sort(
        (a, b) =>
          new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
      );

    if (posts.length === 0) {
      throw new Error("Igolaizola returned posts, but none were usable.");
    }

    return posts;
  }
}
