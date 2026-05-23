import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { resolveProfileUrl } from "@/lib/social/resolve-profile-url";

export const runtime = "nodejs";

const createReportSchema = z.object({
  profileUrlOrHandle: z
    .string()
    .trim()
    .min(2, "Enter a valid profile URL or handle."),
  email: z.string().trim().email("Enter a valid email address."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message: "Invalid request.",
          errors: parsed.error.flatten().fieldErrors,
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

    const report = await prisma.report.create({
      data: {
        leadId: lead.id,
        profileUrl: resolvedProfile.profileUrl,
        platform: resolvedProfile.platform,
        profileHandle: resolvedProfile.profileHandle,
        status: "PROCESSING",
      },
      select: {
        id: true,
        status: true,
        profileHandle: true,
        platform: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
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
