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

function normalizeKey(key: string) {
  return key.toLowerCase().replaceAll("_", "").replaceAll("-", "");
}

function findDeepValue(
  value: unknown,
  possibleKeys: string[],
  depth = 0,
): unknown {
  if (!value || typeof value !== "object" || depth > 4) return undefined;

  const record = value as UnknownRecord;
  const normalizedPossibleKeys = possibleKeys.map(normalizeKey);

  for (const [key, itemValue] of Object.entries(record)) {
    if (normalizedPossibleKeys.includes(normalizeKey(key))) {
      return itemValue;
    }
  }

  for (const itemValue of Object.values(record)) {
    if (Array.isArray(itemValue)) continue;

    const found = findDeepValue(itemValue, possibleKeys, depth + 1);

    if (found !== undefined) {
      return found;
    }
  }

  return undefined;
}

function getString(item: UnknownRecord, keys: string[]) {
  const value = findDeepValue(item, keys);

  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);

  return "";
}

function getNumber(item: UnknownRecord, keys: string[]) {
  const value = findDeepValue(item, keys);

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replaceAll(",", ""));

    if (Number.isFinite(parsed)) {
      return parsed;
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

function getPostedAt(item: UnknownRecord) {
  const value = findDeepValue(item, [
    "createdAt",
    "created_at",
    "createdAtISO",
    "timestamp",
    "date",
    "postedAt",
    "time",
    "datetime",
    "publishedAt",
    "publicationDate",
  ]);

  if (typeof value === "number" && Number.isFinite(value)) {
    const timestamp = value < 10_000_000_000 ? value * 1000 : value;
    const parsed = new Date(timestamp);

    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return parsed.toISOString();
  }

  if (typeof value === "string" && value.trim()) {
    const trimmedValue = value.trim();
    const numericValue = Number(trimmedValue);

    if (Number.isFinite(numericValue)) {
      const timestamp =
        numericValue < 10_000_000_000 ? numericValue * 1000 : numericValue;

      const parsed = new Date(timestamp);

      if (Number.isNaN(parsed.getTime())) {
        return "";
      }

      return parsed.toISOString();
    }

    const parsed = new Date(trimmedValue);

    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return parsed.toISOString();
  }

  return "";
}

function mapApifyItemToRawPost(
  itemValue: unknown,
  profileHandle: string,
): RawPost | null {
  const item = asRecord(itemValue);

  const text = getString(item, [
    "text",
    "fullText",
    "full_text",
    "content",
    "tweetText",
    "postText",
    "description",
    "body",
  ]);

  const postedAt = getPostedAt(item);

  const url = getString(item, [
    "url",
    "tweetUrl",
    "postUrl",
    "twitterUrl",
    "xUrl",
    "link",
    "permalink",
  ]);

  const directId = getString(item, [
    "id",
    "idStr",
    "id_str",
    "tweetId",
    "postId",
    "conversationId",
    "statusId",
  ]);

  if (!text || !postedAt) {
    return null;
  }

  const id =
    directId ||
    getIdFromUrl(url) ||
    createFallbackId(text, postedAt, profileHandle);

  const likeCount = getNumber(item, [
    "likeCount",
    "likesCount",
    "likes",
    "favoriteCount",
    "favouriteCount",
    "favorite_count",
    "favourite_count",
  ]);

  const commentCount = getNumber(item, [
    "replyCount",
    "repliesCount",
    "replies",
    "commentCount",
    "comments",
  ]);

  const repostCount = getNumber(item, [
    "retweetCount",
    "retweetsCount",
    "retweets",
    "repostCount",
    "reposts",
    "quoteCount",
  ]);

  const viewCount = getNumber(item, [
    "viewCount",
    "viewsCount",
    "views",
    "impressionCount",
    "impressions",
  ]);

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

export class ApifyXProvider implements SocialProvider {
  name = "apify:scraper_one/x-profile-posts-scraper" as const;
  platform = "X" as const;

  async fetchPosts(input: FetchPostsInput): Promise<RawPost[]> {
    const token = process.env.APIFY_TOKEN;

    if (!token) {
      throw new Error("APIFY_TOKEN is missing. Add it to your .env file.");
    }

    const actorId =
      process.env.APIFY_X_SCRAPERONE_ACTOR_ID ??
      "scraper_one/x-profile-posts-scraper";

    const limit = input.limit ?? Number(process.env.APIFY_POST_LIMIT ?? 10);

    const client = new ApifyClient({
      token,
    });

    const run = await client.actor(actorId).call({
      profileUrls: [input.profileUrl],
      resultsLimit: limit,
    });

    if (!run.defaultDatasetId) {
      throw new Error("Apify actor did not return a dataset.");
    }

    const { items } = await client
      .dataset(run.defaultDatasetId)
      .listItems({ limit });

    if (items.length === 0) {
      throw new Error(
        "Provider returned zero posts. This may be because the Apify free account rate limit was reached. Try again later or upgrade the Apify plan.",
      );
    }

    console.log("[APIFY_X_PROVIDER_ITEMS_COUNT]", items.length);
    console.log(
      "[APIFY_X_PROVIDER_FIRST_ITEM]",
      JSON.stringify(items[0], null, 2),
    );

    const posts = items
      .map((item) => mapApifyItemToRawPost(item, input.profileHandle))
      .filter((post): post is RawPost => Boolean(post))
      .sort(
        (a, b) =>
          new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
      );

    if (posts.length === 0) {
      throw new Error(
        `No usable public posts were returned by the provider. Dataset items count: ${items.length}`,
      );
    }

    return posts;
  }
}
