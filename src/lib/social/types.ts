export type Platform = "X" | "LINKEDIN";

export type RawPost = {
  id: string;
  platform: Platform;
  profileHandle: string;
  url: string;
  text: string;
  postedAt: string;
  likeCount: number;
  commentCount: number;
  repostCount: number;
  viewCount?: number;
  raw?: unknown;
};

export type FetchPostsInput = {
  profileUrl: string;
  profileHandle: string;
  limit?: number;
};

export type SocialProviderResult = {
  providerUsed: string;
  rawPosts: RawPost[];
};

export interface SocialProvider {
  name: string;
  platform: Platform;
  fetchPosts(input: FetchPostsInput): Promise<RawPost[]>;
}
