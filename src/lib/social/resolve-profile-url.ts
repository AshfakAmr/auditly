import { z } from "zod";

export const resolvedProfileSchema = z.object({
  platform: z.enum(["X", "LINKEDIN"]),
  profileHandle: z.string().min(1),
  profileUrl: z.url(),
});

export type ResolvedProfile = z.infer<typeof resolvedProfileSchema>;

function cleanHandle(value: string) {
  return value.trim().replace(/^@/, "").replace(/\/$/, "").split("?")[0].trim();
}

export function resolveProfileUrl(input: string): ResolvedProfile {
  const value = input.trim();

  if (!value) {
    throw new Error("Profile URL or handle is required.");
  }

  if (value.startsWith("@")) {
    const handle = cleanHandle(value);

    return {
      platform: "X",
      profileHandle: handle,
      profileUrl: `https://x.com/${handle}`,
    };
  }

  if (!value.startsWith("http")) {
    const handle = cleanHandle(value);

    return {
      platform: "X",
      profileHandle: handle,
      profileUrl: `https://x.com/${handle}`,
    };
  }

  const url = new URL(value);
  const hostname = url.hostname.replace("www.", "").toLowerCase();
  const firstPathSegment = url.pathname.split("/").filter(Boolean)[0];

  if (!firstPathSegment) {
    throw new Error("Could not find a profile handle in the URL.");
  }

  if (hostname === "x.com" || hostname === "twitter.com") {
    const handle = cleanHandle(firstPathSegment);

    return {
      platform: "X",
      profileHandle: handle,
      profileUrl: `https://x.com/${handle}`,
    };
  }

  if (hostname === "linkedin.com") {
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (pathParts[0] !== "in" || !pathParts[1]) {
      throw new Error("Only LinkedIn personal profile URLs are supported.");
    }

    const handle = cleanHandle(pathParts[1]);

    return {
      platform: "LINKEDIN",
      profileHandle: handle,
      profileUrl: `https://www.linkedin.com/in/${handle}`,
    };
  }

  throw new Error("Only X/Twitter profiles are supported right now.");
}
