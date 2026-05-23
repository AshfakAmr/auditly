import "server-only";

import { ApifyXProvider } from "@/lib/social/providers/apify-x-provider";
import type { FetchPostsInput, SocialProviderResult } from "@/lib/social/types";

export async function fetchProfilePosts(
  input: FetchPostsInput,
): Promise<SocialProviderResult> {
  const providers = [new ApifyXProvider()];
  const errors: string[] = [];

  for (const provider of providers) {
    try {
      const rawPosts = await provider.fetchPosts(input);

      return {
        providerUsed: provider.name,
        rawPosts,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown provider error";

      errors.push(`${provider.name}: ${message}`);
    }
  }

  throw new Error(
    `Could not fetch public posts from the configured providers. ${errors.join(
      " | ",
    )}`,
  );
}
