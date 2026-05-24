import "server-only";

import { ApifyXProvider } from "@/lib/social/providers/apify-x-provider";
import { ParseForgeXProvider } from "@/lib/social/providers/parseforge-x-provider";
import type {
  FetchPostsInput,
  RawPost,
  SocialProviderResult,
} from "@/lib/social/types";

function dedupeAndSortPosts(posts: RawPost[]) {
  const seen = new Set<string>();
  const uniquePosts: RawPost[] = [];

  for (const post of posts) {
    const key = post.id || post.url;

    if (!key || seen.has(key)) continue;

    seen.add(key);
    uniquePosts.push(post);
  }

  return uniquePosts.sort(
    (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
  );
}

export async function fetchProfilePosts(
  input: FetchPostsInput,
): Promise<SocialProviderResult> {
  const targetLimit = input.limit ?? Number(process.env.APIFY_POST_LIMIT ?? 10);

  const providers = [new ParseForgeXProvider(), new ApifyXProvider()];

  const allPosts: RawPost[] = [];
  const usedProviders: string[] = [];
  const errors: string[] = [];

  for (const provider of providers) {
    try {
      console.log(`[SOCIAL_PROVIDER_START] ${provider.name}`);

      const posts = await provider.fetchPosts({
        ...input,
        limit: targetLimit,
      });

      console.log(`[SOCIAL_PROVIDER_SUCCESS] ${provider.name}`, {
        count: posts.length,
      });

      if (posts.length > 0) {
        usedProviders.push(provider.name);
        allPosts.push(...posts);
      }

      const mergedPosts = dedupeAndSortPosts(allPosts);

      if (mergedPosts.length >= targetLimit) {
        return {
          providerUsed: usedProviders.join(" + "),
          rawPosts: mergedPosts.slice(0, targetLimit),
        };
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown provider error";

      console.error(`[SOCIAL_PROVIDER_FAILED] ${provider.name}`, message);

      errors.push(`${provider.name}: ${message}`);
    }
  }

  const mergedPosts = dedupeAndSortPosts(allPosts);

  if (mergedPosts.length > 0) {
    return {
      providerUsed: usedProviders.join(" + "),
      rawPosts: mergedPosts.slice(0, targetLimit),
    };
  }

  throw new Error(
    `Could not fetch public posts from the configured providers. ${errors.join(
      " | ",
    )}`,
  );
}

// This is to check the limit of the actor if finished then run another actor

// for (const provider of providers) {
//   try {
//     console.log(`[SOCIAL_PROVIDER_START] ${provider.name}`);

//     const posts = await provider.fetchPosts({
//       ...input,
//       limit: targetLimit,
//     });

//     console.log(`[SOCIAL_PROVIDER_SUCCESS] ${provider.name}`, {
//       count: posts.length,
//     });

//     if (posts.length > 0) {
//       usedProviders.push(provider.name);
//       allPosts.push(...posts);
//     }

//     const mergedPosts = dedupeAndSortPosts(allPosts);

//     if (mergedPosts.length >= targetLimit) {
//       return {
//         providerUsed: usedProviders.join(" + "),
//         rawPosts: mergedPosts.slice(0, targetLimit),
//       };
//     }
//   } catch (error) {
//     const message =
//       error instanceof Error ? error.message : "Unknown provider error";

//     console.error(`[SOCIAL_PROVIDER_FAILED] ${provider.name}`, message);

//     errors.push(`${provider.name}: ${message}`);
//   }
// }
