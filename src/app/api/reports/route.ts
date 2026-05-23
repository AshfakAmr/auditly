import { NextResponse } from "next/server";
import * as z from "zod";

import { prisma } from "@/lib/db/prisma";
import { fetchProfilePosts } from "@/lib/social/fetch-profile-posts";
import { resolveProfileUrl } from "@/lib/social/resolve-profile-url";

export const runtime = "nodejs";

const createReportSchema = z.object({
  profileUrlOrHandle: z
    .string()
    .trim()
    .min(2, { error: "Enter a valid profile URL or handle." }),

  email: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.email({ error: "Enter a valid email address." }),
  ),
});

function toJsonValue<T>(value: T) {
  return JSON.parse(JSON.stringify(value));
}

function getLatestPost(rawPosts: { id: string; postedAt: string }[]) {
  return rawPosts
    .toSorted(
      (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
    )
    .at(0);
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = createReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid request.",
          errors: z.flattenError(parsed.error).fieldErrors,
        },
        { status: 400 },
      );
    }

    const { email, profileUrlOrHandle } = parsed.data;
    const resolvedProfile = resolveProfileUrl(profileUrlOrHandle);

    if (resolvedProfile.platform === "LINKEDIN") {
      return NextResponse.json(
        {
          ok: false,
          message:
            "LinkedIn analysis is coming soon. Please use a public X/Twitter profile for now.",
        },
        { status: 400 },
      );
    }

    const lead = await prisma.lead.upsert({
      where: {
        email,
      },
      update: {},
      create: {
        email,
      },
    });

    const { providerUsed, rawPosts } = await fetchProfilePosts({
      profileUrl: resolvedProfile.profileUrl,
      profileHandle: resolvedProfile.profileHandle,
      limit: Number(process.env.APIFY_POST_LIMIT ?? 30),
    });

    const latestPost = getLatestPost(rawPosts);

    if (!latestPost) {
      return NextResponse.json(
        {
          ok: false,
          message: "No public posts were found for this profile.",
        },
        { status: 400 },
      );
    }

    const existingReport = await prisma.report.findFirst({
      where: {
        platform: resolvedProfile.platform,
        profileHandle: resolvedProfile.profileHandle,
        latestPostId: latestPost.id,
        status: {
          in: ["PROCESSING", "COMPLETED"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        status: true,
        profileHandle: true,
        platform: true,
      },
    });

    if (existingReport) {
      return NextResponse.json({
        ok: true,
        reused: true,
        reportId: existingReport.id,
        reportUrl: `/report/${existingReport.id}`,
        report: existingReport,
      });
    }

    const report = await prisma.report.create({
      data: {
        leadId: lead.id,
        profileUrl: resolvedProfile.profileUrl,
        platform: resolvedProfile.platform,
        profileHandle: resolvedProfile.profileHandle,
        status: "PROCESSING",
        providerUsed,
        rawPosts: toJsonValue(rawPosts),
        postsAnalyzedCount: rawPosts.length,
        latestPostId: latestPost.id,
        latestPostDate: new Date(latestPost.postedAt),
      },
      select: {
        id: true,
        status: true,
        profileHandle: true,
        platform: true,
        providerUsed: true,
        postsAnalyzedCount: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        reused: false,
        reportId: report.id,
        reportUrl: `/report/${report.id}`,
        report,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[REPORT_CREATE_ERROR]", error);

    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while creating the report.";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 },
    );
  }
}
