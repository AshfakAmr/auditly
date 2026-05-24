import { NextResponse } from "next/server";
import * as z from "zod";

import { buildDeterministicAudit } from "@/lib/audit/build-deterministic-audit";

import { runGeminiAudit } from "@/lib/ai/run-gemini-audit";

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

    // 1. Cache-first reuse: no Apify, no Gemini
    const cacheWindowHours = Number(
      process.env.REPORT_CACHE_WINDOW_HOURS ?? 24,
    );
    const cacheWindowStart = new Date(
      Date.now() - cacheWindowHours * 60 * 60 * 1000,
    );

    const recentCompletedReport = await prisma.report.findFirst({
      where: {
        platform: resolvedProfile.platform,
        profileHandle: resolvedProfile.profileHandle,
        status: "COMPLETED",
        createdAt: {
          gte: cacheWindowStart,
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
        providerUsed: true,
        postsAnalyzedCount: true,
      },
    });

    if (recentCompletedReport) {
      return NextResponse.json({
        ok: true,
        reused: true,
        cacheHit: true,
        reportId: recentCompletedReport.id,
        reportUrl: `/report/${recentCompletedReport.id}`,
        report: recentCompletedReport,
      });
    }

    // 2. No recent cache, now fetch posts
    const { providerUsed, rawPosts } = await fetchProfilePosts({
      profileUrl: resolvedProfile.profileUrl,
      profileHandle: resolvedProfile.profileHandle,
      limit: Number(process.env.APIFY_POST_LIMIT ?? 10),
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

    // 3. If latest post already matches an old report, skip Gemini
    const existingReport = await prisma.report.findFirst({
      where: {
        platform: resolvedProfile.platform,
        profileHandle: resolvedProfile.profileHandle,
        latestPostId: latestPost.id,
        status: "COMPLETED",
      },
      orderBy: {
        createdAt: "desc",
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

    if (existingReport) {
      return NextResponse.json({
        ok: true,
        reused: true,
        cacheHit: false,
        reportId: existingReport.id,
        reportUrl: `/report/${existingReport.id}`,
        report: existingReport,
      });
    }

    // 4. Only now run metrics + Gemini
    const { normalizedPosts, metrics } = buildDeterministicAudit(rawPosts);

    const { classifications, finalReport } = await runGeminiAudit({
      normalizedPosts,
      metrics,
    });

    const report = await prisma.report.create({
      data: {
        leadId: lead.id,
        profileUrl: resolvedProfile.profileUrl,
        platform: resolvedProfile.platform,
        profileHandle: resolvedProfile.profileHandle,
        status: "COMPLETED",
        providerUsed,
        rawPosts: toJsonValue(rawPosts),
        normalizedData: toJsonValue(normalizedPosts),
        metrics: toJsonValue(metrics),
        classifications: toJsonValue(classifications),
        finalReport: toJsonValue(finalReport),
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
